const fs = require('fs-extra');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const axios = require('axios');
const Ajv = require('ajv');
const HarvestSource = require('./harvestsource');
const isEqual = require('lodash.isequal');
const defaults = require('lodash.defaults');

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
    Async.eachOf(this.sources, (source, id, done) => {
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
    const excludedDocs = docsGroup;
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      Async.eachOfSeries(docs, (doc, i, docCallback) => {
        let docPass = false;
        if ('excludes' in sources[id]) {
          Async.eachOf(sources[id].excludes, (criteria, field, done) => {
            that._searchObj(doc, field, criteria, (err, result) => {
              if (result) {
                excludedDocs[id].pop();
              }
              done(err, !err);
            });
          }, function(err) {
              docCallback(err, !err);
          });
        }
        else {
          docCallback(null, true);
        }
      }, function(err) {
        docsCallback(err, !err);
      });
    }, function(err) {
      callback(err, excludedDocs);
    });
  }

  _filter(sources, docsGroup, callback) {
    const filteredDocs = {};
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      filteredDocs[id] = [];
      Async.eachSeries(docs, (doc, docCallback) => {
        let docPass = false;
        if ('filters' in sources[id]) {
          Async.eachOf(sources[id].filters, (criteria, field, done) => {
            that._searchObj(doc, field, criteria, (err, result) => {
              if (result) {
                filteredDocs[id].push(doc);
              }
              done(err, !err);
            });
          }, function(err) {
              docCallback(err, !err);

          });
        }
        else {
          filteredDocs[id] = unfiltered;
          docCallback(null, true);
        }
      }, function(err) {
        docsCallback(err, !err);
      });
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
    const inception = Object.assign({}, doc);
    const that = this;
    Async.reduce(field, inception, (memo, item, done) => {
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
          if (isEqual(result, critera)) {
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
    return ({}).toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
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
    const references = this.content.references.slice();
    const that = this;
    this._flattenResults(docsGroup, (err, docs) => {
      const primaryCollection = that.content.schema.getConfigItem('primaryCollection');
      that.content.buildFullRegistry((err) => {
        Async.each(docs, (doc, done) => {
          that.Hook.Store(doc, 'Test', (err, doc) => {
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
                const identifier = content.getIdentifierField(collection);
                const type = harvest._toType(values);
                const title = content.getMapFieldByValue(collection, 'title');
                const ids = content.registry[collection].reduce((acc, cur, i) => {
                  acc.push(Object.values(cur)[0]);
                  return acc;
                }, []);
                if (type === 'array') {
                  doc[field] = [];
                  Async.eachSeries(values, (value, valdone) => {
                    if (!(identifier) in value) {
                      throw new Error("Ref missing identifier field " + value);
                      valdone();
                    }
                    if (value[identifier] in content.registry[collection]) {
                      content.UpdateOne(content.registry[collection][value[identifier]], collection, value, (err, res) => {
                        doc[field].push({'interra-reference': interraId});
                        valdone();
                      });
                    }
                    else {
                      const idString = content.buildInterraId(value.title);
                      const interraId = content.buildInterraIdSafe(idString, ids);
                      value.interra = { "id": interraId};
                      content.insertOne(interraId, collection, value, (err, res) => {
                        doc[field].push({'interra-reference': interraId});
                        content.addToRegistry({[interraId]: value[identifier]}, collection);
                        valdone();
                      });
                    }
                  }, function(err) {
                    fin();
                  });
                }
                else if (type === 'object') {
                  doc[field] = {};
                  if (false) {
                    values.interra = { "id": interraId};
                    content.UpdateOne(content.registry[collection][values[identifier]], collection, values, (err, res) => {
                      doc[field]['interra-reference'] = content.registry[collection][values[identifier]];
                      fin();
                    });
                  }
                  else {
                    const interraId = content.buildInterraIdSafe(content.buildInterraId(values[title]), ids);
                    content.insertOne(interraId, collection, values, (err, res) => {
                      doc[field]['interra-reference'] = interraId;
                      content.addToRegistry({[interraId]: values[identifier]}, collection);
                      fin();
                    });
                  }
                }
                else {
                  fin();
                }
              }
            }, function(err) {
              const ids = that.content.registry[primaryCollection].reduce((acc, cur, i) => {
                acc.push(Object.values(cur)[0]);
                return acc;
              }, []);
              if (doc[identifierField] in that.content.registry[primaryCollection]) {
                that.content.UpdateOne(doc[identifierField], primaryCollection, value, (err, res) => {
                  done();
                });
              }
              else {
                const title = that.content.getMapFieldByValue(primaryCollection, 'title');
                const interraId = that.content.buildInterraIdSafe(that.content.buildInterraId(doc.title), ids);
                doc.interra = { "id": interraId};
                that.content.insertOne(interraId, primaryCollection, doc, (err, res) => {
                that.content.addToRegistry({[interraId]: doc[identifierField]}, primaryCollection);
                  done();
                });
              }
              });
            });
          });
        }, function(err) {
          callback(err, !err);
        });
      });
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

module.exports = {
  Harvest
};
