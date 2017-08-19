const Ajv = require('ajv');
const fs = require('fs-extra');
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const _ = require('lodash');
const chalk = require('chalk');
const slug = require('slug');
const Async = require('async');

const config = new Config();
const storage = config.get('storage');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));


function get(site) {
    var siteInfo = new Site();
    var schemaName = siteInfo.getConfigItem(site, 'schema');
    var schema = new Schema(schemaName);
    var collections = schema.getConfigItem('collections');
    var facets = schema.getConfigItem('facets');
    var buildDir = config.get('buildDir');
    var siteDir = __dirname.replace("internals/scripts", "") + buildDir + '/' + site + '/static';
    var schemas = {
      collections: collections,
      schema: {},
      facets: facets,
    }
    Async.each(collections, function(collection, callback) {
        const content = new Content[storage](site);
        if (collection == 'dataset') {
            schema.dereference(collection, (err, collectionSchema) => {
                if (err) {
                    console.log(chalk.red("Error for " + collection), err);
                    process.exit(1);
                }
                schemas.schema[collection] = collectionSchema;
                callback();
            });
        }
        else {
            schema.load(collection, (err, collectionSchema) => {
                if (err) {
                    console.log(chalk.red("Error for " + collection), err);
                    process.exit(1);
                }
                schemas.schema[collection] = collectionSchema;
                callback();
            });
        }

    }, function (err) {
        schema.map((err, result) => {
          schemas.map = result;
          schema.uiSchema((err, ui) => {
            schemas.uiSchema = ui;
            fs.outputJson(siteDir + '/schema.json', schemas, err => {
                if (err) {
                    console.log(err);
                }
            });
            });
        });
    });

}

module.exports = {
   get
}
