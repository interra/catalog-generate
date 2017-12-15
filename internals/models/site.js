const YAML = require('yamljs');
const fs = require('fs-extra');
const path = require('path');
const Schema = require('./schema');
const Async = require('async');
const _ = require('lodash');
const Ajv = require('ajv');
const ajv = new Ajv();

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

const siteSchema = require('./site-schema.json');

/**
 * Class for managing sites.
 */
class Site {

  /**
   * Create a site.
   * @param {string} sitesDir The location in the filesystem of site folder.
   */
  constructor(site, config) {
    this.config = config;
    this.sitesDir = config.get('sitesDir');
    this.siteDir = path.join(this.sitesDir, site);
  }

  /**
   * jQuery's inArray.
   * @param {string} needle The item to search for.
   * @param {array} haystack Them items to search in.
   * @return {boolean} True if needle in haystack.
   */
  inArray(needle, haystack) {
    const length = haystack.length;
    for (let i = 0; i < length; i++) { // eslint-disable-line
      if (haystack[i] === needle) return true;
    }
    return false;
  }

  // Retrieves pageSchema.
  pageSchema() {
    const data = fs.readFileSync(path.join(this.siteDir, 'pageSchema.yml'), 'utf8');
    return YAML.parse(data);
  }

  validate(callback) {
    const that = this;
    Async.waterfall([
      (done) => {
        this.validateConfig((err) => {
          done(err);
        });
      },
      (done) => {
        that.validateFolders((err) => {
          done(err);
        });
      },
    ], (err) => {
      callback(err);
    });
    // config.yml
    // collections
    // harvest
  }

  validateFolders(callback) {
    // Directory can be empty or must contain 'collections' or 'harvest'.
    const isDirectory = (source) => fs.lstatSync(source).isDirectory();
    const getDirectories = (source) =>
      fs.readdirSync(source).map((name) => path.join(source, name)).filter(isDirectory).map((fullDir) => path.basename(fullDir));
    const dirs = getDirectories(this.siteDir);
    if (dirs.length < 1) {
      callback(null);
    } else if (dirs.length > 2) {
      callback(`${this.sitesDir} can only include 'collections' and 'harvest' folders`);
    } else if (dirs.length === 2) {
      if (!(dirs.includes('collections'))) {
        callback(`${this.sitesDir} can only include 'collections' and 'harvest' folders`);
      } else if (!(dirs.includes('harvest'))) {
        callback(`${this.sitesDir} can only include 'collections' and 'harvest' folders`);
      } else {
        callback(null);
      }
    } else if (dirs.length === 1) {
      if (!(dirs.includes('collections')) && !(dirs.includes('harvest'))) {
        callback(`${this.sitesDir} can only include 'collections' and 'harvest' folders`);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  }

  validateConfig(callback) {
    const siteConfig = this.getConfig();
    const valid = ajv.validate(siteSchema, siteConfig);
    if (!valid) {
      callback(ajv.errors);
    } else {
      callback(false);
    }
  }

  /**
   * Validates whether settings fields are in list of acceptable fields.
   * Expects fields to be combo of required() + optional().
   * @param {array} fields An array allowed fields,
   * @param {object} settings Settings object for a site.
   * @return {boolean} Returns true if validation passes.
   */
  validateSettings(fields, settings) {
    const that = this;
    Async.each(Object.keys(settings), (item, callback) => {
      if (that.inArray(item, fields)) {
        callback();
      } else {
        callback(`${item} is not allowed.`);
      }
    }, (err) => {
      if (err) {
        throw new Error(err);
      }
    });
  }

  /**
   * Creates a new site.
   * @param {object} settings The site settings.
   * @param {function} callback callback function (err, result);
   */
  create(settings, callback) {
    const that = this;
    fs.stat(path.join(that.siteDir, settings.identifier), (err) => {
      if (err === null) {
        callback('Site already exists', null);
        process.exit(1);
      }
      const schema = new Schema(settings.schema, that.config);
      const schemaConfig = schema.getConfig();

      that.sitedir = path.join(that.sitesDir, settings.identifier);

      that.createDirs(that.sitedir, schemaConfig.collections);

      fs.ensureDir(that.sitedir)
        .then(() => {
          fs.writeFile(`${that.sitedir}/config.yml`, YAML.stringify(settings), (writeerr) => {
            callback(writeerr, true);
          });
        })
        .catch((direrr) => {
          callback(`Error creating config file: ${direrr}`, null);
        });
    });
  }

  createDirs(dir, collections) {
    _.each(collections, (collection) => {
      fs.ensureDir(path.join(dir, 'collections', collection))
        .catch((err) => {
          console.log(err); // eslint-disable-line
        });
    });
  }

  getConfig() {
    const data = fs.readFileSync(path.join(this.siteDir, 'config.yml'), 'utf8');
    return YAML.parse(data);
  }

  getConfigItem(item) {
    const items = this.getConfig();
    return items[item];
  }
}

module.exports = Site;
