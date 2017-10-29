const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const axios = require('axios');
const Ajv = require('ajv');
const HarvestSource = require('./harvestsource');
const isEqual = require('lodash.isequal');

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

  prepare(docs, callback) {
    const that = this;
    // I ♥ callbacks.
    that._filter(this.sources, docs, (err, filtered) => {
      that._exclude(this.sources, filtered, (err, excluded) => {
        callback(err, excluded);
      });
    });
    // _excludes(this.sources, docs);
    // _defaults(this.sources, docs);
    // _overrides(this.source, docs)
  }

  /**
   * Gets type. Yeah JS. From https://stackoverflow.com/questions/7390426/better-way-to-get-type-of-a-javascript-variable .
   * @param {lol} item Item to get the type of.
   * @return {string} Enum 'string', 'array', 'object'.
   */
  _toType(item) {
    return ({}).toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  }

  _exclude(sources, unexcluded, callback) {
    const excludedDocs = unexcluded;
    const that = this;
    Async.eachOfSeries(unexcluded, (docs, id, docsCallback) => {
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

  _filter(sources, unfiltered, callback) {
    const filteredDocs = {};
    const that = this;
    Async.eachOfSeries(unfiltered, (docs, id, docsCallback) => {
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
    let i = 0;
    let inception = doc;
    const that = this;
    let found = false;
    Async.eachSeries(field, (fragment, done) => {
      found = false;
      const docType = that._toType(inception);
      if (docType === 'array') {
        Async.each(inception, (item, fin) => {
          const itemType = that._toType(item);
          if (itemType === 'array') {
            if (item.indexOf(fragment) !== -1) {
              inception = inception[fragment][item];
              found = true;
            }
          }
          else if (itemType === 'object') {
            if (fragment in item) {
              inception.push(item[fragment]);
              found = true;
            }
          }
          else {
            found = true;
          }
          fin();
        });
      }
      else if (docType === 'object') {
        if (fragment in inception) {
          inception = inception[fragment];
          found = true;
        }
      }
      else {
        found = true;
      }
      done();
    }, function (err) {
      if (found) {
        callback(null, inception);
      }
      else {
        callback(null, null);
      }
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

  store() {

  }

  run() {
    // do all
  }

}

module.exports = {
  Harvest
};
