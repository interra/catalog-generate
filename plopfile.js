const slug = require('slug');
const YAML = require('yamljs');
const chalk = require('chalk');
const Site = require('./internals/models/site');
const Config = require('./internals/models/config');
const config = new Config(__dirname);


module.exports = (plop) => {
  plop.setGenerator('Create Site', {
    description: 'Creates site with config.yml file',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the site name',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Enter the site description',
      },
      {
        type: 'list',
        message: 'Select a schema',
        name: 'schema',
        choices: ['pod-full', 'simple'],
      },
      {
        type: 'list',
        message: 'Select search',
        name: 'search',
        choices: ['simpleSearch', 'elasticLunr', 'elasticSearch'],
      },
      {
        type: 'editor',
        message: 'Enter fields to include in the search index  (as yml array of collections)',
        name: 'fields',
      },
      {
        type: 'list',
        message: 'Select storage',
        name: 'storage',
        choices: ['FileStorage', 'Mongo'],
      },
      {
        type: 'input',
        message: 'Enter Front Page Icon Collection',
        name: 'front-page-icon-collection',
        default: 'theme',
      },
      {
        type: 'editor',
        message: 'Enter Front Page Icons (as yml array of ids)',
        name: 'front-page-icons',
      },
    ],
    actions: (data) => {
      const identifier = slug(data.name.toLowerCase());
      const search = {
        type: data.search,
        fields: YAML.parse(data.fields),
      };
      const settings = {
        name: data.name,
        identifier,
        schema: data.schema,
        search,
        description: data.description,
        'front-page-icon-collection': data['front-page-icon-collection'],
        'front-page-icons': YAML.parse(data['front-page-icons']),
      };
      const site = new Site(identifier, config);
      site.create(settings, (err) => {
        if (err === 'Site already exists') {
          console.log(chalk.red('[PLOP] ') + 'Site "' + settings.name  + '" already exists'); // eslint-disable-line
          process.exit(1);
        } else if (err === 'Schema not found') {
          console.log(chalk.red('[PLOP] ') + 'Schema "' + settings.schema  + '" not found'); // eslint-disable-line
          process.exit(1);
        } else if (err === 'Error creating config file') {
          console.log(chalk.red('[PLOP] ') + err); // eslint-disable-line
          process.exit(1);
        } else if (err) {
          console.log(chalk.red('[PLOP] ') + err); // eslint-disable-line
          process.exit(1);
        } else {
          console.log(chalk.blue('[PLOP] ') + "Site creation successful."); // eslint-disable-line
        }
      });
      return [];
    },
  });
};
