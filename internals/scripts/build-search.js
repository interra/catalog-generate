const Ajv = require('ajv');
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const Search = require('../models/search');
const _ = require('lodash');
const chalk = require('chalk');
const slug = require('slug');
const fs = require('fs-extra');
const Async = require('async');

const config = new Config();
const storage = config.get('storage');
const searchEngine = config.get('search');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));


function all(site) {
    const siteInfo = new Site();
    const schemaName = siteInfo.getConfigItem(site, 'schema');
    const schema = new Schema(schemaName);
    const buildDir = config.get('buildDir');
    const siteDir = __dirname.replace("internals/scripts", "") + buildDir + '/' + site + '/static';
    const search = new Search[searchEngine](site);
    const content = new Content[storage](site);

    search.init();

    Async.auto({
        load: function(done) {
            schema.dereference("dataset", (err, collectionSchema) => {
                content.findByCollection("dataset", true, (err, results) => {
                    console.log(chalk.blue("Indexing datasets"));
                    done(err, results);
                });
            });
        },
        index: ['load', function (results, done) {
            Async.eachSeries(results.load, function(item, callback) {
                search.insertOne(item, (err, out) => {
                    if (err) {
                        console.log("Error indexing " +  item.identifier);
                    }
                    else {
                        console.log(chalk.green("Indexing " + item.identifier));
                        callback();
                    }
                });
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
          search.push();
    });

}

module.exports = {
    all
}
