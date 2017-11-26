/**
 * @file
 * Provides validation scripts.
 */
const Ajv = require('ajv');
const Content = require('../models/content');
const Site = require('../models/site');
const Schema = require('../models/schema');
const _ = require('lodash');
const chalk = require('chalk');

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

/**
 * Validates all docs in site collections.
 * TODO: Use methods from content class.
 */
function contents(siteName, config) {
  const siteInfo = new Site(siteName, config);
  const storage = config.get('storage');
  const schemaName = siteInfo.getConfigItem(siteName, 'schema');
  const schema = new Schema(schemaName, config);
  const collections = schema.getConfigItem('collections');
  _.each(collections, (collection) => {
    const content = new Content[storage](siteName, config);
    schema.dereference(collection, (err, collectionSchema) => {
      if (err) {
        console.log(chalk.red('Error for ' + collection), err); // eslint-disable-line
        process.exit(1);
      }
      content.findByCollection(collection, true, (docserr, results) => {
        let count = 0;
        _.each(results, (item) => {
          console.log(item.publisher);
          const valid = ajv.validate(collectionSchema, item);
          if (!valid) {
            count++; // eslint-disable-line
            console.log(chalk.red('Validation error for: '), item); // eslint-disable-line
            console.log(chalk.red('Validation message: '), ajv.errors); // eslint-disable-line
          }
        });
        if (count) {
          console.log(chalk.red(count + ' validation errors for ' + collection)); // eslint-disable-line
        } else {
          console.log(chalk.green('No validation errors for ' + collection)); // eslint-disable-line
        }
      });
    });
  });
}

function site(site, config) { // eslint-disable-line
  console.log(chalk.blue('Site validation coming soon')); // eslint-disable-line
}

module.exports = {
  contents,
  site,
};
