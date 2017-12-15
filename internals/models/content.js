const fs = require('fs-extra');
const Site = require('./site');
const path = require('path');
const Schema = require('./schema');
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
    this.siteInfo = new Site(site, config);
    this.schemaName = this.siteInfo.getConfigItem('schema');
    this.schema = new Schema(this.schemaName, config);
    this.directory = `${this.siteDir}/collections`;
    this.apiDir = path.join(config.get('buildDir'), site, apiSubDir, 'collections');
    this.loadedSchema = [];
    this.registry = {};
    this.schemaMap = this.schema.mapSettings();
    this.references = this.schema.getConfigItem('references');
    this.collections = this.schema.getConfigItem('collections');
    this.map = this.schema.mapSettings();

    // TODO: Export to function where we can see if file exists. Make hooks
    // opt-in instead of mandatory.
    this.Hook = require(path.join(this.schemasDir, this.schemaName, 'hooks/Content.js')); // eslint-disable-line global-require
  }

  requiredFields() {
    return ['identifier', 'title', 'created', 'modified'];
  }

  addPath() {

  }

  init() {}

  count() {}

  findByIdentifier() {}

  insertOne() {}

  insertMany() {}

  update() {}

  delete() {}
}

class FileStorage extends Storage {

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
    const that = this;
    const referencedCollections = [];
    if (!this.references) {
      callback(null, doc);
    } else {
      that.Hook.preDereference(doc, (err, pre) => {
        let refNum = 0;
        Async.eachSeries(this.references, (collections, done) => {
          Async.eachOfSeries(collections, (collection, field, fin) => {
            const refCollection = Object.keys(that.references)[refNum];
            if (field in pre) {
              // 'interra-reference' can be applied to a string or
              // array. Convert to array if string.
              if (pre[field].length === undefined) {
                pre[field] = [pre[field]]; // eslint-disable-line no-param-reassign
              }
              Async.eachOfSeries(pre[field], (item, val, over) => {
                const reference = {};
                if ('interra-reference' in item) {
                  const file = `${collection}/${item['interra-reference']}.json`;
                  if (!fs.existsSync(`${that.directory}/${file}`)) {
                    // TODO: Throw a bigger error. 'interra-reference' stays in doc.
                    over(`Doc contains reference file ${file} from ${field} field that does not exist.`, null);
                  } else {
                    reference[field] = file;
                    referencedCollections.push(reference);
                    over();
                  }
                }
              }, (eoerr) => {
                if (eoerr) {
                  fin(eoerr);
                } else {
                  if (!(refCollection in that.loadedSchema)) {
                    that.schema.load(refCollection, (loaderr, schema) => {
                      that.loadedSchema[refCollection] = schema;
                    });
                  }
                  // Reset field so we can put dereferenced values in.
                  const type = that.loadedSchema[refCollection].properties[field].type;
                  if (type === 'array') {
                    pre[field] = []; // eslint-disable-line no-param-reassign
                  } else if (type === 'object') {
                    pre[field] = {}; // eslint-disable-line no-param-reassign
                  } else {
                    pre[field] = ''; // eslint-disable-line no-param-reassign
                  }
                  fin();
                }
              });
            }
          }, (eacherr) => {
            if (eacherr) {
              done(eacherr);
            } else {
              refNum++; // eslint-disable-line
              done();
            }
          });
        }, (oferr) => {
          if (oferr) callback(oferr, !oferr);
        });
        Async.mapValuesSeries(referencedCollections, that.loadWithField.bind(that), (maperr, results) => {
          Async.eachSeries(results, (result, over) => {
            let reNum = 0;
            const field = Object.keys(result)[0];
            const value = Object.values(result)[0];
            Async.eachSeries(that.references, (collections, done) => {
              const refCollection = Object.keys(that.references)[reNum];
              if (field in that.loadedSchema[refCollection].properties) {
                const type = that.loadedSchema[refCollection].properties[field].type;
                if (type === 'array') {
                  pre[field].push(value); // eslint-disable-line no-param-reassign
                } else {
                  pre[field] = value; // eslint-disable-line no-param-reassign
                }
                reNum++; // eslint-disable-line
                done();
              }
            }, () => {
              over();
            });
          });
          that.Hook.postDereference(pre, (posterr, post) => {
            callback(posterr, post);
          });
        });
      });
    }
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
      callback(null, doc);
    } else {
      let ref = {};
      that.Hook.preReference(doc, (err, pre) => {
        const refNum = 0;
        Async.eachSeries(this.references, (collections, done) => {
          Async.eachOfSeries(collections, (collection, field, fin) => {
            const refCollection = Object.keys(that.references)[refNum];
            ref = collection in ref ? ref[collection] : {};
            if (field in pre) {
              if (!(refCollection in that.loadedSchema)) {
                that.schema.load(refCollection, (loaderr, schema) => {
                  that.loadedSchema[refCollection] = schema;
                });
              }
              // Reset field so we can put dereferenced values in.
              const type = that.loadedSchema[refCollection].properties[field].type;
              if (type === 'array') {
                const items = pre[field];
                pre[field] = []; // eslint-disable-line no-param-reassign
                Async.eachOfSeries(items, (item, val, over) => {
                  if (field in ref && ref[field].indexOf(val) !== -1) {
                    pre[field] = { 'interra-reference': ref[field][val] }; // eslint-disable-line no-param-reassign
                  } else {
                    pre[field].push({ 'interra-reference': that.createCollectionFileName(item.identifier) }); // eslint-disable-line no-param-reassign
                  }
                  over();
                });
              } else if (type === 'object') {
                if (field in ref) {
                  pre[field] = { 'interra-reference': ref[field] }; // eslint-disable-line no-param-reassign
                } else {
                  pre[field] = { 'interra-reference': that.createCollectionFileName(pre[field].identifier) }; // eslint-disable-line no-param-reassign
                }
              }
            }
            fin();
          }, (oferr) => {
            if (oferr) {
              callback(oferr, null);
            } else {
              done();
            }
          });
        }, (eacherr) => {
          callback(eacherr, pre);
        });
      });
    }
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
            doc[mapField] = doc[currentField]; // eslint-disable-line
            delete doc[currentField]; // eslint-disable-line
          }
          fin();
        });
        done();
      }, (err) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, doc);
        }
      });
    } else {
      callback(null, doc);
    }
  }

  getRefFieldVal(collection, field) {
    if (collection in this.references) {
      if (Object.values(this.references[collection]).indexOf(field) !== -1) {
        return Object.keys(this.references[collection])[Object.values(this.references[collection]).indexOf(field)];
      }
    }
    return field;
  }

  getRefField(collection, field) {
    if (collection in this.references) {
      if (field in this.references[collection]) {
        return this.references[collection][field];
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
    if (!this.references || !(collection in this.references)) {
      callback(null, {});
    } else {
      const references = this.references[collection];
      Async.mapValues(references, (ref, key, done) => {
        if (key in doc) {
          done(null, doc[key]);
        } else {
          done();
        }
      }, (err, result) => {
        callback(err, result);
      });
    }
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
    Async.each(fiveGoldenFields, (field, done) => {
      if (collection in that.map) {
        if (Object.values(that.map[collection]).indexOf(field) !== -1) {
          const values = Object.values(that.map[collection]);
          const keys = Object.keys(that.map[collection]);
          field = keys[values.indexOf(field)]; // eslint-disable-line
        }
      }
      if (!(field in doc)) {
        done(`${field} field is required.`);
      } else {
        done();
      }
    }, (err) => {
      callback(err, !err);
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
      if (err) {
        callback(err);
      } else {
        const valid = ajv.validate(schema, doc);
        if (!valid) {
          callback(ajv.errors);
        } else {
          callback(false, true);
        }
      }
    });
  }

  /**
   * Validates doc based on schema that includes 'interra-reference'..
   * @param {object} doc - The {@link doc}.
   * @param {string} collection - The {@link collection};
   * @return {boolean} True if the {@link doc} is valid.
   */
  validateDocToStore(doc, collection, callback) {
    this.schema.reference(collection, (err, schema) => {
      if (err) callback(err);
      const valid = ajv.validate(schema, doc);
      if (!valid) {
        callback(ajv.errors);
      } else {
        callback(false, true);
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
    this.buildRegistry(() => {
      Async.detect(that.registry[collection], (id, done) => {
        if (identifier === Object.values(id)[0]) {
          done(null, true);
        } else {
          done(null);
        }
      }, (deterr, res) => {
        const out = res === undefined ? null : Object.keys(res)[0];
        callback(deterr, out);
      });
    });
  }

  /**
   * Like insertOne but outputs to json.
   * @param {string} identifier
   */
  exportOne(interraId, collection, doc, callback) {
    this.Hook.preOutput(interraId, collection, doc, (err, identifier, precollection, content) => {
      fs.ensureDirSync(path.join(this.apiDir, collection));
      const file = path.join(this.apiDir, precollection, `${interraId}.json`);
      fs.writeJson(file, content, (writeerr) => {
        if (writeerr) callback(writeerr);
        this.Hook.postOutput(content, (posterr, postcontent) => {
          callback(posterr, postcontent);
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
    Async.eachSeries(docs, (doc, done) => {
      that.exportOne(doc.interra.id, collection, doc, (err) => {
        done(err, !err);
      });
    }, (eacherr) => {
      callback(eacherr);
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
    return slug(idString).substring(0, 25).toLowerCase();
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
      } else {
        if (safeId.lastIndexOf('-')) { // eslint-disable-line
          last = safeId.substring(safeId.lastIndexOf('-') + 1, safeId.length);
          // Javascript's isNumeric().
          if (!isNaN(last)) {
            last = Number(last) + 1;
            safeId = `${safeId.substring(0, safeId.lastIndexOf('-'))}-${last}`;
          } else {
            safeId = `${safeId}-0`;
          }
        } else {
          safeId = `${safeId}-0`;
        }
      }
      // To prevent a race condition.
      counter++; // eslint-disable-line
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
    fs.readdir(`${this.directory}/${collection}`, (err, items) => {
      const routes = [];
      for (const n in items) { // eslint-disable-line
        // Remove .json filename.
        routes.push(items[n].substring(0, items[n].length - 5));
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
      const fields = Object.values(this.map[collection]);
      if (fields.indexOf(field) !== -1) {
        return Object.keys(this.map[collection])[fields.indexOf(field)];
      }
    }
    return field;
  }

  getIdentifierField(collection) {
    if (collection in this.map) {
      const fields = Object.values(this.map[collection]);
      if (fields.indexOf('identifier') !== -1) {
        return Object.keys(this.map[collection])[fields.indexOf('identifier')];
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
      return null;
    }
    return null;
  }

  getRegistryInterraId(collection, identifier) {
    if (collection in this.registry) {
      const record = this.registry[collection].find((id) => { // eslint-disable-line
        return Object.keys(id)[0] === identifier;
      });
      if (record) {
        return Object.values(record)[0];
      }
      return null;
    }
    return null;
  }

  /**
   * Builds fulll registry.
   * @return {object} Keyed by collections with {identifier: interraId} objects.
   */
  buildRegistry(callback) {
    const collections = this.collections.reduce((acc, cur) => {
      acc = Object.assign(acc, { [cur]: [] }); // eslint-disable-line
      return acc;
    }, {});
    const that = this;
    Async.mapValues(collections, (i, collection, fin) => {
      const identifier = this.getIdentifierField(collection);
      this.findByCollection(collection, false, (err, docs) => {
        Async.map(docs, (doc, done) => {
          done(null, { [doc[identifier]]: doc.interra.id });
        }, (maperr, result) => {
          fin(maperr, result);
        });
      });
    }, (err, results) => {
      that.registry = results;
      callback(err, results);
    });
  }

  /**
   * Builds registry for a collection with a 'identifier' : 'interraId' object.
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
      }, (eacherr) => {
        callback(eacherr, that.registry[collection]);
      });
    });
  }

  /**
   * Adds item to the registry. Updates existing value if exists.
   * @param {object} item - Object with 'identifier' : 'interraId' pair.
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
      return true;
    });
  }

  /**
   * Updates an existing document.
   */
  updateOne(interraId, collection, doc, callback) {
    this.findByInterraId(interraId, collection, (err, existingDoc) => {
      this.createRevision(collection, existingDoc);
      if (err) callback(err);
      const newDoc = merge(existingDoc, doc);
      this.insertOne(interraId, collection, newDoc, (inserr, result) => {
        callback(inserr, result);
      });
    });
  }

  /**
   * Replaces an existing document.
   */
  replaceOne(interraId, collection, doc, callback) {
    this.findByInterraId(interraId, collection, (err, existingDoc) => {
      this.createRevision(collection, existingDoc);
      if (err) callback(err);
      this.insertOne(interraId, collection, doc, (inserr, result) => {
        callback(inserr, result);
      });
    });
  }

  /**
   * Reverts doc to revision.
   */
  revertOne(interraId, collection, revisionId, callback) {
    const file = `${this.directory}/${collection}/rev/${interraId}.json`;
    const revisions = fs.readJsonSync(file);
    const revision = revisions[revisionId];
    delete revisions[revisionId];
    if (revision.length) {
      fs.outputFileSync(file, revision);
    } else {
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
    const file = path.join(this.directory, collection, 'rev', `${interraId}.json`);
    let revisions = [];
    fs.ensureDirSync(path.join(this.directory, collection, 'rev'));
    if (fs.existsSync(file)) {
      revisions = fs.readJsonSync(file);
    }
    revisions.push(doc);
    fs.writeJsonSync(file, revisions, { spaces: 2 });
    return revisions;
  }

  /**
   * Deletes doc.
   * @param {string} route - The {@link route}
   * @param {string} collection - The {@link collection}
   * @return {boolean} True if the file is removed.
   */
  deleteOne(interraId, collection, callback) {
    const file = `${this.directory}/${collection}/${interraId}.json`;
    fs.unlink(file, (err) => {
      callback(err, !err);
    });
  }

  /**
   * Inserts doc into file system. Does not care if file exists.
   * Files are saved as [colllection]/[route].json.
   * @param {string} route The filename to save as without .json
   * @param {string} collection The folder to save in.
   * @param {object} doc The doc.
   * @return {boolean} True if file saves correctly. The return error is keyed
   * with the type of error, 'schema' or 'file':
   * err = {
   * 'schema|file': {
   *   'collection': ,
   *   'interraId': ,
   *   'error': ,
   *   }
   * }
   *
   */
  insertOne(interraId, collection, doc, callback) {
    this.Hook.preSave(interraId, collection, doc, (err, preinterraId, precollection, predoc) => {
      // Validate required.
      this.validateRequired(predoc, precollection, (validerr) => {
        if (validerr) {
          callback(validerr);
        } else {
          // Validate schema.
          this.validateDocToStore(predoc, precollection, (schemaErr) => {
            const file = path.join(this.directory, collection, `${interraId}.json`);
            fs.ensureDirSync(path.join(this.directory, collection));
            fs.writeJsonSync(file, predoc, { spaces: 2 });
            this.Hook.postSave(predoc, (posterr, postdoc) => {
              if (schemaErr) {
                callback({ type: 'schema', collection, interraId, error: schemaErr }, postdoc);
              } else if (err) {
                callback({ type: 'schema', collection, interraId, error: schemaErr }, postdoc);
              } else {
                callback(posterr, postdoc);
              }
            });
          });
        }
      });
    });
  }

  /**
   * Saves multiple docs.
   * @param {array} docs An Array of <doc>.
   * @return {boolean} True if succesful.
   */
  insertMany(docs, callback) {
    Async.eachSeries(docs, (content, done) => {
      this.insertOne(content.identifier, content.collection, content, (err) => {
        done(err, !err);
      });
    }, (err) => {
      callback(err, !err);
    });
  }

  /**
   * Counts number of docs in a collection.
   * @param {string} collection The collection to query.
   */
  count(collection, callback) {
    this.list(collection, (err, list) => {
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
    const dir = `${this.directory}/${collection}`;
    fs.readdir(dir, (err, items) => {
      let t;
      const output = [];
      for (t in items) { // eslint-disable-line
        // Folder may contain rev folder for revisions.
        if (items[t] !== 'rev') {
          output.push(`${collection}/${items[t]}`);
        }
      }
      return callback(null, output);
    });
  }

  /**
   * Retrieves a loaded field from a stored document.
   * @param {object} item An an object with a field name key and filename val.
   *                      item = {[field]: [collection]/[file-name].json}
   * @param {string} key TODO: remove.
   * @return {object} A field from a doc.
   */
  loadWithField(item, key, callback) {
    this.load(Object.values(item)[0], (err, result) => {
      if (err) return callback(err);
      const output = [];
      output[Object.keys(item)[0]] = result;
      return callback(null, output);
    });
  }

  /**
   * Retrieves individual collection.
   * @param {string} file Location of file, ie [collection]/[file-name].json
   * @return {object} A referenced document.
   */
  load(file, callback) {
    const that = this;
    const dir = `${this.directory}/${file}`;
    const doc = fs.readFileSync(dir, 'utf-8');
    that.Hook.postLoad(doc, (posterr, output) => {
      callback(posterr, JSON.parse(output));
    });
  }

  /**
   * Wrapper for findByCollection allows passing multiple collections.
   * @param {array} collections An array of collections to retrieve.
   * @param {boolean} deref Whether or not to dereference the docs.
   */
  findAll(deref, callback) {
    const collectionData = [];
    const that = this;
    Async.each(this.collections, (collection, done) => {
      collectionData[collection] = [];
      that.findByCollection(collection, deref, (err, results) => {
        collectionData[collection] = results;
        done();
      });
    }, (err) => {
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
    const that = this;
    Async.auto({
      getCollections: (done) => {
        if (collection) {
          done(null, [collection]);
        } else {
          fs.readdir(that.directory, (err, list) => {
            done(null, list);
          });
        }
      },
      getFiles: ['getCollections', (list, done) => {
        Async.map(list.getCollections, that.list.bind(that), (err, result) => {
          done(null, result);
        });
      }],
      readFiles: ['getFiles', (results, done) => {
        let files = [];
        for(let i = 0; i < results.getFiles.length; i++) { // eslint-disable-line
          files = files.concat(results.getFiles[i]);
        }
        Async.map(files, that.load.bind(that), (err, result) => {
          if (deref && collection in that.references) {
            Async.map(result, that.Deref.bind(that), (maperr, dereferenced) => {
              done(maperr, dereferenced);
            });
          } else {
            done(err, result);
          }
        });
      }],
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
    const file = `${collection}/${interraId}.json`;
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
      }, (eacherr) => {
        callback(eacherr, item);
      });
    });
  }

  findOneByIdentifierAndUpdate(identifier, collection, content, callback) {
    this.insertOne(identifier, collection, content, (err, result) => {
      callback(err, result);
    });
  }

  /**
   * Borrowed from MongoModels. Using temp to not require mongo but use similar API.
   */
  sortAdapter(sorts) {
    let rsort = sorts;
    if (Object.prototype.toString.call(sorts) === '[object String]') {
      const document = {};
      rsort = sorts.split(/\s+/);
      rsort.forEach((sort) => {
        if (sort) {
          const order = sort[0] === '-' ? -1 : 1;
          if (order === -1) {
            rsort = rsort.slice(1);
          }
          document[rsort] = order;
        }
      });
      rsort = document;
    }
  }

  pagedFind(query, fields, sort, limit, page, callback) {
    const that = this;
    Async.auto({
      load: (done) => {
        that.load(null, (err, list) => {
          if (err) done(err);
          done(null, list);
        });
      },
      query: ['load', (results, done) => {
        const keys = Object.keys(query);
        if (keys.length) {
          Async.filter(results.load, (item, call) => {
            for (let i in keys) { // eslint-disable-line
              const key = keys[i];
              if (!(key in item)) {
                call(`${key} not found`);
              } else if (item[key].search(query[key]) >= 0) {
                call(null, item);
              } else {
                call(null, null);
              }
            }
          }, (err, querresults) => {
            if (results === undefined) {
              done(null, []);
            } else {
              done(null, querresults);
            }
          });
        } else {
          done(null, results.load);
        }
      }],
      sort: ['query', (results, done) => {
        if (sort) {
          // TODO: Sort by multiple.
          const sorts = that.sortAdapter(sort);
          const sortItem = Object.keys(sorts)[0];
          Async.sortBy(results.query, (item, call) => {
            if (item[sortItem]) {
              call(null, item[sortItem].toLowerCase());
            } else {
              call(null, '');
            }
          }, (err, items) => {
            if (sorts[sortItem] < 1) {
              items.reverse();
            }
            done(err, items);
          });
        } else {
          done(null, results.query);
        }
      }],
      limitPage: ['sort', (results, done) => {
        // TODO: count total and hasPrev, hasNext
        if (!limit) {
          done(null, results);
        } else if (page) {
          const start = (page * limit) - limit;
          const stop = start + limit;
          done(null, results.sort.slice(start, stop));
        } else {
          const start = 0;
          const stop = limit;
          done(null, results.sort.slice(start, stop));
        }
      }],
      fields: ['limitPage', (results, done) => {
        const newResults = [];
        if (!fields || results.limitPage) {
          done(null, results.limitPage);
        } else {
          Async.eachSeries(results.sort, (item, call) => {
            const newItem = {};
            for (const field in fields) { // eslint-disable-line
              newItem[field] = item[field];
            }
            newResults.push(newItem);
            call();
          }, (err) => {
            done(err, newResults);
          });
        }
      }],
    }, (err, results) => {
      if (err) {
        callback(err);
      } else {
        const paged = {
          data: results.fields,
          pages: {
            current: page,
            prev: page - 1,
            next: page + 1,
            /** Mongo provides the following:
             * total:
             * hasPrev:
             * hasNext:
             */
          },
          items: {
            limit,
            /** Mongo provides the following:
             * begin:
             * end:
             * total:
             */
          },
        };
        callback(null, paged);
      }
    });
  }

  titles(collection, callback) {
    const that = this;
    Async.auto({
      load: (done) => {
        that.loadByCollection(collection, (err, list) => {
          done(err, list);
        });
      },
      sort: ['load', (results, done) => {
        Async.sortBy(results.load, (item, call) => {
          call(null, item.title.toLowerCase());
        }, (err, items) => {
          done(err, items);
        });
      }],
      fields: ['sort', (results, done) => {
        const newResults = [];
        Async.eachSeries(results.sort, (item, call) => {
          const newItem = {};
          newItem.title = item.title;
          newResults.push(newItem);
          call();
        }, (err) => {
          done(err, newResults);
        });
      }],
    }, (err, results) => {
      if (err) {
        callback(err);
      }
      callback(null, results.fields);
    });
  }
}

module.exports = {
  FileStorage,
};
