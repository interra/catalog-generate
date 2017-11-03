const Content = require('../models/content');
const Schema = require('../models/schema');
const Site = require('../models/site');
const Harvest = require('../models/harvest').Harvest;
const fs = require('fs-extra');
const Async = require('async');
const Config = require('../models/config');
const config = new Config();

function prepare(siteName) {
  const siteDir = __dirname + '/../../' + config.get('sitesDir') + '/' + (siteName);
  const site = new Site(config.get('sitesDir'));
  const schemaName = site.getConfigItem(siteName, 'schema');
  const schemaDir = __dirname + '/../../' +  config.get('schemasDir') + '/' + schemaName;
  const content = new Content[config.get('storage')](siteDir, schemaDir);
  const sources = fs.readJsonSync( siteDir + '/harvest/sources.json');
  const harvest = new Harvest(content, sources);
  return harvest;
}

function cache(siteName) {
  const harvest = prepare(siteName);
  harvest.cache((err, result) => {
    if (!err) console.log("Harvest cached.");
  });

}

function run(siteName) {
  const harvest = prepare(siteName);

  Async.waterfall([
    function(done) {
      console.log("Loading files...");
      harvest.load((err, result) => {
        console.log("Files loaded...");
        done(err, result);
      })
    },
    function(docsGroup, done) {
      console.log("Preparing files...");
      harvest.prepare(docsGroup, (err, result) => {
        console.log("Files prepared...");
        done(null, result);
      });
    },
    function(docsGroup, done) {
      console.log("Storing files...");
      harvest.store(docsGroup, (err, result) => {
        console.log("Files stored...");
        done(null, result);
      });
    }
  ], function (err, result) {
    console.log(err, !err);
  });
}

module.exports = {
  cache,
  run
};
