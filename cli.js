#!/usr/bin/env node
const prog = require('caporal');
const chalk = require('chalk');
const Config = require('./internals/models/config');
const Validate = require('./internals/scripts/validate');
const Build = require('./internals/scripts/build');
const Harvest = require('./internals/scripts/harvest');
const Content = require('./internals/models/content');
const Site = require('./internals/models/site');
const config = new Config(__dirname);

prog
  .version('0.0.1')
  .command('validate-site-contents')
  .help('validates a site contents based off of a schema')
  .argument('site', 'The site to validate')
  .action((args) => {
    Validate.contents(args.site, config);
  })
  .command('validate-site')
  .help('validates a site')
  .argument('site', 'The site to validate')
  .action((args) => {
    const site = new Site(args.site, config);
    site.validate((err) => {
      if (err) {
        console.log(chalk.red(JSON.stringify(err))); // eslint-disable-line no-console
      } else {
        console.log(chalk.green('Config file is valid.')); // eslint-disable-line no-console
      }
    });
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
    Build.docExport(args.site, config, args.collection, args.interraId, (err) => {
      if (err) {
        console.log(chalk.red(JSON.stringify(err))); // eslint-disable-line no-console
      } else {
        console.log(chalk.green('File exported.')); // eslint-disable-line no-console
      }
    });
  })
  .command('build-config')
  .help('builds config file for a site')
  .argument('site', 'The site to build from')
  .action((args) => {
    Build.configExport(args.site, config);
  })
  .command('build-datajson')
  .help('builds data.json file for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.datajsonxport(args.site, config);
  })
  .command('build-routes')
  .help('builds collection data for a site exporting it to the build dir')
  .argument('site', 'The site to build')
  .action((args) => {
    Build.routesExport(args.site, config);
  })
  .command('build-schema')
  .help('builds schema file for a site')
  .argument('site', 'The site to build from')
  .action((args) => {
    Build.schemaExport(args.site, config);
  })
  .command('build-search')
  .help('builds search index for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.searchExport(args.site, config, (err) => {
      if (err) {
        console.log(chalk.red(JSON.stringify(err))); // eslint-disable-line no-console
      } else {
        console.log(chalk.green('Search built.')); // eslint-disable-line no-console
      }
    });
  })
  .command('build-swagger')
  .help('builds swagger json file for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.swaggerExport(args.site, config, (err) => {
      if (err) {
        console.log(chalk.red(JSON.stringify(err))); // eslint-disable-line no-console
      } else {
        console.log(chalk.green('Swagger build completed.')); // eslint-disable-line no-console
      }
    });
  })
  .command('build')
  .help('builds api files for a site')
  .argument('site', 'The site to index from')
  .action((args) => {
    Build.all(args.site, config, (err) => {
      if (err) {
        console.log(chalk.red(JSON.stringify(err))); // eslint-disable-line no-console
      } else {
        console.log(chalk.green('Build completed.')); // eslint-disable-line no-console
      }
    });
  })
  .command('run-dev')
  .help('runs dev server for a site.')
  .argument('site', 'The site run')
  .action((args) => {
    process.env.NODE_ENV = 'development';
    process.env.SITE = args.site;
    require('./server'); // eslint-disable-line
  })
  .command('harvest-cache')
  .argument('site', 'The site to import into')
  .help('Caches harvest sources.')
  .action((args) => {
    Harvest.cache(args.site, config);
  })
  .command('harvest-run')
  .argument('site', 'The site to import into')
  .help('Runs a harvest with cached sources.')
  .action((args) => {
    Harvest.run(args.site, config);
  })
  .command('load-doc')
  .argument('site', 'The site to build from')
  .argument('collection', 'The colleciton to build from')
  .argument('interraId', 'The internal id of the item')
  .help('Runs a harvest with cached sources.')
  .action((args) => {
    const storage = config.get('storage');
    const content = new Content[storage](args.site, config);
    content.load(`${args.collection}/${args.interraId}.json`, (err, doc) => {
      console.log(err, doc); // eslint-disable-line no-console
    });
  });

prog.parse(process.argv);
