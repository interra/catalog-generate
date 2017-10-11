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

function all(site) {
  const siteInfo = new Site();
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName);
  const buildDir = config.get('buildDir');
  const content = new Content[storage](site);
  let datajson = {
    '@context': "https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld",
    '@id': "http://demo.getdkan.com/data.json",
    '@type': "dcat:Catalog",
    conformsTo: "https://project-open-data.cio.gov/v1.1/schema",
    describedBy: "https://project-open-data.cio.gov/v1.1/schema/catalog.json",
    dataset : []
  };
  const primaryCollection = 'dataset';
  console.log(chalk.blue("Building data.json file"));

  Async.auto({
    load: function(done) {
      // TODO: figure out why I am derefencing the schema.
      schema.dereference(primaryCollection, (err, collectionSchema) => {
        content.findByCollection(primaryCollection, true, (err, results) => {
          done(err, results);
        });
      });
    },
    index: ['load', function (results, done) {
      Async.each(results.load, function(item, callback) {
        datajson.dataset.push(item);
        callback(null);
      }, function(err) {
        if (err) {
          console.log(chalk.red("Error indexing"));
          done(err);
        }
        else {
          done(null)
        }
      });
    }],
  }, (err, results) => {
    if (err) {
      console.log(chalk.red("Error indexings"));
    }
    const file = __dirname.replace("internals/scripts","") + buildDir + '/' + site + "/api/v1/data.json";
    fs.outputFile(file, JSON.stringify(datajson), err => {
      if (err) {
        console.log(err);
      }
    });

  });
}

module.exports = {
  all
}
