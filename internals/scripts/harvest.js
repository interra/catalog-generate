/**
 * @file
 * Provides interface for running and caching harvests.
 */

const Content = require('../models/content');
const Harvest = require('../models/harvest').Harvest;
const fs = require('fs-extra');
const Async = require('async');

/**
 * Prepares harvest.
 */
function prepare(siteName, config) {
  const sitesDir = config.get('sitesDir');
  const siteDir = `${sitesDir}/${siteName}`;
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
  harvest.cache((err) => {
    if (!err) console.log('Harvest cached.'); // eslint-disable-line
  });
}

/**
 * Runs harvest. Use after files have been cached.
 */
function run(siteName, config) {
  const harvest = prepare(siteName, config);
  Async.waterfall([
    (done) => {
      console.log('Loading files...'); // eslint-disable-line
      harvest.load((err, result) => {
        console.log('Files loaded...'); // eslint-disable-line
        done(err, result);
      });
    },
    (docsGroup, done) => {
      console.log('Preparing files...'); // eslint-disable-line
      harvest.prepare(docsGroup, (err, result) => {
        console.log('Files prepared...'); // eslint-disable-line
        done(null, result);
      });
    },
    (docsGroup, done) => {
      console.log('Storing files...'); // eslint-disable-line
      harvest.store(docsGroup, (err, result) => {
        console.log('Files stored...'); // eslint-disable-line
        done(null, result);
      });
    },
  ], (err) => {
    console.log(err, !err);
  });
}

module.exports = {
  cache,
  run,
};
