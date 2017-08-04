const path = require('path');
const slug = require('slug');
const fs = require('fs-extra');
const chalk = require('chalk');
const Site = require('./internals/models/site');

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
            }
        ],
        actions: function (data) {
            var actions = [];
            var site = new Site();
            var settings = {
                name: data.name,
                identifier: slug(data.name.toLowerCase()),
                schema: data.schema,
                description: data.description,
            };
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
