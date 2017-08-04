#!/usr/bin/env node
const prog = require('caporal');
const dataJsonImport = require('./internals/scripts/datajson2yml');
const Validate = require('./internals/scripts/validateSchema');
const Build = require('./internals/scripts/build-collection-data');
const BuildSchema = require('./internals/scripts/build-schema');
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
    .command('import-datajson')
    .argument('site', 'The site to import into')
    .argument('url', 'The url to import from')
    .help('imports a new site from a data.json file')
    .action((args, options) => {
        var site = new Site();
        var schema = new Schema(site.getConfigItem(args.site, 'schema'));
        var config = schema.getConfig();
        dataJsonImport(args.url, config.collections, args.site);
    });

prog.parse(process.argv);
