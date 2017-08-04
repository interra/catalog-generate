'use strict';
const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');
const _ = require('lodash');

class Storage {

  constructor(siteId) {
      this.siteId = siteId;
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

    constructor(siteId) {
        super(siteId);
        var config = new Config();
        var site = new Site();
        var siteDir =  __dirname.replace("internals/models","") + config.get('sitesDir') + '/' + this.siteId;
        this.directory = siteDir + '/collections';
        this.schema = site.getConfigItem(siteId, 'schema');
        var schema = new Schema(this.schema);
        this.references = schema.getConfigItem('references');
        // TODO: Export to function where we can see if file exists. Make hooks
        // opt-in instead of mandatory.
        this.Hook = require(__dirname.replace("internals/models","") + '/schemas/' + this.schema + '/hooks/Content.js');

    }

    // Same as insertOne but outputs to json.
    exportOne(directory, identifier, collection, content, callback) {
        this.Hook.preOutput(identifier, collection, content, (err, identifier, collection, content) => {
            let dir = directory + "/collections/" + collection;
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

    insertOne(identifier, collection, content, callback) {
        this.Hook.preSave(identifier, collection, content, (err, identifier, collection, content) => {
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

    count(collection, callback) {
        if (collection) {
            this.processGetFiles(collection, function(err, list) {
                var len = list ? list.length : 0;
                callback(err, len);
            });
        }
        else {
            var that = this;
            fs.readdir(that.directory, function(err, list) {
                Async.map(list, that.processGetFiles.bind(that), function(err, result) {
                    var files = [];
                    for(var i = 0; i < result.length; i++) {
                        files = files.concat(result[i]);
                    }
                    callback(null, files.length);
                })
            });
        }
    }

    // Retrieves list of files by collecion.
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
        })
    }

    // Retrieves individual collection.
    // file = [collection]/[file-name].yml
    load(file, callback) {
        var that = this;
        var dir = this.directory + '/' + file;
        that.Hook.preLoad(dir,(err, result) => {
            YAML.load(result, function(data) {
                that.Hook.postLoad(data, (err, output) => {
                    return callback(null, output);
                });
           });
        })
    }

    // Adds referenced data to collection using 'interra-reference' key.
    dereference(item, callback) {
        var that = this;
        var referencedCollections = [];
        if (this.references) {
            that.Hook.preDereference(item,(err, pre) => {
                // TODO: convert to async.
                _.each(this.references, function(collection) {
                    _.each(collection, function(refType, field) {
                        if (field in pre) {
                            // 'interra-reference' can be applied to a string or
                            // array. Convert to array if string.
                            if (pre[field].length == undefined) {
                                pre[field] = [pre[field]];
                            }
                            var reference = {};
                            _.each(pre[field], function(item, val) {
                                if ('interra-reference' in item) {
                                    reference[field] = refType + '/' + item['interra-reference'] + '.yml';
                                    referencedCollections.push(reference);
                                }
                            });
                        }
                    });
                });

                Async.mapValues(referencedCollections, that.loadWithField.bind(that), function(err, results)  {
                    let i = 0;
                    _.each(results, function(result, n) {
                        // TODO: check the type from the schema.
                        if (Object.keys(result)[0] == 'publisher') {
                            pre[Object.keys(result)[0]] = Object.values(result)[0];
                        }
                        else {
                            // TODO: Group results by field.
                            pre[Object.keys(result)[0]][i] = Object.values(result)[0];
                            i++;
                        }
                    });

                    that.Hook.postDereference(pre,(err, post) => {
                        return callback(null, post);
                    });
                });
            });

        }
        else {
            return callback(null, item);
        }
    }

    // Load all data for a collection. If deref == true then dereference the
    // data.
    findByCollection(collection, deref, callback) {
        var contents = [];
        var that = this;
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
                var files = [];
                for(var i = 0; i < results.getFiles.length; i++) {
                    files = files.concat(results.getFiles[i]);
                }
                Async.map(files, that.load.bind(that), function(err, result) {
                    if (deref && collection in that.references) {
                        Async.map(result, that.dereference.bind(that), function (err, dereferenced) {
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
}

module.exports = {
  FileStorage
};
