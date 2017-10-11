const fs = require('fs-extra');
const Config = require('../models/config');
const Site = require('../models/site');
const _ = require('lodash');
const chalk = require('chalk');
const Async = require('async');

const config = new Config();
const storage = config.get('storage');

function get(site) {
    var siteInfo = new Site();
    var siteConfig = siteInfo.getConfig(site);
    var buildDir = config.get('buildDir');
    var siteDir = __dirname.replace("internals/scripts", "") + buildDir + '/' + site + '/api/v1';
    fs.outputJson(siteDir + '/config.json', siteConfig, err => {
        if (err) {
            console.log(err);
        }
        console.log(chalk.blue("Config file built."));
    });
}

module.exports = {
   get
}
