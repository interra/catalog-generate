'use strict';
const fs = require('fs-extra');
const YAML = require('yamljs');
const refParser = require('json-schema-ref-parser');
const chalk = require('chalk');
const Async = require('async');
const path = require('path');
const Ajv = require('ajv');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

class Schema {

  constructor(schemaName, config) {
    this.dir = path.join(config.get('schemasDir'), schemaName);
    this.configFile = this.dir + '/config.yml';
    if (!fs.existsSync(this.dir)) {
      throw new Error(`Schema directory: ${this.dir} does not exist.`);
    }
    else if (!fs.existsSync(this.configFile)) {
      throw new Error("Schema config file " + this.configFile + " does not exist.")
    }
    this.Hook = require(this.dir + '/hooks/Schema.js');
    this.schemas = {};
    this.refSchemas = {};
  }

  // Validate that the schema is in proper json-schema.
  // TODO: add arg for different json-schema versions.
  validateCollectionSchema(schema) {
    try {
      const valid = ajv.compile(schema);
      if (!valid.errors) {
        return true;
      }
      else {
        return false;
      }
    }
    catch (e) {
      throw new Error("Schema is not valid.")
    }
  }

  validateCollectionItem(schema, item) {
    const validator = ajv.compile(schema);
    const valid = validator(item);
    if (!valid) {
      return validator.errors;
    }
    else {
      return true;
    }
  }

  // TODO: Validates full schema:
  // - ensures collections folder
  // - validates all collections
  // - validates config.yml file
  // - ensures uiSchema.yml
  // - ensures collections + map have required files
  validateFullSchema() {

  }

  // Retrieves uiSchema.
  uiSchema() {
    const data = fs.readFileSync(path.join(this.dir,'UISchema.yml'), 'utf8');
    return YAML.parse(data);
  }

  // Retrieves map settings.
  mapSettings() {
    const data = fs.readFileSync(path.join(this.dir, 'map.yml'), 'utf8');
    return YAML.parse(data);
  }

  // Retrieves Schema as well as uiSchema and map for individual collection.
  collectionAndSchema(collection, callback) {
    this.collection(collection, (err, list) => {
      if (err) {
        return callback('Collection not found.');
      }
      const uiSchema = this.uiSchema();
      const map = this.mapSettings();
      let data = {
        schema: list,
        uiSchema: uiSchema[collection],
        map: map
      }
      return callback(null,data);
    });
  }

  /**
   * Retrieves Schema for an individual collection.
   * @param {string} collection Collection to load schema from.
   * @return {object} The loaded schema.
   */
  load(collection, callback) {
    const that = this;
    const file = path.join(that.dir, 'collections', collection + '.yml');
    const interraSchemaFile = path.join(__dirname, '../../schemas/interra.yml');
    that.Hook.preLoad(file,(err, file) => {
      const collectionFile = fs.readFileSync(file, 'utf8');
      const interraSchema = fs.readFileSync(interraSchemaFile, 'utf8');
      // const data = Object.assign(YAML.parse(collectionFile), {interra: YAML.parse(interraSchema)});
      const data = YAML.parse(collectionFile);
      that.Hook.postLoad(collection, data, (err, output) => {
        if (data) {
          return callback(null, data);
        }
        else {
          return callback("Collection not found");
        }
      });
    });
  }

  /**
   * Provides schema that includes "interra-reference" for validating stored docs.
   */
  reference(collection, callback) {
    if (collection in this.refSchemas) {
      return callback(null, this.refSchemas[collection]);
    }
    const that = this;
    this.load(collection, (err, schema) => {
      const references = this.getConfigItem('references');
      if (collection in references) {
        Async.eachOf(references[collection], (ref, field, done) => {
          if (schema.properties[field]['type'] == 'object') {
            schema.properties[field] = {
              "type": "object",
              "title": "interra reference",
              "required": ["interra-reference"],
              "properties": {
                "interra-reference": {
                  "type": "string",
                  "title":  "Interra reference"
                }
              }
            }
          }
          else {
            schema.properties[field] = {
              "type": "array",
              "title": "interra reference",
              "items": {
                "required": ["interra-reference"],
                "properties": {
                  "interra-reference": {
                    "type": "string",
                    "title":  "Interra reference"
                  }
                }
              }
            }
          }
          done();
        }, function(err) {
          that.refSchemas[collection] = schema;
          callback(err, schema);
        });
      }
      else {
        callback(null, schema);
      }
    });
  }

  dereference(collection, callback) {
    if (collection in this.schemas) {
      return callback(null, this.schemas[collection]);
    }
    const that = this;
    this.load(collection, (err, schema) => {
      if (err) {
        return callback(err);
      }
      that.Hook.preDereference(schema,(err, schema) => {

        const dir = __dirname;
        const schemaDir = this.dir + '/collections';
        process.chdir(schemaDir);
        refParser.dereference(schema)
          .then(function(derefSchema) {
            process.chdir(dir);
            that.Hook.postDereference(derefSchema,(err, derefSchema) => {
              that.schemas[collection] = derefSchema;
              return callback(null, derefSchema);
            });
          })
          .catch(function(err) {
            process.chdir(dir);
            return callback(err, null);
          });
        });
      })
    }

  getConfig() {
    const data = fs.readFileSync(this.configFile, 'utf8');
    return YAML.parse(data);
  }

  getConfigItem(item) {
    const items = this.getConfig(item);
    return items[item];
  }

  /**
   * Lists available schemas.
   * @return {array} Array of schemas.
   */
  list(callback) {
    fs.readdir(this.dir + '/../.', function (err, data) {
      if (err) {
        return callback(err);
      }
      callback(null, data);
    });
  }
}

Schema.register = function (server, options, next) {
    next();
}

Schema.register.attributes = {
    "name": "schema"
}

module.exports = Schema;
