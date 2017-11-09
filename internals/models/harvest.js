const Async = require('async');
const Ajv = require('ajv');
const HarvestSource = require('./harvestsource');
const isEqual = require('lodash.isequal');
const defaults = require('lodash.defaults');
const uuid = require('uuidv4');
const path = require('path');

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
const sourceSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  id: '#',
  title: 'Schema for the source',
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9]*$': {
      title: 'id',
      description: 'Unique identifier for source',
      type: 'object',
      required: ['id', 'source', 'type'],
      properties: {
        id: {
          type: 'string',
          title: 'ID',
          description: 'Unique id for the source',
          pattern: '^[a-zA-Z0-9]*$',
        },
        source: {
          type: 'string',
          title: 'Remote source',
          pattern: '^http://|^https://|^file://',
        },
        type: {
          type: 'string',
          title: 'Type of source',
          enum: ['DataJSON', 'Test', 'CKAN'],
        },
        excludes: {
          type: 'object',
          title: 'Exclude',
        },
        defaults: {
          type: 'object',
          title: 'Defaults',
        },
        overrides: {
          type: 'object',
          title: 'Overrides',
        },
      },
    },
  },
  additionalProperties: false,
};

class Harvest {
  constructor(content, sources) {
    this.content = content;
    this.sources = sources;
    const validator = ajv.compile(sourceSchema);
    const valid = validator(sources);
    if (!valid) {
      throw new Error('Sources file is not valid: ' + JSON.stringify(validator.errors)); // eslint-disable-line prefer-template
    }
    this.Hook = require(path.join(this.content.schemasDir, this.content.schemaName, 'hooks/Harvest.js')); // eslint-disable-line
  }

  // TODO: Add real logger.
  log(string) {
    console.log(string); // eslint-disable-line no-console
  }

  /**
   * Downloads remote sources locally.
   */
  cache(callback) {
    Async.each(this.sources, (source, done) => {
      const harvestSource = new HarvestSource[source.type](this.content, source);
      harvestSource.cache((err, result) => {
        done(err, result);
      });
    }, (err) => {
      callback(err, !err);
    });
  }

  load(callback) {
    const json = {};
    Async.eachOfSeries(this.sources, (source, id, done) => {
      const harvestSource = new HarvestSource[source.type](this.content, source);
      harvestSource.load((err, result) => {
        json[source.id] = result;
        done(err);
      });
    }, (err) => {
      callback(err, json);
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
    that.applyFilters(this.sources, docsGroup, (err, filtered) => {
      that.applyExcludes(this.sources, filtered, (exerr, excluded) => {
        that.applyDefaults(this.sources, excluded, (deferr, defaulted) => {
          that.applyOverrides(this.sources, defaulted, (overr, over) => {
            callback(err, over);
          });
        });
      });
    });
  }

  applyOverrides(sources, docsGroup, callback) {
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      Async.eachOfSeries(docs, (doc, i, docCallback) => {
        if ('overrides' in sources[id]) {
          docsGroup[id][i] = Object.assign(docsGroup[id][i], sources[id].overrides); // eslint-disable-line no-param-reassign
        }
        docCallback();
      });
      docsCallback();
    }, (err) => {
      callback(err, docsGroup);
    });
  }

  applyDefaults(sources, docsGroup, callback) {
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      Async.eachOfSeries(docs, (doc, i, docCallback) => {
        if ('defaults' in sources[id]) {
          docsGroup[id][i] = defaults(docsGroup[id][i], sources[id].defaults); // eslint-disable-line no-param-reassign
        }
        docCallback();
      });
      docsCallback();
    }, (err) => {
      callback(err, docsGroup);
    });
  }

  applyExcludes(sources, docsGroup, callback) {
    const excludedDocs = {};
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      excludedDocs[id] = docs;
      if ('excludes' in sources[id]) {
        Async.eachOf(sources[id].excludes, (criteria, field, done) => {
          Async.filter(excludedDocs[id], (doc, filterCallback) => {
            that.searchObj(doc, field, criteria, (err, result) => {
              if (result) {
                filterCallback(null, false);
              } else {
                filterCallback(null, true);
              }
            });
          }, (err, result) => {
            excludedDocs[id] = result;
            done(err, !err);
          });
        }, (err) => {
          docsCallback(err, !err);
        });
      } else {
        excludedDocs[id] = docs;
        docsCallback(null, true);
      }
    }, (err) => {
      callback(err, excludedDocs);
    });
  }

  applyFilters(sources, docsGroup, callback) {
    const filteredDocs = {};
    const that = this;
    Async.eachOfSeries(docsGroup, (docs, id, docsCallback) => {
      filteredDocs[id] = [];
      if ('filters' in sources[id]) {
        Async.eachOf(sources[id].filters, (criteria, field, done) => {
          Async.filter(docs, (doc, filterCallback) => {
            that.searchObj(doc, field, criteria, (err, result) => {
              if (result) {
                filterCallback(null, true);
              } else {
                filterCallback(null, false);
              }
            });
          }, (err, result) => {
            filteredDocs[id] = result;
            done(err, !err);
          });
        }, (err) => {
          docsCallback(err, !err);
        });
      } else {
        filteredDocs[id] = docs;
        docsCallback(null, true);
      }
    }, (err) => {
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
  getObjValue(doc, field, callback) {
    const that = this;
    Async.reduce(field, doc, (memo, item, done) => {
      const docType = that.toType(memo);
      if (docType === 'array') {
        Async.reduce(memo, [], (col, val, valdone) => {
          const valType = that.toType(val);
          if (valType === 'array') {
            if (val.indexOf(item) !== -1) {
              col.push(val[item]);
              valdone(null, col);
            }
          } else if (valType === 'object') {
            if (item in val) {
              col.push(val[item]);
              valdone(null, col);
            }
          } else {
            valdone(null, null);
          }
        }, (err, res) => {
          done(null, res);
        });
      } else if (docType === 'object') {
        if (item in memo) {
          done(null, memo[item]);
        } else {
          done(null, null);
        }
      } else {
        done(null, memo);
        // Do nothing, a string is a thing too.
      }
    }, (err, result) => {
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
  searchObj(doc, field, criteria, callback) {
    let docPass = false;
    const that = this;
    const criteriaType = this.toType(criteria);
    that.getObjValue(doc, field.split('.'), (err, result) => {
      const resultType = that.toType(result);
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
          } else if (resultType === 'array') {
            if (result.indexOf(crit) !== -1) {
              docPass = true;
            }
          } else {
            if (result === crit) { // eslint-disable-line no-lonely-if
              docPass = true;
            }
          }
          done();
        });
      } else {
        if (resultType === 'array') { // eslint-disable-line no-lonely-if
          if (result.indexOf(criteria)) {
            docPass = true;
          }
        } else if (resultType === 'object') {
          if (criteria in result) {
            docPass = true;
          }
        } else {
          if (criteria === result) { // eslint-disable-line no-lonely-if
            docPass = true;
          }
        }
      }
      callback(err, docPass);
    });
  }

  /**
   * Gets type. Yeah JS
   * @param {lol} item Item to get the type of.
   * @return {string} Enum 'string', 'array', 'object'.
   */
  toType(item) {
    if (item) {
      if (typeof item === 'string') {
        return 'string';
      } else if (typeof item === 'array') { // eslint-disable-line valid-typeof
        return 'array';
      } else if (typeof item === 'object') { // eslint-disable-line valid-typeof
        if (item instanceof Array) {
          return 'array';
        }
        return 'object';
      }
      return null;
    }
    return null;
  }

  _flattenResults(docsGroup, call) {
    Async.reduce(docsGroup, [], (memo, item, done) => {
      memo = memo.concat(item); // eslint-disable-line no-param-reassign
      done(null, memo);
    }, (err, result) => {
      call(null, result);
    });
  }

  // TODO: generate this from the schema by getting the required fields.
  createDefaultFromString(id, string) {
    const now = new Date().toISOString();
    const doc = {
      created: now,
      title: string,
      modified: now,
      identifier: id,
      interra: {
        'id': id, // eslint-disable-line quote-props
      },
    };
    return doc;
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
        Async.each(docs, (doci, done) => {
          // TODO: get source type.
          that.Hook.Store(doci, that.sources[sourceId].type, (errSt, doc) => {
            const identifierField = that.content.getIdentifierField(primaryCollection);
            if (!(identifierField in doc)) {
              throw new Error('Doc missing identifier field ' + doc); // eslint-disable-line prefer-template
            }
            that.content.refCollections(doc, primaryCollection, (errRef, fields) => {
              Async.eachOf(fields, (values, field, fin) => {
                if (!values) {
                  fin();
                } else {
                  const collection = references[primaryCollection][field];
                  const identifier = that.content.getIdentifierField(collection);
                  const type = that.toType(values);
                  const title = that.content.getMapFieldByValue(collection, 'title');
                  const ids = that.content.registry[collection].reduce((acc, cur) => {
                    acc.push(Object.values(cur)[0]);
                    return acc;
                  }, []);
                  if (type === 'array') {
                    doc[field] = []; // eslint-disable-line no-param-reassign

                    Async.eachSeries(values, (value, valdone) => {
                      if (that.toType(value) === 'string') {
                        const stringId = that.content.buildInterraId(value);
                        // If string exists don't save there is nothing to update with.
                        if (that.content.getRegistryIdentifier(collection, stringId)) {
                          doc[field].push({ 'interra-reference': stringId });
                          valdone();
                        } else {
                          const newDocFromString = that.createDefaultFromString(stringId, value);
                          that.content.insertOne(stringId, collection, newDocFromString, (errInsert) => {
                            if (errInsert) {
                              that.log(errInsert.type + ' validatinon error for ' + errInsert.interraId + ' in ' + errInsert.collection + ' : ' + JSON.stringify(errInsert.error)); // eslint-disable-line prefer-template
                            }
                            doc[field].push({ 'interra-reference': stringId }); // eslint-disable-line no-param-reassign
                            that.content.addToRegistry({ [stringId]: newDocFromString[identifier] }, collection);
                            valdone();
                          });
                        }
                      } else {
                        const existingInterraId = that.content.getRegistryInterraId(value[identifier]);
                        if (existingInterraId) {
                          that.content.UpdateOne(existingInterraId, collection, value, (errUp) => {
                            if (err) {
                              that.log(errUp.type + ' validatinon error for ' + errUp.interraId + ' in ' + errUp.collection + ' : ' + JSON.stringify(errUp.error)); // eslint-disable-line prefer-template
                            }
                            doc[field].push({ 'interra-reference': existingInterraId }); // eslint-disable-line no-param-reassign
                            valdone();
                          });
                        } else {
                          value[title] = value[title] ? value[title] : uuid(); // eslint-disable-line no-param-reassign

                          const idString = that.content.buildInterraId(value[title]);
                          const interraId = that.content.buildInterraIdSafe(idString, ids);
                          value.interra = { id: interraId }; // eslint-disable-line no-param-reassign
                          that.content.insertOne(interraId, collection, value, (errIns) => {
                            if (errIns) {
                              that.log(errIns.type + ' validatinon error for ' + errIns.interraId + ' in ' + errIns.collection + ' : ' + JSON.stringify(errIns.error)); // eslint-disable-line prefer-template
                            }
                            doc[field].push({ 'interra-reference': interraId }); // eslint-disable-line no-param-reassign
                            that.content.addToRegistry({ [interraId]: value[identifier] }, collection);
                            valdone();
                          });
                        }
                      }
                    }, (e) => {
                      fin(e, !e);
                    });
                  } else if (type === 'object') {
                    doc[field] = {}; // eslint-disable-line no-param-reassign
                    const existingInterraId = that.content.getRegistryInterraId(values[identifier]);
                    if (existingInterraId) {
                      values.interra = { id: existingInterraId }; // eslint-disable-line no-param-reassign
                      that.content.UpdateOne(existingInterraId, collection, values, (errUp) => {
                        if (errUp) {
                          that.log(err.type + ' validatinon error for ' + err.interraId + ' in ' + err.collection + ' : ' + JSON.stringify(err.error)); // eslint-disable-line prefer-template
                        }
                        doc[field]['interra-reference'] = that.content.registry[collection][values[identifier]]; // eslint-disable-line no-param-reassign
                        fin();
                      });
                    } else {
                      const tempId = that.content.buildInterraId(values[title]);
                      const interraId = that.content.buildInterraIdSafe(tempId, ids);
                      values.interra = { id: interraId }; // eslint-disable-line no-param-reassign
                      that.content.insertOne(interraId, collection, values, (errIns) => {
                        if (errIns) {
                          that.log(errIns.type + ' validatinon error for ' + errIns.interraId + ' in ' + errIns.collection + ' : ' + JSON.stringify(errIns.error)); // eslint-disable-line prefer-template
                        }
                        doc[field]['interra-reference'] = interraId; // eslint-disable-line no-param-reassign
                        that.content.addToRegistry({ [interraId]: values[identifier] }, collection);
                        fin();
                      });
                    }
                  } else {
                    fin();
                  }
                }
              }, () => {
                // Now we are saving the primary collection.
                let ids = [];
                if (that.content.registry[primaryCollection].length > 0) {
                  ids = that.content.registry[primaryCollection].reduce((acc, cur) => {
                    acc.push(Object.values(cur)[0]);
                    return acc;
                  }, []);
                }
                const existingInterraId = that.content.getRegistryInterraId(doc[identifierField]);
                if (existingInterraId) {
                  that.content.updateOne(doc[identifierField], primaryCollection, doc, (errUp) => {
                    if (errUp) {
                      that.log(errUp.type + ' validatinon error for ' + errUp.interraId + ' in ' + errUp.collection + ' : ' + JSON.stringify(errUp.error)); // eslint-disable-line prefer-template
                    }
                    done();
                  });
                } else {
                  const title = that.content.getMapFieldByValue(primaryCollection, 'title');
                  const tempId = that.content.buildInterraId(doc[title]);
                  const interraId = that.content.buildInterraIdSafe(tempId, ids);
                  doc.interra = { id: interraId }; // eslint-disable-line no-param-reassign
                  that.content.insertOne(interraId, primaryCollection, doc, (errins) => {
                    if (errins) {
                      that.log(errins.type + ' validatinon error for ' + errins.interraId + ' in ' + errins.collection + ' : ' + JSON.stringify(errins.error)); // eslint-disable-line prefer-template
                    }
                    that.content.addToRegistry({ [interraId]: doc[identifierField] }, primaryCollection);
                    done();
                  });
                }
              });
            });
          });
        }, (errc) => {
          finished(errc, !errc);
        });
      });
    }, (errf) => {
      callback(errf, !errf);
    });
  }

  /**
   * Run the entire harvest.
   */
  run(callback) {
    const that = this;
    Async.waterfall([
      (done) => {
        that.cache((err) => {
          done(err);
        });
      },
      (done) => {
        that.load((err, result) => {
          done(err, result);
        });
      },
      (docsGroup, done) => {
        that.prepare(docsGroup, (err, result) => {
          done(null, result);
        });
      },
      (docsGroup, done) => {
        that.store(docsGroup, (err, result) => {
          done(null, result);
        });
      },
    ], (err) => {
      callback(err, !err);
    });
  }

}
module.exports = {
  Harvest,
};
