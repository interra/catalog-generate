'use strict';
const Async = require('async');
const fs = require('fs-extra');
const YAML = require('yamljs');
const refParser = require('json-schema-ref-parser');
const chalk = require('chalk');

class Schema {

  constructor(name) {
    this.name = name;
    this.dir = __dirname.replace("internals/models", "") + "schemas/" + name + "/";
    this.Hook = require(this.dir + '/hooks/Schema.js');
  }

  // Retrieves uiSchema.
  uiSchema(callback) {
    const configFile = this.dir + "UISchema.yml";
    YAML.load(configFile, function (data) {
      return callback(null, data);
    });
  }

  // Retrieves map settings.
  map(callback) {
    const configFile = this.dir + "map.yml";
    YAML.load(configFile, function (data) {
      return callback(null, data);
    });
  }

    // Retrieves Schema as well as uiSchema and map for individual collection.
    collectionAndSchema(collection, callback) {
      this.collection(collection, (err, list) => {

          if (err) {
              return callback("Collection not found.");
          }

          this.uiSchema((err,ui) => {
              if (err) {
                  return callback("UIschema not found");
              }
              this.map((err,map) => {
                  let data = {
                      schema: list,
                      uiSchema: ui[collection],
                      map: map
                  }
                  return callback(null,data);
              });

          });

      });
  }

    // Retrieves Schema for an individual collection.
    load(collection, callback) {
        var that = this;
        const collectionFile = that.dir + 'collections/' + collection + ".yml";
        that.Hook.preLoad(collectionFile,(err, collectionFile) => {
            YAML.load(collectionFile, function (data) {
                that.Hook.postLoad(data, (err, output) => {
                    if (data) {
                        return callback(null, data);
                    }
                    else {
                        return callback("Collection not found");
                    }
                });
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
                var schemaDir = dir.replace("internals/models","") + 'schemas/' + this.name + '/collections';
                process.chdir(schemaDir);
                refParser.dereference(schema)
                    .then(function(derefSchema) {
                        process.chdir(dir);
                        that.Hook.postDereference(derefSchema,(err, derefSchema) => {

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
        var data = fs.readFileSync(this.dir + "config.yml", 'utf8');
        return YAML.parse(data);
    }

    getConfigItem(item) {
        var items = this.getConfig(item);
        return items[item];
    }

  list(callback) {
      fs.readdir('./schemas', function (err, data) {
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
