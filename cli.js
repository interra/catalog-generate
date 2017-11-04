#!/usr/bin/env node
const prog = require('caporal');
const Validate = require('./internals/scripts/validate');
const Build = require('./internals/scripts/build');
const BuildSchema = require('./internals/scripts/build-schema');
const BuildConfig = require('./internals/scripts/build-config');
const BuildSwagger = require('./internals/scripts/build-swagger');
const BuildSearch = require('./internals/scripts/build-search');
const Harvest = require('./internals/scripts/harvest');

prog
  .version('0.0.1')
  .command('validate-site-contents')
  .help('validates a site contents based off of a schema')
  .argument('site', 'The site to validate')
  .action((args) => {
    Validate.content(args.site);
  })
  .command('validate-site')
  .help('validates a site')
  .argument('site', 'The site to validate')
  .action((args) => {
    Validate.site(args.site);
  })
  .command('build-routes')
  .help('builds collection data for a site exporting it to the build dir')
  .argument('site', 'The site to build')
  .action((args) => {
    Build.routes(args.site);
  })
  .command('build-collection-data')
  .help('builds collection data for a site exporting it to the build dir')
  .argument('site', 'The site to build')
  .action((args) => {
    console.log("Exporting data for " + args.site); // eslint-disable-line
    Build.collectionData(args.site);
  })
  .command('build-collection-data-item')
  .help('builds collection data for a collection item')
  .argument('site', 'The site to build from')
  .argument('collection', 'The colleciton to build from')
  .argument('interraId', 'The internal id of the item')
  .action((args) => {
    console.log("Exporting data for " + args.site + ' ' + args.collection); // eslint-disable-line
    Build.collectionDataItem(args.site, args.interraId, args.collection);
  })
  .command('build-schema')
  .help('builds schema file for a site')
  .argument('site', 'The site to build from')
  .action((args) => {
    BuildSchema.get(args.site);
  })
  .command('build-config')
  .help('builds config file for a site')
  .argument('site', 'The site to build from')
  .action((args) => {
    BuildConfig.get(args.site);
  })
  .command('build-search')
  .help('builds search index for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    BuildSearch.all(args.site);
  })
  .command('build-swagger')
  .help('builds swagger json file for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    BuildSwagger.get(args.site);
  })
  .command('harvest-cache')
  .argument('site', 'The site to import into')
  .help('Caches harvest sources.')
  .action((args) => {
    Harvest.cache(args.site);
  })
  .command('harvest-run')
  .argument('site', 'The site to import into')
  .help('Runs a harvest with cached sources.')
  .action((args) => {
    Harvest.run(args.site);
  });

prog.parse(process.argv);
