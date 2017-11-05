/**
 * @file
 * Build functions for exporting site content and config.
 * TODO: Maybe make this a class like the others so we can properly pass config.
 */
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Search = require('../models/search');
const Schema = require('../models/schema');
const chalk = require('chalk');
const slug = require('slug');
const fs = require('fs-extra');
const Async = require('async');
const path = require('path');
const apiSubDir = 'api/v1';

function prepare(site, config) {
  const storage = config.get('storage');
  const content = new Content[storage](site, config);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  fs.ensureDirSync(apiDir);
  return content;
}

/**
 * Exports routes.
 */
function routesExport(site, config, callback) {
  const content = prepare(site, config);
  const routeCollections = content.schema.getConfigItem('routeCollections');
  const file = path.join(config.get('buildDir'), site, 'api/v1/routes.json');

  content.buildRegistry((err, results) => {
    Async.transform(results, (acc, item, index, done) => {
      if (routeCollections.indexOf(index) !== -1) {
        acc[index] = item;
      }
      done(null);
    }, (err, result) => {
      fs.outputFile(file, JSON.stringify(result), err => {
        if (err) console.log(err);
        callback(err, !err);
      });
    });
  });
}

/**
 * Exports json files for each doc in each collection.
 */
function docsExport(site, config, callback) {
  const content = prepare(site, config);

  content.findAll(true, (err, results) => {
    Async.each(content.collections, (collection, done) => {
      const docs = results[collection];
      content.exportMany(docs, collection, (err, result) => {
        done(err, !err);
      });
    }, (err) => {
      if (err) console.log(err);
      callback(err, !err);
    });
  });
}

/**
 * Exports json file for single doc.
 */
function docExport(site, config, collection, interraId, callback) {
  const content = prepare(site, config);
  content.findByInterraId(interraId, collection, (err, doc) => {
    if (err) callback(err);
    content.Deref(doc, (derefErr, dereffed) => {
      if (err) callback(derefErr);
      content.exportOne(interraId, collection, dereffed, (exportErr) =>  {
        callback(exportErr,!exportErr);
      });
    });
  });
}

/**
 * Exports the schema for the site.
 */
function schemaExport(site, config, callback) {
  const content = prepare(site, config);
  const siteInfo = new Site(config.get('sitesDir'));
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(path.join(config.get('schemasDir'), schemaName));
  const collections = schema.getConfigItem('collections');
  const facets = schema.getConfigItem('facets');
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);

  let schemas = {
    collections: collections,
    schema: {},
    map: {},
    uiSchema: {},
    facets: facets,
  }
  Async.each(collections, (collection, done) => {
    if (collection === primaryCollection) {
      schema.dereference(collection, (err, collectionSchema) => {
        if (err) {
          console.log(chalk.red("Error for " + collection), err);
          process.exit(1);
        }
        schemas.schema[collection] = collectionSchema;
        done();
      });
    } else {
      schema.load(collection, (err, collectionSchema) => {
        if (err) {
          console.log(chalk.red("Error for " + collection), err);
          process.exit(1);
        }
        schemas.schema[collection] = collectionSchema;
        done();
      });
    }
  }, function (err) {
    schemas.map = schema.mapSettings();
    schema.uiSchema = schema.uiSchema() 
    fs.outputJson(apiDir + '/schema.json', schemas, err => {
      if (err) {
        console.log(err);
      }
      callback(err, !err);
    });
  });
}

/**
 * Exports configuration.
 */
function configExport(site, config) {
  const siteInfo = new Site(config.get('sitesDir'));
  const siteConfig = siteInfo.getConfig(site);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
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
function searchExport(site, config, callback) {
  const siteInfo = new Site(config.get('sitesDir'));
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(path.join(config.get('schemasDir'), schemaName));
  const searchEngine = config.get('search');
  const search = new Search[searchEngine](site, config);
  const content = prepare(site, config);
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);

  search.init();

  Async.auto({
    load: (done) => {
      content.findByCollection(primaryCollection, true, (err, results) => {
        done(err, results);
      });
    },
    index: ['load', (results, done) => {
      Async.eachSeries(results.load, (item, fin) => {
        search.insertOne(item, (err, out) => {
          fin(err, out);
        });
      }, (err) => {
        done(err, !err);
      });
    }],
  }, (err) => {
    if (err) {
      callback(err);
    } else {
      search.push((pusherr) => {
        callback(pusherr, !pusherr);
      });
    }
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
