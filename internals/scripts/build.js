/**
 * @file
 * Build functions for exporting site content and config.
 * TODO: Maybe make this a class like the others so we can properly pass config.
 */
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const chalk = require('chalk');
const slug = require('slug');
const fs = require('fs-extra');
const Async = require('async');
const path = require('path');

const siteInfo = new Site();

function prepare(site, config) {
  const content = new Content[storage](site, config);
  const apiDir = path.join(__dirname.replace('internals/scripts', ''), buildDir, site, 'api/v1');
  fs.ensureDirSync(apiDir);
  return content;
}

/**
 * Exports routes.
 */
function routesExport(site, config) {
  const content = prepare(site, config);
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
function docsExport(site, config) {
  const content = prepare(site, config);
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
function docExport(site, config, collection, interraId) {
  const content = prepare(site, config);
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
function schemaExport(site, config, callback) {
  console.log(chalk.blue("Building schema"));
  const content = prepare(site, config);
  return callback(null, null);
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  console.log(schemaName);
  const schema = new Schema(schemaName);
  const collections = schema.getConfigItem('collections');
  const facets = schema.getConfigItem('facets');
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const apiDir = path.join(__dirname.replace('internals/scripts', ''), buildDir, site, 'api/v1');

  let schemas = {
    collections: collections,
    schema: {},
    facets: facets,
  }
  Async.each(collections, function(collection, callback) {
    if (collection == primaryCollection) {
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
function configExport(site, config) {
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
function searchExport(site) {
  console.log(chalk.blue("Building search"));
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  console.log(schemaName);
  const schema = new Schema(schemaName);
  const search = new Search[searchEngine](site);
  const content = prepare(site);
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const apiDir = path.join(__dirname.replace('internals/scripts', ''), buildDir, site, 'api/v1');

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
  routesExport,
  docsExport,
  docExport,
  configExport,
  schemaExport,
  searchExport,
}
