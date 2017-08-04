const YAML = require('yamljs');
const fs = require('fs-extra');
const path = require('path');
const Schema = require('./schema');
const Config = require('./config');
const _ = require('lodash');

class Site {

    constructor() {
        this.config = new Config();
        this.sitesDir = this.config.get('sitesDir');
    }

    create(settings, callback) {
        var that = this;
        fs.stat(__dirname + '/' + that.siteDir + '/' + settings.site, function(err, stat) {
            if(err == null) {
                callback('Site already exists', null);
                process.exit(1);
            }
            var schema = new Schema(settings.schema);
            var config = schema.getConfig();

            that.sitedir = __dirname.replace("internals/models","") + that.sitesDir + '/' + settings.identifier;

            that.createDirs(that.sitedir, config.collections);

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
