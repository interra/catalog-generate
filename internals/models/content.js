'use strict';
const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const Ajv = require('ajv');
const ajv = new Ajv();
const merge = require('lodash.merge');

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

class Storage {

  constructor(siteDir, schemaDir) {
      this.siteDir = siteDir;
      this.schemaDir = schemaDir;
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

  constructor(siteDir, schemaDir) {
    super(siteDir, schemaDir);
    this.schema = new Schema(schemaDir);
    this.directory = siteDir + '/collections';
    this.loadedSchema = [];
    this.registry = [];
    this.schemaMap = this.schema.mapSettings();
    this.references = this.schema.getConfigItem('references');
    //this.collections = this.schema.getConfigItem('collections');
    this.map = this.schema.mapSettings();

    // TODO: Export to function where we can see if file exists. Make hooks
    // opt-in instead of mandatory.
    this.Hook = require(schemaDir + '/hooks/Content.js');
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
        if (err) {
          return callback(err, null);
        }
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
   * @return {object} Doc with 'interra-reference' internal references.
   */
  Ref(doc, callback) {
    let that = this;
    if (!this.references) {
      return callback(null, doc);
    }
    that.Hook.preReference(doc,(err, pre) => {
      let refNum = 0;
      Async.eachSeries(this.references, function(collections, done) {
        Async.eachOfSeries(collections, function(collection, field, fin) {
          let refCollection = Object.keys(that.references)[refNum];
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
                pre[field].push({'interra-reference' : that.createCollectionFileName(item.identifier)});
                over();
              });
            }
            else if (type === 'object') {
              pre[field] = {'interra-reference' : that.createCollectionFileName(pre[field].identifier)};
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
  validateRequired(doc, callback) {
    const fiveGoldenFields = this.requiredFields();
    Async.each(fiveGoldenFields, function(field, done) {
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
    this.buildRegistry(collection, (err, result) => {
      console.log(that.registry[collection][identifier]);
      if (identifier in that.registry[collection]) {
        console.log(that.registry[collection][identifier]);
        return callback(null, that.registry[collection][identifier]);
      }
      else {
        return callback(null, null);
      }
    });

    // if (collection in this.registry) {
    // this.buildRegistry(collection)
    //}
    // this.Map()
    // return this.checkRegistry()

  }

  /**
   * Like insertOne but outputs to json.
   * @param {string} identifier
   */
  exportOne(identifier, collection, content, callback) {
    this.Hook.preOutput(identifier, collection, content, (err, identifier, collection, content) => {
      let dir = this.directory + "/collections/" + collection;
      let file = dir + '/' + identifier + '.json';
      fs.writeJson(file, content, err => {
        if (err) {
          console.log(err);
          return callback(err);
        }
        this.Hook.postOutput(content, (err, content) => {
          return callback(null, content);
        });
      });
    });
  }

  exportMany(contents, callback) {
    Async.eachSeries(contents, function(content, done) {
      exportOne(content.identifier, content.collection, content, (err, item) => {
        if (err) {
          console.log(err);
          return done(err);
        }
        else {
          done(null);
        }
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
  buildRoute(routeString) {
    if (buildRoute in this.Hook) {
      return this.Hook.buildRoute(routeString);
    }
    else {
      return slug(routeString).substring(0,10);
    }
  }

  /**
   * Autoincrements if value not found. Starts with last '-' in string. If it is
   * a number it increments, if not it add '-0';
   * @param {string} route URL safe string.
   * @param {array} routes Routes to check against.
   * @return {string} Route that does not exist in routes.
   */
  buildSafeRoute(route, routes) {
    let safe = false;
    let safeRoute = route;
    let counter = 0;
    let last = '';
    while (!safe) {
      // safeRoute not in routes so current safeRoute is safe.
      if (routes.indexOf(safeRoute) === -1) {
        safe = true;
      }
      else {
        if (safeRoute.lastIndexOf('-')) {
          last = safeRoute.substring(safeRoute.lastIndexOf('-') + 1, safeRoute.length);
          // Javascript's isNumeric().
          if (!isNaN(last)) {
            last = Number(last) + 1;
            safeRoute = safeRoute.substring(0, safeRoute.lastIndexOf('-')) + '-' + last;
          }
          else {
            safeRoute = safeRoute + '-' + 0;
          }
        }
        else {
          safeRoute = safeRoute + '-' + 0;
        }
      }
      // To prevent a race condition.
      counter++;
      if (counter > 10000) {
        safe = true;
      }
    }
    return safeRoute;
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
   * @return {string} Mapped field.
   */
  getMapFieldByValue(collection, field) {
    if (collection in this.map) {
      let fields = Object.values(this.map[collection]);
      if (fields.indexOf(field) !== -1) {
        return Object.keys(this.map[collection])[fields.indexOf(field)];
      }
    }
    return null;
  }

  /**
   * Builds registry for a collection with a "identifier" : "interra-id" object.
   * @param {string} collection - A {@link collection}.
   * @return {object} A built registry.
   */
  buildRegistry(collection, callback) {
    let that = this;
    let identifier = 'identifier';
    if (collection in this.map) {
      if (Object.values(this.map[collection]).indexOf("identifier") !== '-1') {
        identifier = Object.keys(this.map[collection])[Object.values(this.map[collection]).indexOf("identifier")];
      }
    }
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
   * @param {object} item - Object with "identifier" : "interra-id" pair.
   * @param {string} collection - A {@link collection}.
   * @return {object} An updated registry for that collection.
   */
  addToRegistry(item, collection) {
    const identifier = Object.keys(item)[0];
    this.registry[collection][identifier] = Object.values(item)[0];
    return this.registry[collection];
  }

  /**
   * Removes item from the registry.
   * @param {string} identifier - Identifier for item to remove.
   * @param {string} collection - A {@link collection}.
   * @return {object} An updated registry for that collection.
   */
  removeFromRegistry(identifier, collection) {
    delete this.registry[collection][identifier];
    return this.registry[collection];
  }

  /**
   * Updates an existing document.
   */
  updateOne(interraId, collection, doc, dif, callback) {
    this.findByInterraId(interraId, collection, (err, existingDoc) => {
      if (err) return callback(err);
      const newDoc = merge(existingDoc, doc);
      this.insertOne(interraId, collection, newDoc, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
      });
    });
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
      if (err) {
        return callback(err);
      }
      return callback(false, true);
    })
  }

  /**
   * Inserts doc into file system. Does not care if file exists.
   * Files are saved as [colllection]/[route].yml.
   * @param {string} route The filename to save as without .yml
   * @param {string} collection The folder to save in.
   * @param {object} doc The doc.
   * @return {boolean} True if file saves correctly.
   */
  insertOne(interraId, collection, doc, callback) {
    // Validate required.
    this.validateRequired(doc, (err, result) => {
      if (err) {
        return callback(err);
      }
    });
    // Validate schema.
    this.validateDoc(doc, collection, (err, result) => {
      if (err) {
        return callback(err);
      }
    });
    this.Hook.preSave(interraId, collection, doc, (err, interraId, collection, doc) => {
      const file = this.directory + '/' + collection + '/' + interraId + '.yml';
      const yml = YAML.stringify(doc);
      fs.outputFile(file, yml, err => {
        if (err) {
          return callback(err);
        }
        this.Hook.postSave(doc, (err, doc) => {
          if (err) {
            return callback(err);
          }
          return callback(null, true);
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
        if (err) {
          console.log(err);
          return done(err);
        }
        else {
          done(null)
        }
      })
    }, function(err) {
      if (err) {
        return callback(err);
      }
      else {
        return callback(null, true);
      }
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
      // eghhh.
      for (t in items) {
        items[t] = collection + '/' + items[t];
      }
      callback(null, items);
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
      if (err) {
        return callback(err);
      }
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
    var that = this;
    var dir = this.directory + '/' + file;
    that.Hook.preLoad(dir,(err, result) => {
      const data = fs.readFileSync(result, 'utf8');
      const yml = YAML.parse(data);
      that.Hook.postLoad(yml, (err, output) => {
        return callback(null, output);
      });
    })
  }

  /**
   * Wrapper for findByCollection allows passing multiple collections.
   * @param {array} collections An array of collections to retrieve.
   * @param {boolean} deref Whether or not to dereference the docs.
   * @param {function} callback Callback with err, result params.
   */
  findAll(collections, deref, callback) {
    let collectionData = [];
    const that = this;
    Async.each(collections, function(collection, done) {
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
      if (err) {
        return callback(err);
      }
      callback(null, results.readFiles);
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
      if (err) {
        callback (err);
      }
      else {
        callback(null, result);
      }
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
                    if (err) {
                        done(err);
                    }
                    else {
                        done(null, list);
                    }
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
                  that.load(collection, function(err, list) {
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
