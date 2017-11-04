const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const chalk = require('chalk');
const slug = require('slug');
const fs = require('fs-extra');
const Async = require('async');
const path = require('path');

const config = new Config();
const siteInfo = new Site();
const storage = config.get('storage');
const buildDir = config.get('buildDir');

function prepare(site) {
  const content = new Content[storage](site);
  const apiDir = path.join(__dirname.replace('internals/scripts', ''), buildDir, site, 'api/v1');
  fs.ensureDirSync(apiDir);
  return content;
}

/**
 * Exports routes.
 */
function routes(site) {
  const content = prepare(site);
  const routeCollections = schema.getConfigItem('routeCollections');
  const file = path.join(__dirname.replace('internals/scripts',''), buildDir, site, 'api/v1/routes.json');

  content.buildRegistry((err, results) => {
    Async.filter(results, (collection, done) => {
      if (routeCollections.indexOf(collection) !== -1) {
        done(null, true);
      } else {
        done(null, false);
      }
    }, (err, result) => {
      fs.outputFile(file, JSON.stringify(result), err => {
        if (err) console.log(err);
      });
    });
  });
}

/**
 * Exports json files for each doc in each collection.
 */
function collectionData(site) {
  const content = prepare(site);
  content.findAll(true, (err, results) => {
    Async.eachOf(results, (docs, collection, done) => {
      content.exportMany(docs, collection, apiDir, (err, result) => {
        done(err, result);
      });
    }, (err) => {
      if (err) console.log(err);
    });
  });
}

/**
 * Exports json file for single doc.
 */
function collectionData(site, collection, interraId) {
  const content = prepare(site);
  content.findByInterraId(interraId, collection, (err, doc) => {
    content.Deref(doc, (derefErr, dereffed) => {
      content.exportOne(interraId, collection, dereffed, apiDir, (exportErr) =>  {
        console.log(InterraId + 'written to ' + apiDir);
      });
    });
  });
}

/**
 * Exports the schema for the site.
 */
function schemaData(site, callback) {
  console.log(chalk.blue("Building schema"));
  const content = prepare(site);
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName);
  const collections = schema.getConfigItem('collections');
  const facets = schema.getConfigItem('facets');
  let schemas = {
    collections: collections,
    schema: {},
    facets: facets,
  }
  Async.each(collections, function(collection, callback) {
    if (collection == 'dataset') {
      schema.dereference(collection, (err, collectionSchema) => {
        if (err) {
          console.log(chalk.red("Error for " + collection), err);
          process.exit(1);
        }
        schemas.schema[collection] = collectionSchema;
        callback();
      });
    } else {
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
        fs.outputJson(apiDir + '/schema.json', schemas, err => {
          if (err) {
            console.log(err);
          }
          callback(err, !err);
        });
      });
    });
  });
}

/**
 * Exports configuration.
 */
function configuration(site) {
  const siteConfig = siteInfo.getConfig(site);
  fs.outputJson(apiDir + '/config.json', siteConfig, err => {
    if (err) {
      console.log(err);
    }
    console.log(chalk.blue("Config file built."));
  });
}

/**
 * Exports search file for site.
 */
function search(site) {
  console.log(chalk.blue("Building search"));
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName);
  const search = new Search[searchEngine](site);
  const content = prepare(site);
  const primaryCollection = schema.getConfigItem('primaryCollection');

  search.init();

  Async.auto({
    load: function(done) {
      schema.dereference(primaryCollection, (err, collectionSchema) => {
        content.findByCollection(primaryCollection, true, (err, results) => {
          done(err, results);
        });
      });
    },
    index: ['load', function (results, done) {
      Async.eachSeries(results.load, function(item, callback) {
        search.insertOne(item, (err, out) => {
          if (err)  console.log("Error indexing " +  item.identifier);
          callback(err, out);
        });
      }, (err) => {
        if (err) console.log(chalk.red("Error indexing"));
        done(err, !err);
      });
    }],
  }, (err) => {
    if (err) console.log(chalk.red("Error indexings"));
    search.push();
  });
}

module.exports = {
  routes,
  collectionData,
  configuration,
  schema,
  search,
}
