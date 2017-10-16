'use strict';
const fs = require('fs-extra');
const YAML = require('yamljs');
const refParser = require('json-schema-ref-parser');
const chalk = require('chalk');
const Ajv = require('ajv');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

class Schema {

  constructor(directory) {
    this.dir = directory;
    this.configFile = this.dir + '/config.yml';
    if (!fs.existsSync(this.dir)) {
      throw new Error("Schema directory does not exist.")
    }
    else if (!fs.existsSync(this.configFile)) {
      throw new Error("Schema config file " + this.configFile + " does not exist.")
    }
    this.Hook = require(this.dir + '/hooks/Schema.js');
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
    const data = fs.readFileSync(this.dir + "/UISchema.yml", 'utf8');
    return YAML.parse(data);
  }

  // Retrieves map settings.
  mapSettings() {
    var data = fs.readFileSync(this.dir + "/map.yml", 'utf8');
    return YAML.parse(data);
  }

  // Retrieves Schema as well as uiSchema and map for individual collection.
  collectionAndSchema(collection, callback) {
    this.collection(collection, (err, list) => {
      if (err) {
        return callback("Collection not found.");
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
    let that = this;
    const file = that.dir + '/collections/' + collection + ".yml";
    that.Hook.preLoad(file,(err, file) => {
      const collectionFile = fs.readFileSync(file, 'utf8');
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

  dereference(collection, callback) {
    var that = this;
    this.load(collection, (err, schema) => {
      if (err) {
        return callback(err);
      }
      that.Hook.preDereference(schema,(err, schema) => {

        var dir = __dirname;
        var schemaDir = this.dir + '/collections';
        process.chdir(schemaDir);
        refParser.dereference(schema)
          .then(function(derefSchema) {
            process.chdir(dir);
            that.Hook.postDereference(derefSchema,(err, derefSchema) => {
              return callback(null, derefSchema);
            });
          })
          .catch(function(err) {
            console.log(err);
            process.chdir(dir);
            return callback(err, null);
          });
        });
      })
    }

  getConfig() {
    var data = fs.readFileSync(this.dir + "/config.yml", 'utf8');
    return YAML.parse(data);
  }

  getConfigItem(item) {
    var items = this.getConfig(item);
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
