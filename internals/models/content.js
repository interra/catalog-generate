'use strict';
const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');

class Storage {

  constructor(siteDir, schemaDir) {
      this.siteDir = siteDir;
      this.schemaDir = schemaDir;
  }

  requiredFields () {
    return ['identifier', 'path', 'title', 'created', 'modified'];
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
    this.schemaMap = this.schema.mapSettings();
    this.references = this.schema.getConfigItem('references');

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
    var that = this;
    var referencedCollections = [];
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
                reference[field] = collection + '/' + item['interra-reference'] + '.yml'
                referencedCollections.push(reference);
                over();
              }
            }, function(err) {
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
            });
          }
        }, function(err) {
          refNum++;
          done();
        });
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

  // Adds references and required fields. Most schemas don't have a 1 to 1
  // mapping with a catalog.
  Ref(item, collection, routeCollections, map, callback) {
    Async.map(this.references, function(reference, done) {
      if (reference in item) {
        if (reference == 'publisher') {
          item[reference] = {'interra-reference' : createCollectionFileName(dataset[reference].name)}
        }
        else {
          Async.eachOfSeries(item[reference], function(dist, i,  done) {
            if ('title' in dist) {
              dist.identifier = slug(dist.title.toLowerCase()) + '-' + uuidv4();
            }
            else {
              dist.identifier = uuidv4();
            }
            item[reference][i] = {'interra-reference': createCollectionFileName(dist.identifier)}
            done();
          });
        }
      }
    });
  }

  validateRequired(doc, collection, map) {
    const fiveGoldenFields = this.requiredFields();
    Async.each(fiveGoldenFields, function(field) {
      if (!(field in doc)) {
        if (collection in map) {
          if (!(field in map[collection])) {
            throw new Error(field + " not found in document " + doc);
          }
        }
        else {
          throw new Error(field + " not found in document " + doc);
        }
      }
    });
  }


/**
    const fiveGoldenFields = ['identifier', 'path', 'title', 'created', 'modified', 'reference'];
    Async.each(fiveGoldenFields, function(field) {
      if (!(field in item)) {
        if (!(collection in routeCollections) && field === 'path') {
          // Only collections with routes need paths.
        }
        else if (collection in map) {
          let mapValue = getMapValue(map[collection], item)
          item[Object.key(map[collection])] = item[Object.value(map[collection])];
        }
        else {
          // Required collection not in the item or map.
          throw console.error('missing field');
        }
      }
    }, function(err) {

    });
    // i-> when saving a file
    if (!('identifier' in item)) {

    }
  }
*/

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


    // Like insertOne but outputs to json.
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

    buildRoute(content) {
      // add diff route options?
      // what is defatult?
      //[collection]/slug(identifier)
      content['interra']['route'] = content.collection + '/' + slug(content.identifier);
    }

    // TODO: add route logic here.
    insertOne(identifier, collection, content, callback) {
      this.Hook.preSave(identifier, collection, content, (err, identifier, collection, content) => {
        if (!content.hasOwnProperty(content.interra.route)) {
          // I'm mutating the content on purpose not usre if better than new.
          buildRoute(content);
        }
        let dir = this.directory + "/" + collection;
        let file = dir + '/' + identifier + '.yml';
        let yml = YAML.stringify(content);
        fs.outputFile(file, yml, err => {
          if (err) {
            return callback(err);
          }
          this.Hook.postSave(content, (err, content) => {
            return callback(null, content);
          });
        });
      });
    }

    insertMany(contents, callback) {
      Async.eachSeries(contents, function(content, done) {
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
        callback(err);
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

    // Item is an object with a field name key and filename val.
    // item = {[field]: [collection]/[file-name].yml};
    loadWithField(item, key, callback) {
      this.load(Object.values(item)[0], (err, result) => {
        if (err) {
            return callback(err);
        }
        var output = [];
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

    getMapValue(mapObject, item) {
      if (mapObject.includes("[")) {
        let parts = Object.values(mapObject)[0].split("[");
        //NEXT: add escapted \/ to parts
        parts.each(function(part) {
          item
        })
      }
      else {
        item[Object.keys(mapObject)[0]] = item[mapObject.values(mapObject)[0]];
      }
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

    findByIdentifier(identifier, collection, callback) {
        let dir = this.directory + "/" + collection;

        let file = dir + '/' + identifier + '.yml';

        fs.readFile(file, 'utf8', (err, data) => {

            if (err) {
                return callback(err);
            }

            return callback(null, YAML.parse(data));
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
