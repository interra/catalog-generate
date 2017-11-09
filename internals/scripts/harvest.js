/**
 * @file
 * Provides interface for running and caching harvests.
 */

const Content = require('../models/content');
const Schema = require('../models/schema');
const Site = require('../models/site');
const Harvest = require('../models/harvest').Harvest;
const fs = require('fs-extra');
const Async = require('async');
const Config = require('../models/config');

/**
 * Prepares harvest.
 */
function prepare(siteName, config) {
  const site = new Site(config.get('sitesDir'));
  const sitesDir = config.get('sitesDir');
  const siteDir = `${sitesDir}/${siteName}`;
  const schemaName = site.getConfigItem(siteName, 'schema');
  const schemaDir = `${config.get('schemasDir')}/${schemaName}`;
  const content = new Content[config.get('storage')](siteName, config);
  const sources = fs.readJsonSync(`${siteDir}/harvest/sources.json`);
  const harvest = new Harvest(content, sources);
  return harvest;
}

/**
 * Caches harvest sources. Downloading sources makes it easier to deal with
 * timeouts, revisions, and other issues.
 */
function cache(siteName, config) {
  const harvest = prepare(siteName, config);
  harvest.cache((err, result) => {
    if (!err) console.log("Harvest cached.");
  });

}

/**
 * Runs harvest. Use after files have been cached.
 */
function run(siteName, config) {
  const harvest = prepare(siteName);

  Async.waterfall([
    (done) => {
      console.log("Loading files...");
      harvest.load((err, result) => {
        console.log("Files loaded...");
        done(err, result);
      })
    },
    (docsGroup, done) => {
      console.log("Preparing files...");
      harvest.prepare(docsGroup, (err, result) => {
        console.log("Files prepared...");
        done(null, result);
      });
    },
    (docsGroup, done) => {
      console.log("Storing files...");
      harvest.store(docsGroup, (err, result) => {
        console.log("Files stored...");
        done(null, result);
      });
    }
  ], (err) => {
    console.log(err, !err);
  });
}

module.exports = {
  cache,
  run
};
