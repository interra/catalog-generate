const YAML = require('yamljs');
const fs = require('fs-extra');
const path = require('path');
const Schema = require('./schema');
const Async = require('async');
const _ = require('lodash');

/** Required fields for site settings. */
const required = ['name', 'description', 'identifier', 'schema'];

/** Optional fields for site settings. */
const optional = ['front-page-icons', 'front-page-icon-collection', 'fontConfig'];

/**
 * Class for managing sites.
 */
class Site {

  /**
   * Create a site.
   * @param {string} sitesDir The location in the filesystem of site folder.
   */
  constructor(sitesDir) {
    this.sitesDir = sitesDir;
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
      if (that.inArray(item, optional)) {
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
   * Validates whether settings contains required fields.
   * @param {array} required An array required fields,
   * @param {object} settings Settings object for a site.
   * @return {boolean} Returns true if validation passes.
   */
  validateRequired(settings) {
    const that = this;
    Async.each(required, (item, callback) => {
      if (that.inArray(item, Object.keys(settings))) {
        callback();
      } else {
        callback(`${item} not found in settings.`);
      }
    }, (err) => {
      if (err) {
        throw new Error(err);
      }
      return true;
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
      const schema = new Schema(settings.schema);
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

  getConfig(site) {
    const data = fs.readFileSync(path.join(this.sitesDir, site, 'config.yml'), 'utf8');
    return YAML.parse(data);
  }

  getConfigItem(site, item) {
    const items = this.getConfig(site);
    return items[item];
  }

}

module.exports = Site;
