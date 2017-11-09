#!/usr/bin/env node
const prog = require('caporal');
const Config = require('./internals/models/config');
const Validate = require('./internals/scripts/validate');
const Build = require('./internals/scripts/build');
const Harvest = require('./internals/scripts/harvest');
const config = new Config(__dirname);

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
    Build.routesExport(args.site, config);
  })
  .command('build-collection-data')
  .help('builds collection data for a site exporting it to the build dir')
  .argument('site', 'The site to build')
  .action((args) => {
    console.log("Exporting data for " + args.site); // eslint-disable-line
    Build.docsExport(args.site, config);
  })
  .command('build-collection-data-item')
  .help('builds collection data for a collection item')
  .argument('site', 'The site to build from')
  .argument('collection', 'The colleciton to build from')
  .argument('interraId', 'The internal id of the item')
  .action((args) => {
    Build.docExport(args.site, args.interraId, args.collection, config);
  })
  .command('build-schema')
  .help('builds schema file for a site')
  .argument('site', 'The site to build from')
  .action((args) => {
    Build.schemaExport(args.site, config);
  })
  .command('build-config')
  .help('builds config file for a site')
  .argument('site', 'The site to build from')
  .action((args) => {
    Build.configExport(args.site, config);
  })
  .command('build-search')
  .help('builds search index for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.searchExport(args.site, config);
  })
  .command('build-swagger')
  .help('builds swagger json file for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.swaggerExport(args.site, config);
  })
  .command('build-datajson')
  .help('builds data.json file for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.datajsonxport(args.site, config);
  })
  .command('build')
  .help('builds api files for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.all(args.site, config);
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
