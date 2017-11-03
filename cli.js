#!/usr/bin/env node
const prog = require('caporal');
const dataJsonImport = require('./internals/scripts/datajson2yml');
const Validate = require('./internals/scripts/validateSchema');
const Build = require('./internals/scripts/build-collection-data');
const BuildSchema = require('./internals/scripts/build-schema');
const BuildConfig = require('./internals/scripts/build-config');
const BuildSwagger = require('./internals/scripts/build-swagger');
const BuildSearch = require('./internals/scripts/build-search');
const Harvest = require('./internals/scripts/harvest');
const Schema = require('./internals/models/schema');
const Site = require('./internals/models/site');

prog
    .version('0.0.1')
    .command('validate-schema')
    .help('validates a site based off of a schema')
    .argument('site', 'The site to validate')
    .action((args, options) => {
        Validate.all(args.site);
    })
    .command('build-collection-data')
    .help('builds collection data for a site exporting it to the build dir')
    .argument('site', 'The site to build')
    .action(function(args, options) {
        console.log("Exporting data for " + args.site);
        Build.all(args.site);
    })
    .command('build-collection-data-item')
    .help('builds collection data for a collection item')
    .argument('site', 'The site to build from')
    .argument('collection', 'The colleciton to build from')
    .argument('identifier', 'The identifier of the item')
    .action((args, options) => {
        console.log("Exporting data for " + args.site + ' ' + args.collection);
    })
    .command('build-schema')
    .help('builds schema file for a site')
    .argument('site', 'The site to build from')
    .action((args, options) => {
       BuildSchema.get(args.site);
    })
    .command('build-config')
    .help('builds config file for a site')
    .argument('site', 'The site to build from')
    .action((args, options) => {
       BuildConfig.get(args.site);
    })
    .command('build-search')
    .help('builds search index for a site')
    .argument('site', 'The site to index from')
    .action((args, options) => {
       BuildSearch.all(args.site);
    })
    .command('build-swagger')
    .help('builds swagger json file for a site')
    .argument('site', 'The site to index from')
    .action((args, options) => {
       BuildSwagger.get(args.site);
    })
    .command('harvest-cache')
    .argument('site', 'The site to import into')
    .help('Caches harvest sources.')
    .action((args, options) => {
        Harvest.cache(args.site);
    })
    .command('harvest-run')
    .argument('site', 'The site to import into')
    .help('Runs a harvest with cached sources.')
    .action((args, options) => {
        Harvest.run(args.site);
    });

prog.parse(process.argv);
