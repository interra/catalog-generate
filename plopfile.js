const path = require('path');
const slug = require('slug');
const fs = require('fs-extra');
const YAML = require('yamljs');
const chalk = require('chalk');
const Site = require('./internals/models/site');
const Config = require('./internals/models/config');
const config = new Config(__dirname);


module.exports = function (plop) {
    plop.setGenerator('Create Site', {
        description: 'Creates site with config.yml file',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'What is the site name'
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter the site description'
            },
            {
                type: 'list',
                message: 'Select a schema',
                name: 'schema',
                choices: ['pod-full', 'simple'],
            },
            {
                type: 'list',
                message: 'Select storage',
                name: 'storage',
                choices: ['FileStorage', 'S3'],
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
            }
        ],
        actions: function (data) {
            var actions = [];
            const identifier = slug(data.name.toLowerCase()); 
            var settings = {
                name: data.name,
                identifier,
                schema: data.schema,
                description: data.description,
                "front-page-icon-collection": data['front-page-icon-collection'],
                "front-page-icons": YAML.parse(data['front-page-icons']),
            };
            const site = new Site(identifier, config);
            site.create(settings, (err, result) => {
                if (err == 'Site already exists') {
                    console.log(chalk.red('[PLOP] ') + 'Site "' + settings.name  + '" already exists');
                    process.exit(1);
                }
                else if (err == 'Schema not found') {
                    console.log(chalk.red('[PLOP] ') + 'Schema "' + settings.schema  + '" not found');
                    process.exit(1);
                }
                else if (err == 'Error creating config file') {
                    console.log(chalk.red('[PLOP] ') + err);
                    process.exit(1);
                }
                else if (err) {
                    console.log(chalk.red('[PLOP] ') + err);
                    process.exit(1);
                }
                else {
                    console.log(chalk.blue('[PLOP] ') + "Site creation successful.");
                }
            });
            return actions;
        }
    });
};
