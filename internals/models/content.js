'use strict';
const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const path = require('path');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const Ajv = require('ajv');
const ajv = new Ajv();
const merge = require('lodash.merge');
const apiSubDir = 'api/v1';

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

class Storage {

  /**
   * @param {object} config Loaded Config object.
   */
  constructor(site, config) {
    this.sitesDir = config.get('sitesDir');
    this.siteDir = path.join(this.sitesDir, site);
    this.schemasDir = config.get('schemasDir');
    this.siteInfo = new Site(this.sitesDir);
    this.schemaName = this.siteInfo.getConfigItem(site,'schema'); 
    this.schema = new Schema(path.join(this.schemasDir, this.schemaName));
    this.directory = this.siteDir + '/collections';
    this.apiDir = path.join(config.get('buildDir'), site, apiSubDir, 'collections');
    this.loadedSchema = [];
    this.registry = {};
    this.schemaMap = this.schema.mapSettings();
    this.references = this.schema.getConfigItem('references');
    this.collections = this.schema.getConfigItem('collections');
    this.map = this.schema.mapSettings();

    // TODO: Export to function where we can see if file exists. Make hooks
    // opt-in instead of mandatory.
    this.Hook = require(path.join(this.schemasDir, this.schemaName, 'hooks/Content.js'));
  }

  requiredFields () {
    return ['identifier', 'title', 'created', 'modified'];
  }

  addPath() {

  }

  init() {}

  count() {}

  findByIdentifier(){}

  insertOne() {}

  insertMany() {}

  update() {}

  delete() {}
}

class FileStorage extends Storage {

  constructor(site, config) {
    super(site, config);
  }

  // Ref, Deref, and Map are the functions that transform docs
  // between states.
  // A doc is:
  // * stored in a referenced state
  // * edited in a referenced and mapped state
  // * viewed in a dereferenced and mapped state.

  /**
   * Adds referenced data to collection using 'interra-reference' key.
   * @param {object} doc Doc to dereference.
   * @return {object} dereferenced doc.
   */
  Deref(doc, callback) {
    let that = this;
    let referencedCollections = [];
    if (!this.references) {
      return callback(null, doc);
    }
    that.Hook.preDereference(doc,(err, pre) => {
      let refNum = 0;
      Async.eachSeries(this.references, function(collections, done) {
        Async.eachOfSeries(collections, function(collection, field, fin) {
          let refCollection = Object.keys(that.references)[refNum];
          if (field in pre) {
            // 'interra-reference' can be applied to a string or
            // array. Convert to array if string.
            if (pre[field].length == undefined) {
              pre[field] = [pre[field]];
            }
            Async.eachOfSeries(pre[field], function(item, val, over) {
              let reference = {};
              if ('interra-reference' in item) {
                let file = collection + '/' + item['interra-reference'] + '.yml';
                if (!fs.existsSync(that.directory + '/' + file)) {
                  // TODO: Throw a bigger error. 'interra-reference' stays in doc.
                  return over("Doc contains reference file " + file + " from " + field + " field that does not exist.", null);
                }
                else {
                  reference[field] = file;
                  referencedCollections.push(reference);
                  return over();
                }
              }
            }, function(err) {
              if (err) {
                fin(err);
              }
              else {
                if (!(refCollection in that.loadedSchema)) {
                  that.schema.load(refCollection, function(err, schema) {
                    that.loadedSchema[refCollection] = schema;
                  });
                }
                // Reset field so we can put dereferenced values in.
                let type = that.loadedSchema[refCollection].properties[field].type;
                if (type === 'array') {
                  pre[field] = [];
                }
                else if (type === 'object') {
                  pre[field] = {};
                }
                else {
                  pre[field] = '';
                }
                fin();
              }
            });
          }
        }, function(err) {
          if (err) {
            return done(err);
          }
          else {
            refNum++;
            done();
          }
        });
      }, function(err) {
        if (err) return callback(err, null);
      });
      Async.mapValuesSeries(referencedCollections, that.loadWithField.bind(that), function(err, results)  {
        Async.eachSeries(results, function(result, over) {
          let refNum = 0;
          let field = Object.keys(result)[0];
          let value = Object.values(result)[0];
          Async.eachSeries(that.references, function(collections, done) {
            let refCollection = Object.keys(that.references)[refNum];
            if (field in that.loadedSchema[refCollection].properties) {
              let type = that.loadedSchema[refCollection].properties[field].type;
              if (type === 'array') {
                pre[field].push(value);
              }
              else {
                pre[field] = value;
              }
              refNum++;
              done();
            }
          }, function (err) {
          over();
          });
        });
        that.Hook.postDereference(pre,(err, post) => {
          return callback(null, post);
        });
      });
    });
  }

  /**
   * Adds references identified in the schema config.yml file.
   * @param {object} doc Doc to add references.
   * @param {object} refs Object with key as collection and value as ref ids.
   * @return {object} Doc with 'interra-reference' internal references.
   */
  Ref(doc, callback) {
    const that = this;
    if (!this.references) {
      return callback(null, doc);
    }
    let ref = {};
    that.Hook.preReference(doc,(err, pre) => {
      let refNum = 0;
      Async.eachSeries(this.references, function(collections, done) {
        Async.eachOfSeries(collections, function(collection, field, fin) {
          let refCollection = Object.keys(that.references)[refNum];
          ref = collection in ref ? ref[collection] : {};
          if (field in pre) {
            if (!(refCollection in that.loadedSchema)) {
              that.schema.load(refCollection, function(err, schema) {
                that.loadedSchema[refCollection] = schema;
              });
            }
            // Reset field so we can put dereferenced values in.
            let type = that.loadedSchema[refCollection].properties[field].type;
            if (type === 'array') {
              let items = pre[field];
              pre[field] = [];
              Async.eachOfSeries(items, function(item, val, over) {
                if (field in ref && refField.indexOf(val) !== -1) {
                  pre[field] = {'interra-reference': ref[field][val]};
                }
                else {
                  pre[field].push({'interra-reference' : that.createCollectionFileName(item.identifier)});
                }
                over();
              });
            }
            else if (type === 'object') {
              if (field in ref) {
                pre[field] = {'interra-reference': ref[field]}
              }
              else {
                pre[field] = {'interra-reference' : that.createCollectionFileName(pre[field].identifier)};
              }
            }
          }
          fin();
        }, function(err) {
          if (err) {
            return callback(err, null);
          }
          else {
            done();
          }
        });
      }, function(err) {
        if (err) {
          return callback(err, null);
        }
        else {
          return callback(null, pre);
        }
      });
    });
  }

  /**
   * Applies map to doc.
   * @param {object} doc Doc to apply map to.
   * @param {string} collection Collection of doc.
   * @return {object} Mapped doc.
   */
  Map(doc, collection, callback) {
    if (collection in this.map) {
      Async.each(this.map, (mapcoll, done) => {
        Async.eachOfSeries(mapcoll, (mapField, currentField, fin) => {
          if (currentField in doc) {
            doc[mapField] = doc[currentField];
            delete doc[currentField];
          }
          fin();
        });
        done();
      }, function(err) {
        if (err) {
          return callback(err, null);
        }
        else {
          return callback(null, doc);
        }
      });
    }
    else {
      return callback(null, doc);
    }
  }

  getRefField(collection, field) {
    if (collection in this.references) {
      if (field in this.references[field]) {
        return this.references[field];
      }
    }
    return field;
  }

  /**
   * Gets the reference fields and values from a doc. Use with Ref if importing.
   * @param {object} doc Doc to retrieve references.
   * @return {object} Object with keys for collections and field value for refs.
   */
  refCollections(doc, collection, callback) {
    let that = this;
    if (!this.references || !(collection in this.references)) {
      return callback(null, {});
    }
    const references = this.references[collection];
    Async.mapValues(references, (ref, key, done) => {
      if (key in doc) {
        done(null, doc[key]);
      }
      else {
        done();
      }
    }, function(err, result) {
      callback(err, result);
    });
  }

  /**
   * Creates a reference to be used as 'interra-reference' value.
   * @param {string} identifier Item to be prepared for reference value.
   * @return {string} Value for reference.
   */
  createCollectionFileName(identifier) {
    // TODO: user path if available.
    return slug(identifier);
  }

  /**
   * Validates whether a doc contains required fields.
   * @param {object} doc Doc to validate.
   * @param {boolean} routeCollection Whether doc is part of collection with routes.
   * @return {boolean} True if doc validates.
   */
  validateRequired(doc, collection, callback) {
    const that = this;
    const fiveGoldenFields = this.requiredFields();
    Async.each(fiveGoldenFields, function(field, done) {
      if (collection in that.map) {
        if (Object.values(that.map[collection]).indexOf(field) !== -1) {
          let values = Object.values(that.map[collection]);
          let keys = Object.keys(that.map[collection]);
          field = keys[values.indexOf(field)];
        }
      }
      if (!(field in doc)) {
        return done(field + " field is required.");
      }
      else {
        return done();
      }
    }, function(err) {
      if (err) {
        return callback(err, false);
      }
      else {
        return callback(null, true);
      }
    });
  }

  /**
   * Validates doc based on schema. The schema is determined by the collection.
   * @param {object} doc - The {@link doc}.
   * @param {string} collection - The {@link collection};
   * @return {boolean} True if the {@link doc} is valid.
   */
  validateDoc(doc, collection, callback) {
    this.schema.dereference(collection, (err, schema) => {
      if (err) return callback(err);
      const valid = ajv.validate(schema, doc);
      if (!valid) {
         return callback(ajv.errors);
      }
      else {
        return callback(false, true);
      }
    });
  }

  /**
   * Validates doc based on schema that includes "interra-reference"..
   * @param {object} doc - The {@link doc}.
   * @param {string} collection - The {@link collection};
   * @return {boolean} True if the {@link doc} is valid.
   */
  validateDocToStore(doc, collection, callback) {
    this.schema.reference(collection, (err, schema) => {
      if (err) return callback(err);
      const valid = ajv.validate(schema, doc);
      if (!valid) {
         return callback(ajv.errors);
      }
      else {
        return callback(false, true);
      }
    });
  }

  /**
   * Checks whether item with same identifier exists.
   * @param {string} identifier - {@link identifier} to check.
   * @param {string} collection - {@link collection} to use.
   * @return {string} Returns interra id for identifier if it exists.
   */
  validateUnique(identifier, collection, callback) {
    const that = this;
    this.buildRegistry((err, result) => {
      Async.detect(that.registry[collection], (id, done) => {
        if (identifier === Object.values(id)[0]) {
          done(null, true);
        }
        else {
          done(null);
        }
      }, (err, res) => {
        const result = res === undefined ? null : Object.keys(res)[0];
        callback(err, result);
      });
    });
  }

  /**
   * Like insertOne but outputs to json.
   * @param {string} identifier
   */
  exportOne(interraId, collection, doc, callback) {
    this.Hook.preOutput(interraId, collection, doc, (err, identifier, collection, content) => {
      fs.ensureDirSync(path.join(this.apiDir, collection));
      const file = path.join(this.apiDir, collection, interraId + '.json');
      fs.writeJson(file, content, err => {
        if (err) return callback(err);
        this.Hook.postOutput(content, (err, content) => {
          if (err) return callback(err);
          return callback(null, content);
        });
      });
    });
  }

  /**
   * Writes many docs to the filesystem from a single collection.
   * @param {array} docs Array of docs.
   * @param {string} collection Collection to export.
   */
  exportMany(docs, collection, callback) {
    const that = this;
    Async.eachSeries(docs, function(doc, done) {
      that.exportOne(doc.interra.id, collection, doc, (err, item) => {
        if (err) return done(err);
        done(null);
      })
    }, function(err) {
      callback(err);
    });
  }

  /**
   * Provides default logic and hook to build route.
   * @param {string} routeString String to apply rules. Suggest title or identifier.
   * @return {string} A route.
   */
  buildInterraId(idString) {
    if ('buildInterraId' in this.Hook) {
      return this.Hook.buildInterraId(idString);
    }
    else {
      return slug(idString).substring(0,25).toLowerCase();
    }
  }

  /**
   * Autoincrements if value not found. Starts with last '-' in string. If it is
   * a number it increments, if not it add '-0';
   * @param {string} route URL safe string.
   * @param {array} routes Routes to check against.
   * @return {string} Route that does not exist in routes.
   */
  buildInterraIdSafe(id, ids) {
    let safe = false;
    let safeId = id.trim();
    let counter = 0;
    let last = '';
    while (!safe) {
      // safeId not in routes so current safeRoute is safe.
      if (ids.indexOf(safeId) === -1) {
        safe = true;
      }
      else {
        if (safeId.lastIndexOf('-')) {
          last = safeId.substring(safeId.lastIndexOf('-') + 1, safeId.length);
          // Javascript's isNumeric().
          if (!isNaN(last)) {
            last = Number(last) + 1;
            safeId = safeId.substring(0, safeId.lastIndexOf('-')) + '-' + last;
          }
          else {
            safeId = safeId + '-' + 0;
          }
        }
        else {
          safeId = safeId + '-' + 0;
        }
      }
      // To prevent a race condition.
      counter++;
      if (counter > 10000) {
        safe = true;
      }
    }
    return safeId;
  }

  /**
   * Retrieves routes from file system.
   * @param {string} collection
   * @return {array} Array of routes.
   */
  getRoutes(collection, callback) {
    fs.readdir(this.directory + '/' + collection, function(err, items) {
      let routes = [];
      for (let n in items) {
        // Remove .yml filename.
        routes.push(items[n].substring(0, items[n].length - 4 ));
      }
      callback(null, routes);
    });
  }

  /**
   * Retrieves a field by the field it is being mapped to.
   * @param {string} collection Collection of the field.
   * @param {string} field Field value to search.
   * @return {string} Mapped field or original value.
   */
  getMapFieldByValue(collection, field) {
    if (collection in this.map) {
      let fields = Object.values(this.map[collection]);
      if (fields.indexOf(field) !== -1) {
        return Object.keys(this.map[collection])[fields.indexOf(field)];
      }
    }
    return field;
  }

  getIdentifierField(collection) {
    if (collection in this.map) {
      const fields = Object.values(this.map[collection]);
      if (fields.indexOf("identifier") !== -1) {
        return Object.keys(this.map[collection])[fields.indexOf("identifier")];
      }
    }
    return 'identifier';
  }

  getRegistryIdentifier(collection, interraId) {
    if (collection in this.registry) {
      const ids = Object.values(this.registry[collection]);
      if (ids.indexOf(interraId) !== -1) {
        return ids[interraId];
      }
      else {
        return null;
      }
    }
    return null;
  }

  getRegistryInterraId(collection, identifier) {
    if (collection in this.registry) {
      const ids = Object.keys(this.registry[collection]);
      if (ids.indexOf(identifier) !== -1) {
        return ids[identifier];
      }
      else {
        return null;
      }
    }
    return null;
  }

  /**
   * Builds fulll registry.
   * @return {object} Keyed by collections with {identifier: interraId} objects.
   */
  buildRegistry(callback) {
    const collections = this.collections.reduce((acc, cur, i) => {
      acc = Object.assign(acc, {[cur]: []});
      return acc;
    }, {});
    const that = this;
    Async.mapValues(collections, (i, collection, fin) => {
      const identifier = this.getIdentifierField(collection);
      this.findByCollection(collection, false, (err, docs) => {
        Async.map(docs, (doc, done) => {
          done(null, { [doc[identifier]]: doc.interra.id });
        }, function(err, result) {
          fin(null, result);
        });
      });
    }, function(err, results) {
      that.registry = results;
      callback(err, results);
    });
  }

  /**
   * Builds registry for a collection with a "identifier" : "interraId" object.
   * @param {string} collection - A {@link collection}.
   * @return {object} A built registry.
   */
  buildRegistryCollection(collection, callback) {
    const that = this;
    const identifier = this.getIdentifierField(collection);
    this.findByCollection(collection, false, (err, result) => {
      that.registry[collection] = {};
      Async.each(result, (doc, done) => {
        that.registry[collection][doc[identifier]] = doc.interra.id;
        done();
      }, function(err) {
        if (err) {
          return callback(err);
        }
        else {
          return callback(null, that.registry[collection]);
        }
      });
    });
  }

  /**
   * Adds item to the registry. Updates existing value if exists.
   * @param {object} item - Object with "identifier" : "interraId" pair.
   * @param {string} collection - A {@link collection}.
   * @return {object} An updated registry for that collection.
   */
  addToRegistry(item, collection) {
    if (!(collection in this.registry)) {
      this.registry[collection] = [];
    }
    this.registry[collection].push(item);
    return true;
  }

  /**
   * Removes item from the registry.
   * @param {string} identifier - Identifier for item to remove.
   * @param {string} collection - A {@link collection}.
   * @return {object} An updated registry for that collection.
   */
  removeFromRegistry(identifier, collection) {
    this.registry[collection] = this.registry[collection].filter((obj) => {
      if (identifier in obj) {
        return false;
      }
      else {
        return true;
      }
    });
  }

  /**
   * Updates an existing document.
   */
  updateOne(interraId, collection, doc, callback) {
    const that = this;
    this.findByInterraId(interraId, collection, (err, existingDoc) => {
      this.createRevision(collection, existingDoc);
      if (err) return callback(err);
      const newDoc = merge(existingDoc, doc);
      this.insertOne(interraId, collection, newDoc, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
      });
    });
  }

  /**
   * Replaces an existing document.
   */
  replaceOne(interraId, collection, doc, callback) {
    this.findByInterraId(interraId, collection, (err, existingDoc) => {
      this.createRevision(collection, existingDoc);
      if (err) return callback(err);
      this.insertOne(interraId, collection, doc, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
      });
    });
  }

  /**
   * Reverts doc to revision.
   */
  revertOne(interraId, collection, revisionId, callback) {
    const file = this.directory + '/' + collection + '/rev/' + interraId + '.json';
    let revisions = fs.readJsonSync(file);
    const revision = revisions[revisionId];
    delete revisions[revisionId];
    if (revision.length) {
        fs.outputFileSync(file, revision);
    }
    else {
      fs.unlink(file);
    }
    this.insertOne(interraId, collection, revision, (err, doc) => {
      callback(err, doc);
    });
  }

  /**
   * Creates revision.
   */
  createRevision(collection, doc) {
    const interraId = doc.interra.id;
    // Temp using json until this lands https://github.com/jeremyfa/yaml.js/pull/99
    const file = this.directory + '/' + collection + '/rev/' + interraId + '.json';
    let revisions = [];
    if (fs.existsSync(file)) {
      revisions = fs.readJsonSync(file);
    }
    revisions.push(doc);
    fs.writeJsonSync(file, revisions);
    return revisions;
  }

  /**
   * Deletes doc.
   * @param {string} route - The {@link route}
   * @param {string} collection - The {@link collection}
   * @return {boolean} True if the file is removed.
   */
  deleteOne(interraId, collection, callback) {
    const file = this.directory + '/' + collection + '/' + interraId + '.yml';
    fs.unlink(file, (err) => {
      if (err) return callback(err);
      return callback(false, true);
    })
  }

  /**
   * Inserts doc into file system. Does not care if file exists.
   * Files are saved as [colllection]/[route].yml.
   * @param {string} route The filename to save as without .yml
   * @param {string} collection The folder to save in.
   * @param {object} doc The doc.
   * @return {boolean} True if file saves correctly. The return error is keyed
   * with the type of error, "schema" or "file":
   * err = {
   * "schema|file": {
   *   "collection": ,
   *   "interraId": ,
   *   "error": ,
   *   }
   * }
   *
   */
  insertOne(interraId, collection, doc, callback) {
    this.Hook.preSave(interraId, collection, doc, (err, interraId, collection, doc) => {
      // Validate required.
      this.validateRequired(doc, collection, (validerr, validresult) => {
        if (validerr) {
          return callback(validerr);
        }
        // Validate schema.
        this.validateDocToStore(doc, collection, (schemaErr, result) => {
          const file = this.directory + '/' + collection + '/' + interraId + '.yml';
          const yml = YAML.stringify(doc, 20, 2);
          fs.outputFile(file, yml, err => {
            if (err) return callback(err);
            this.Hook.postSave(doc, (err, doc) => {
              if (schemaErr) {
                return callback({"type": "schema", "collection": collection, "interraId": interraId, "error": schemaErr}, doc);
              }
              else if (err) {
                return callback({"type": "file", "collection": collection, "interraId": interraId, "error": err}, doc);
              }
              else {
                return callback(schemaErr, doc);
              }
            });
          });
        });
      });
    });

  }

  /**
   * Saves multiple docs.
   * @param {array} docs An Array of <doc>.
   * @return {boolean} True if succesful.
   */
  insertMany(docs, callback) {
    Async.eachSeries(docs, function(content, done) {
      insertOne(content.identifier, content.collection, content, (err, items) => {
        if (err) return done(err);
        done(null);
      })
    }, function(err) {
      if (err) return callback(err);
      return callback(null, true);
    });
  }

  /**
   * Counts number of docs in a collection.
   * @param {string} collection The collection to query.
   */
  count(collection, callback) {
    this.list(collection, function(err, list) {
      const len = list ? list.length : 0;
      callback(err, len);
    });
  }

  /**
   * Retrieves list of files by collecion.
   * @param {string} collection The collection to query.
   * @return {array} list of documents.
   */
  list(collection, callback) {
    var dir = this.directory + '/' + collection;
    fs.readdir(dir, function(err, items) {
      var t;
      let output = [];
      for (t in items) {
        // Folder may contain rev folder for revisions.
        if (items[t] !== 'rev') {
          output.push(collection + '/' + items[t]);
        }
      }
      return callback(null, output);
    });
  }

  /**
   * Retrieves a loaded field from a stored document.
   * @param {object} item An an object with a field name key and filename val.
   *                      item = {[field]: [collection]/[file-name].yml}
   * @param {string} key TODO: remove.
   * @return {object} A field from a doc.
   */
  loadWithField(item, key, callback) {
    this.load(Object.values(item)[0], (err, result) => {
      if (err) return callback(err);
      let output = [];
      output[Object.keys(item)[0]] = result;
      return callback(null, output);
    });
  }

  /**
   * Retrieves individual collection.
   * @param {string} file Location of file, ie [collection]/[file-name].yml
   * @return {object} A referenced document.
   */
  load(file, callback) {
    const that = this;
    const dir = this.directory + '/' + file;
    const data = fs.readFileSync(dir, 'utf8');
    const doc = YAML.parse(data);
    that.Hook.postLoad(doc, (err, output) => {
      return callback(err, output);
    });
  }

  /**
   * Wrapper for findByCollection allows passing multiple collections.
   * @param {array} collections An array of collections to retrieve.
   * @param {boolean} deref Whether or not to dereference the docs.
   * @param {function} callback Callback with err, result params.
   */
  findAll(deref, callback) {
    let collectionData = [];
    const that = this;
    Async.each(this.collections, function(collection, done) {
      collectionData[collection] = [];
      that.findByCollection(collection, deref, (err, results) => {
        collectionData[collection] = results;
        done();
      });
    }, function(err) {
      callback(err, collectionData);
    });
  }

  /**
   * Load all data for a collection. If deref == true then dereference the data.
   * @param {string} collection The collection to retrieve.
   * @param {boolean} deref Whether or not to dereference the docs.
   * @return {array} An array of docs.
   */
  findByCollection(collection, deref, callback) {
    let contents = [];
    let that = this;
    Async.auto({
      getCollections: function (done) {
        if (collection) {
          done(null, [collection]);
        }
        else {
          fs.readdir(that.directory, function(err, list) {
            done(null, list);
          });
        }
      },
      getFiles: ['getCollections', function (list, done) {
        Async.map(list.getCollections, that.list.bind(that), function(err, result) {
          done(null, result);
        })
      }],
      readFiles: ['getFiles', function (results, done) {
        let files = [];
        for(var i = 0; i < results.getFiles.length; i++) {
          files = files.concat(results.getFiles[i]);
        }
        Async.map(files, that.load.bind(that), function(err, result) {
          if (deref && collection in that.references) {
            Async.map(result, that.Deref.bind(that), function (err, dereferenced) {
              done(null, dereferenced);
            });
          }
          else {
            done(null, result);
          }
        });
      }]
    }, (err, results) => {
      if (err) return callback(err);
      return callback(null, results.readFiles);
    });
  }

  /**
   * Find doc by route. Much less expensive than finding by field.
   * @param {string} route The route that the doc exists at.
   * @param {string} collection The doc collection.
   * @return {doc} Doc.
   */
  findByInterraId(interraId, collection, callback) {
    const file = collection + '/' + interraId + '.yml'
    this.load(file, (err, result) => {
      if (err) return callback(err);
      return callback(null, result);
    });
  }

  /**
   * Retrieves doc by field. Only for top-level fields.
   * @param {string} field Field that is part of the doc to search.
   * @param {string} collection Collection to search through.
   * @param {string} value Value to search for.
   * @return {object} Doc
   */
  findByFieldValue(field, collection, value, callback) {
    let item = {};
    this.findByCollection(collection, false, (err, all) => {
      Async.each(all, (doc, done) => {
        if (field in doc) {
          if (doc[field] === value) {
            item = doc;
            return done();
          }
        }
        return done();
      }, function(err) {
        if (err) {
          return callback(err);
        }
        else {
          return callback(null, item);
        }
      });
    });
  }

  findOneByIdentifierAndUpdate(identifier, collection, content, callback) {
    this.insertOne(identifier, collection, content, function(err, result) {
        callback(err,result);
    });
  }

  pagedFind(query, fields, sort, limit, page, callback) {
      var that = this;
      Async.auto({
            load: function(done) {
                that.load(null, function(err, list) {
                    if (err) done(err);
                    done(null, list);
                });
            },
            query: ['load', function (results, done) {
                var keys = Object.keys(query);
                if (keys.length) {
                    Async.filter(results.load, function(item, callback) {
                        var i;
                        for (i in keys) {
                            var key = keys[i];

                            if (!(key in item)) {
                                callback(key + " not found");
                            }
                            else if (item[key].search(query[key])>=0) {
                                callback(null, item);
                            }
                            else {
                                callback(null, null);
                            }
                        }
                    },function(err, results) {
                        if (results === undefined) {
                            done(null, []);
                        }
                        else {
                            done(null, results);
                        }
                    });
                }
                else {
                    done(null, results.load);
                }
            }],
            sort: ['query', function (results, done) {
                if (sort) {
                    // TODO: Sort by multiple.
                    var sorts = MongoModels.sortAdapter(sort);
                    var sortItem = Object.keys(sorts)[0];
                    Async.sortBy(results.query, function(item, callback) {
                        if (item[sortItem]) {
                            callback(null, item[sortItem].toLowerCase())
                        }
                        else {
                            callback(null,"");
                        }
                    }, function(err, items) {
                        if (sorts[sortItem] < 1) {
                            items.reverse();
                        }
                        done(err, items);
                    });
                }
                else {
                    done(null, results.query);
                }
            }],
            limitPage: ['sort', function (results, done) {

                // TODO: count total and hasPrev, hasNext
                if (!limit) {
                    done(null, results);
                }
                if (page) {
                    var start = page * limit - limit;
                    var stop = start + limit;
                }
                else {
                    var start = 0;
                    var stop = limit;
                }

                done(null, results.sort.slice(start, stop));
            }],
            fields: ['limitPage', function (results, done) {
                var newResults = [];
                if (!fields || results.limitPage) {
                    done(null, results.limitPage);
                }
                else {
                    Async.eachSeries(results.sort, function(item, callback) {
                      var newItem = {};
                      for (field in fields) {
                          newItem[field] = item[field];
                      };
                      newResults.push(newItem);
                      callback();

                  }, function(err) {
                      done(err, newResults);
                  });
              }
            }],

        }, (err, results) => {
            if (err) {
                return callback(err);
            }

            var paged = {
                data: results.fields,
                pages: {
                    current: page,
                    prev: page - 1,
                    next: page + 1
                    // Mongo provides the following:
                    //total:
                    //hasPrev:
                    //hasNext:
                },
                items: {
                    limit: limit
                    // Mongo provides the following:
                    // begin:
                    // end:
                    // total:
                }
            }

            callback(null, paged);

        });
    }

  titles(collection, callback) {
    var that = this;
    Async.auto({
      load: function(done) {
        that.loadByCollection(collection, function(err, list) {
          done(err, list);
        });
      },
      sort: ['load', function (results, done) {
        Async.sortBy(results.load, function(item, callback) {
          callback(null, item['title'].toLowerCase())
        }, function(err, items) {
          done(err, items);
        });
      }],
      fields: ['sort', function (results, done) {
        var newResults = [];
        Async.eachSeries(results.sort, function(item, callback) {
          var newItem = {};
          newItem['title'] = item['title'];
          newResults.push(newItem);
          callback();
          }, function(err) {
              done(err, newResults);
          });
      }],
    }, (err, results) => {
          if (err) {
              return callback(err);
          }
          callback(null, results.fields);
      });
  }
}

module.exports = {
  FileStorage
};
