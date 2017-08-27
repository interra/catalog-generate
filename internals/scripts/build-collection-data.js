const Ajv = require('ajv');
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const _ = require('lodash');
const chalk = require('chalk');
const slug = require('slug');
const fs = require('fs-extra');
const lunr = require('lunr');
const elasticlunr = require('elasticlunr');

const config = new Config();
const storage = config.get('storage');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));


function all(site) {
  var siteInfo = new Site();
  var schemaName = siteInfo.getConfigItem(site, 'schema');
  var schema = new Schema(schemaName);
  const map = schema.map(function(err, map) {
    var collections = schema.getConfigItem('collections');
    var buildDir = config.get('buildDir');
    var siteDir = __dirname.replace("internals/scripts", "") + buildDir + '/' + site + '/static';
    siteInfo.createDirs(siteDir, collections);
    _.each(collections, function(collection) {
      const content = new Content[storage](site);
      schema.dereference(collection, (err, collectionSchema) => {
        if (err) {
          console.log(chalk.red("Error for " + collection), err);
          process.exit(1);
        }
        content.findByCollection(collection, true, (err, results) => {
          // TODO: Move to Async.
          _.each(results, function(item) {
            // If no id we create a slug from title.
            if (!('identifier' in item)) {
              // Not every schema has a title.
              let titleName = 'title';
              if (collection in map) {
                Object.keys(map[collection]).forEach(function(key) {
                  if (map[collection][key] == 'title') {
                    titleName = key;
                  }
                });
              }
              item.identifier = slug(item[titleName]);
            }

            // TODO: Check if published.
            console.log(chalk.blue("Creating file for " + item.identifier));
            // TODO: Use Search model that includes Lunr or ES.

            content.exportOne(siteDir, slug(item.identifier), collection, item, (err,out) => {
              if (err) {
                console.log("Error creating " +  item.identifier);
              }
              else {
                //console.log(chalk.green("File created for " + item.identifier));
              }
            });
          });
        });
      });
    });
  });

}

module.exports = {
    all
}
