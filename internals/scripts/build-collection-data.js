const Ajv = require('ajv');
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const _ = require('lodash');
const chalk = require('chalk');
const slug = require('slug');
const fs = require('fs-extra');
const Async = require('async');

const config = new Config();
const storage = config.get('storage');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));


function all(site) {
  console.log(chalk.blue("Building collection data and routes"));
  const content = new Content[storage](site);
  const siteInfo = new Site();
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName);
  schema.mapSettings(function(err, map) {
    const collections = schema.getConfigItem('collections');
    const routeCollections = schema.getConfigItem('routeCollections');
    const buildDir = config.get('buildDir');
    const siteDir = __dirname.replace("internals/scripts", "") + buildDir + '/' + site + '/api/v1';
    let collectionData = [];
    let routes = [];
    siteInfo.createDirs(siteDir, collections);

    Async.auto({
      load: function(done) {
        Async.each(collections, function(collection, callback) {
          collectionData[collection] = [];
          content.findByCollection(collection, true, (err, results) => {
            collectionData[collection].push(results);
            callback();
          });
        }, function(err) {
          done(err, collectionData);
        });
      },
      save: ['load', function (results, done) {
        // TOOD: Move all of this to the model.
        // 1. content.findAll()
        // 2. content.exportMany()
        // Move route logic to yml file on save


        // Data.json
        // content.findByCollection('dataset')
        // content.exportMany

        // Routes.json
        // content.findAll()
        // route.push(item.interra.route)

        // Collection data
        // content.findByCollection()
        // exportMany() per collection
        // exportMany() all

        // Latest.json
        // content.findByCollection('dataset')
        // map(item.latest)
        Async.eachSeries(collections, function(collection, collectionCallback) {
          Async.eachSeries(results.load[collection], function(items, callback) {
            let collection
            Async.eachSeries(items, function(item, done) {
              if (!item) {
                console.log(chalk.red("No results for collection: " + collection));
                return;
              }
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
              // TODO: Check if route already exists.
              if (routeCollections.indexOf(collection) > -1) {
                routes.push(collection + '/' + slug(item.identifier));
              }
              // TODO: Check if published.
              content.exportOne(siteDir, slug(item.identifier), collection, item, (err,out) => {
                if (err) {
                  console.log("Error creating " +  item.identifier);
                }
                done();
              });
            }, function(err) {
              callback();
            });
          }, function(err) {
            collectionCallback();
          });
        }, function(err) {
          const file = __dirname.replace("internals/scripts","") + buildDir + '/' + site + "/api/v1/routes.json";
          fs.outputFile(file, JSON.stringify(routes), err => {
            if (err) {
              console.log(err);
            }
          });
        });
      }],
    }, (err, results) => {
      if (err) {
        console.log(chalk.red("Error indexings"));
      }

    });
  });
}

module.exports = {
    all
}
