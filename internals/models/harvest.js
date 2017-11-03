const fs = require('fs-extra');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const axios = require('axios');
const Ajv = require('ajv');
const HarvestSource = require('./harvestsource');
const isEqual = require('lodash.isequal');
const defaults = require('lodash.defaults');
const uuid = require('uuidv4');

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
const sourceSchema = {
	"$schema": "http://json-schema.org/draft-04/schema#",
    "id": "#",
	"title": "Schema for the source",
	"type": "object",
	"patternProperties": {
    "^[a-zA-Z0-9]*$": {
      "title": "id",
      "description": "Unique identifier for source",
      "type": "object",
			"required": ["id", "source", "type"],
			"properties": {
				"id": {
					"type": "string",
					"title": "ID",
					"description": "Unique id for the source",
          "pattern": "^[a-zA-Z0-9]*$"
				},
				"source": {
					"type": "string",
					"title": "Remote source",
					"pattern": "^http://|^https://|^file://"
				},
				"type": {
					"type": "string",
					"title": "Type of source",
					"enum": ["DataJSON", "Test", "CKAN"]
				},
				"excludes": {
					"type": "object",
					"title": "Exclude"
				},
				"defaults": {
					"type": "object",
					"title": "Defaults"
				},
				"overrides": {
					"type": "object",
					"title": "Overrides"
				}
			}

		}
	},
	"additionalProperties":false
}

class Harvest {
  constructor(content, sources) {
    this.content = content;
    this.sources = sources;
    const validator = ajv.compile(sourceSchema);
    const valid = validator(sources);
    if (!valid) {
      throw new Error("Sources file is not valid: " + JSON.stringify(validator.errors));
    }
    this.Hook = require(this.content.schemaDir + '/hooks/Harvest.js');
  }

  /**
   * Downloads remote sources locally.
   */
  cache(callback) {
    Async.each(this.sources, (source, done) => {
      let harvestSource = new HarvestSource[source.type](this.content, source);
      harvestSource.cache((err, result) => {
        done(err, result);
      });
    }, function(err) {
      return callback(err, !err);
    });
  }

  load(callback) {
    let json = {};
    Async.eachOfSeries(this.sources, (source, id, done) => {
      let harvestSource = new HarvestSource[source.type](this.content, source);
      harvestSource.load((err, result) => {
        json[source.id] = result;
        done(err);
      });
    }, function(err) {
      return callback(err, json);
    });
  }

  /**
   * @param {object} docsGroup Object of docs loaded from sources with source
   * id as initial key.
   * @return {object} Object of docs with the same structure.
   */
  prepare(docsGroup, callback) {
    const that = this;
    // I ♥ callbacks. I promise to fix this.
    that._filter(this.sources, docsGroup, (err, filtered) => {
      that._exclude(this.sources, filtered, (err, excluded) => {
        that._defaults(this.sources, excluded, (err, defaulted) => {
          that._overrides(this.sources, defaulted, (err, over) => {
            callback(err, over);
          });
        });
      });
    });
  }

  _overrides(sources, docsGroup, callback) {
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      Async.eachOfSeries(docs, (doc, i, docCallback) => {
        if ('overrides' in sources[id]) {
          docsGroup[id][i] = Object.assign(docsGroup[id][i], sources[id].overrides);
        }
        docCallback();
      });
      docsCallback();
    }, function(err) {
      callback(err, docsGroup);
    });
  }

  _defaults(sources, docsGroup, callback) {
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      Async.eachOfSeries(docs, (doc, i, docCallback) => {
        if ('defaults' in sources[id]) {
          docsGroup[id][i] = defaults(docsGroup[id][i], sources[id].defaults);
        }
        docCallback();
      });
      docsCallback();
    }, function(err) {
      callback(err, docsGroup);
    });
  }

  _exclude(sources, docsGroup, callback) {
    const excludedDocs = {};
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      excludedDocs[id] = docs;
      if ('excludes' in sources[id]) {
        Async.eachOf(sources[id].excludes, (criteria, field, done) => {
          Async.filter(excludedDocs[id], (doc, filterCallback) => {
            that._searchObj(doc, field, criteria, (err, result) => {
              if (result) {
                filterCallback(null, false);
              }
              else {
                filterCallback(null, true);
              }
            });
          }, function(err, result) {
            excludedDocs[id] = result;
            done(err, !err);
          });
        }, function(err) {
          docsCallback(err, !err);
        });
      }
      else {
        excludedDocs[id] = docs;
        docsCallback(null, true);
      }
    }, function(err) {
      callback(err, excludedDocs);
    });
  }

  _filter(sources, docsGroup, callback) {
    const filteredDocs = {};
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      filteredDocs[id] = [];
      if ('filters' in sources[id]) {
        Async.eachOf(sources[id].filters, (criteria, field, done) => {
          Async.filter(docs, (doc, filterCallback) => {
            that._searchObj(doc, field, criteria, (err, result) => {
              if (result) {
                filterCallback(null, true);
              }
              else {
                filterCallback(null, false);
              }
            });
          }, function(err, result) {
            filteredDocs[id] = result;
            done(err, !err);
          });
        }, function(err) {
          docsCallback(err, !err);
        })
      }
      else {
        filteredDocs[id] = docs;
        docsCallback(null, true);
      }
    }, function(err) {
      callback(err, filteredDocs);
    });
  }

  /**
   * Finds the value of a field in an object.
   * @param {object} doc Doc to search.
   * @param {array} field An array of the field to search.
   * @return {mixed} Null if doc does not contain the value. String if string value
   * and array if the field parent is an array.
   */
  _getObjValue(doc, field, callback) {
    const length = field.length;
    const that = this;
    Async.reduce(field, doc, (memo, item, done) => {
      const docType = that._toType(memo);
      if (docType === 'array') {
        Async.reduce(memo, [], (col, val, valdone) => {
          const valType = that._toType(val);
          if (valType === 'array') {
            if (val.indexOf(item) !== -1) {
              col.push(val[item]);
              valdone(null, col);
            }
          }
          else if (valType === 'object') {
            if (item in val) {
              col.push(val[item]);
              valdone(null, col)
            }
          }
          else {
            valdone(null, null)
          }
        }, function(err, res) {
          done(null, res);
        })
      }
      else if (docType === 'object') {
        if (item in memo) {
          done(null, memo[item]);
        }
        else {
          done(null, null);
        }
      }
      else {
        done(null, memo);
        // Do nothing, a string is a thing too.
      }
    }, function(err, result) {
      callback(null, result);
    });
  }

  /**
   * Determines if doc contains a set of field and values.
   * @param {object} doc Doc to search.
   * @param {string} field Field to search with. Can include period for each level.
   * @param {mixed} criteria String, array or object to match with the field.
   * @return {boolean} True if the doc contains the field and the value of the criteria.
   */
  _searchObj(doc, field, criteria, callback) {
    let docPass = false;
    const that = this;
    const criteriaType = this._toType(criteria);
    that._getObjValue(doc, field.split('.'), (err, result) => {
      const resultType = that._toType(result);
      // If criteria is an object we can only compare with an object.
      if (criteriaType === 'object') {
        if (resultType === 'object') {
          if (isEqual(result, criteria)) {
            docPass = true;
          }
        }
      }
      if (criteriaType === 'array') {
        Async.each(criteria, (crit, done) => {
          if (resultType === 'object') {
            if (crit in result) {
              docPass = true;
            }
          }
          else if (resultType === 'array') {
            if (result.indexOf(crit) !== -1) {
              docPass = true;
            }
          }
          else {
            if (result === crit) {
              docPass = true;
            }
          }
          done();
        });
      }
      else {
        if (resultType === 'array') {
          if (result.indexOf(criteria)) {
            docPass = true;
          }
        }
        else if (resultType === 'object') {
          if (criteria in result) {
            docPass = true;
          }
        }
        else {
          if (criteria === result) {
            docPass = true;
          }
        }
      }
      callback(err, docPass);
    });
  }

  /**
   * Gets type. Yeah JS. From https://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable .
   * @param {lol} item Item to get the type of.
   * @return {string} Enum 'string', 'array', 'object'.
   */
  _toType(item) {
    if (item) {
      if (typeof item === 'string') {
        return 'string';
      }
      else if (typeof item === 'array') {
        return 'array';
      }
      else if (typeof item === 'object') {
        if (item instanceof Array) {
          return 'array';
        }
        else {
          return 'object';
        }
      }
      else {
        console.log("-------------------------------------------------------------------->", item);
      }
    }
    else {
      return null;
    }
  }

  _flattenResults(docsGroup, call) {
    const that = this;
    Async.reduce(docsGroup, [], (memo, item, done) => {
      memo = memo.concat(item)
      done(null, memo);
    }, function (err, result) {
      call(null, result);
    });
  }

  /**
   * Saves harvest files.
   * @param {object} docsGroup An object returned from harvest.load().
   * @return boolean True if succesful.
   */
  store(docsGroup, callback) {
    // TODO: Move all content function calls to content model. Ref should return
    // the doc + the fields that need to be saved. That would eliminated need
    // for most of this.
    const references = Object.assign({}, this.content.references);
    const that = this;
    Async.eachOf(docsGroup, (docs, sourceId, finished) => {
      const primaryCollection = that.content.schema.getConfigItem('primaryCollection');
      that.content.buildRegistry((err) => {
        Async.each(docs, (doc, done) => {
          // TODO: get source type.
          that.Hook.Store(doc, that.sources[sourceId].type, (err, doc) => {
            const identifierField = that.content.getIdentifierField(primaryCollection);
            if (!(identifierField) in doc) {
              throw new Error("Doc missing identifier field " + doc);
            }
            that.content.refCollections(doc, primaryCollection, (err, fields) => {
              Async.eachOf(fields, (values, field, fin) => {
                if (!values) {
                  fin();
                }
                else {
                  const collection = references[primaryCollection][field];
                  const identifier = that.content.getIdentifierField(collection);
                  const type = that._toType(values);
                  const title = that.content.getMapFieldByValue(collection, 'title');
                  const ids = that.content.registry[collection].reduce((acc, cur, i) => {
                    acc.push(Object.values(cur)[0]);
                    return acc;
                  }, []);
                  if (type === 'array') {
                    doc[field] = [];
                    Async.eachSeries(values, (value, valdone) => {
                      if (that._toType(value) === 'string') {
                      //  console.log('skipping', value);
                        valdone();
                      }
                      else {
                        if (value[identifier] in that.content.registry[collection]) {
                          that.content.UpdateOne(that.content.registry[collection][value[identifier]], collection, value, (err, res) => {
                            if (err) {
                              console.log(err.type + " validatinon error for " + err.interraId + " in " + err.collection + " : " + JSON.stringify(err.error));
                            }
                            doc[field].push({'interra-reference': interraId});
                            valdone();
                          });
                        }
                        else {
                          value[title] = value[title] ? value[title] :  uuid();
                          const idString = that.content.buildInterraId(value[title]);
                          const interraId = that.content.buildInterraIdSafe(idString, ids);
                          value.interra = { "id": interraId};
                          that.content.insertOne(interraId, collection, value, (err, res) => {
                            if (err) {
                              console.log(err.type + " validatinon error for " + err.interraId + " in " + err.collection + " : " + JSON.stringify(err.error));
                            }
                            doc[field].push({'interra-reference': interraId});
                            that.content.addToRegistry({[interraId]: value[identifier]}, collection);
                            valdone();
                          });
                        }
                      }
                    }, function(err) {
                      fin();
                    });
                  }
                  else if (type === 'object') {
                    doc[field] = {};
                    if (values[identifier] in that.content.registry) {
                      values.interra = { "id": interraId};
                      that.content.UpdateOne(that.content.registry[collection][values[identifier]], collection, values, (err, res) => {
                        if (err) {
                          console.log(err.type + " validatinon error for " + err.interraId + " in " + err.collection + " : " + JSON.stringify(err.error));
                        }
                        doc[field]['interra-reference'] = that.content.registry[collection][values[identifier]];
                        fin();
                      });
                    }
                    else {
                      const tempId = that.content.buildInterraId(values[title]);
                      const interraId = that.content.buildInterraIdSafe(tempId, ids);
                      values.interra = { "id": interraId};
                      that.content.insertOne(interraId, collection, values, (err, res) => {
                        if (err) {
                          console.log(err.type + " validatinon error for " + err.interraId + " in " + err.collection + " : " + JSON.stringify(err.error));
                        }
                        doc[field]['interra-reference'] = interraId;
                        that.content.addToRegistry({[interraId]: values[identifier]}, collection);
                        fin();
                      });
                    }
                  }
                  else {
                    fin();
                  }
                }
              }, function(err) {
                let ids = [];
                if (that.content.registry[primaryCollection].length > 0) {
                  ids = that.content.registry[primaryCollection].reduce((acc, cur, i) => {
                    acc.push(Object.values(cur)[0]);
                    return acc;
                  }, []);
                }
                if (doc[identifierField] in that.content.registry[primaryCollection]) {
                  that.content.UpdateOne(doc[identifierField], primaryCollection, value, (err, res) => {
                    if (err) {
                      console.log(err.type + " validatinon error for " + err.interraId + " in " + err.collection + " : " + JSON.stringify(err.error));
                    }
                    done();
                  });
                }
                else {
                  const title = that.content.getMapFieldByValue(primaryCollection, 'title');
                  const tempId = that.content.buildInterraId(doc[title]);
                  const interraId = that.content.buildInterraIdSafe(tempId, ids);
                  doc.interra = { "id": interraId};
                  that.content.insertOne(interraId, primaryCollection, doc, (err, res) => {
                    if (err) {
                      console.log(err.type + " validatinon error for " + err.interraId + " in " + err.collection + " : " + JSON.stringify(err.error));
                    }
                    that.content.addToRegistry({[interraId]: doc[identifierField]}, primaryCollection);
                    done();
                  });
                }
              });
            });
          });
        }, function(err) {
          finished(err, !err);
        });
      });
    }, function(err) {
      callback(err, !err);
    });
  }

  /**
   * Run the entire harvest.
   */
  run(callback) {
    const that = this;
    Async.waterfall([
      function(done) {
        that.cache((err, result) => {
          done(err);
        })
      },
      function(done) {
        that.load((err, result) => {
          done(err, result);
        })
      },
      function(docsGroup, done) {
        that.prepare(docsGroup, (err, result) => {
          done(null, result);
        });
      },
      function(docsGroup, done) {
        that.store(docsGroup, (err, result) => {
          done(null, result);
        });
      }
    ], function (err, result) {
      callback(err, !err);
    });
  }

}
module.exports = {
  Harvest
};
