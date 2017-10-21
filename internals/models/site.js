const YAML = require('yamljs');
const fs = require('fs-extra');
const path = require('path');
const Schema = require('./schema');
const Async = require('async');

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

  /** Required fields for site settings. */
  static required = [ "name", "description", "identifier", "schema"];

  /** Optional fields for site settings. */
  static optional = [ "front-page-icons", "front-page-icon-collection", "fontConfig"];

  /**
   * jQuery's inArray.
   * @param {string} needle The item to search for.
   * @param {array} haystack Them items to search in.
   * @return {boolean} True if needle in haystack.
   */
  inArray(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
      if(haystack[i] == needle) return true;
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
    Async.each(Object.keys(settings), function(item, callback) {
      if (inArray(item, optional)) {
        callback();
      }
      else {
        callback(item + " is not allowed.");
      }
    }, function(err) {
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
  validateRequired(required, settings)  {
    Async.each(required, function(item, callback) {
      if (inArray(item, Object.keys(settings))) {
        callback();
      }
      else {
        callback(item + " not found in settings.");
      }
    }, function(err) {
      if (err) {
        throw new Error(err);
        return false;
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
    var that = this;
    fs.stat(__dirname + '/' + that.siteDir + '/' + settings.identifier, function(err, stat) {
      if(err == null) {
        callback('Site already exists', null);
        process.exit(1);
      }
      const schema = new Schema(settings.schema);
      const schemaConfig = schema.getConfig();

      that.sitedir = __dirname.replace("internals/models","") + that.sitesDir + '/' + settings.identifier;

      that.createDirs(that.sitedir, schemaConfig.collections);

      fs.ensureDir(that.sitedir)
        .then(() => {
          fs.writeFile(that.sitedir + '/config.yml', YAML.stringify(settings), function(err) {
            if (err) {
              callback('Error creating config file', null);
            }
            callback(null, true);
          });
        })
        .catch(err => {
          callback('Error creating config file', null);
        });
    });
  }

    createDirs(dir, collections) {
        var that = this;
        _.each(collections, function(collection) {
            fs.ensureDir(dir +  '/collections/' + collection)
                .catch(err => {
                    console.log(err)
                });
        });
    }

    getConfig(site) {
        var data = fs.readFileSync(__dirname + '/../../' + this.sitesDir + '/' + site + '/config.yml', 'utf8');
        return YAML.parse(data);
    }

    getConfigItem(site, item) {
        var items = this.getConfig(site);
        return items[item];
    }

}

module.exports = Site;
