const Ajv = require('ajv');
const Content = require('../models/content');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const _ = require('lodash');
const chalk = require('chalk');


const config = new Config();
const storage = config.get('storage');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));


function all(site) {
    var siteInfo = new Site();
    var schemaName = siteInfo.getConfigItem(site, 'schema');
    var schema = new Schema(schemaName);
    var collections = schema.getConfigItem('collections');
    _.each(collections, function(collection) {
        const content = new Content[storage](site);
        schema.dereference(collection, (err, collectionSchema) => {
            if (err) {
                console.log(chalk.red("Error for " + collection), err);
                process.exit(1);
            }

            content.findByCollection(collection, true, (err, results) => {
                var count = 0;
                _.each(results, function(item) {

                    var valid = ajv.validate(collectionSchema, item);
                    // TODO: Log results.
                    if (!valid) {
                        count++;
                        console.log(chalk.red("Validation error for: "), item);
                        console.log(chalk.red("Validation message: "), ajv.errors);
                    }
                });
                if (count) {
                    console.log(chalk.red(count + " validation errors for " + collection));
                }
                else {
                    console.log(chalk.green("No validation errors for " + collection));
                }
            });

        });

    });

}

module.exports = {
    all
}
