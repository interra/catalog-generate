const fs = require('fs-extra');
const elasticlunr = require('elasticlunr');
const Schema = require('./schema');
const Site = require('./site');
const path = require('path');
const apiSubDir = 'api/v1';

class Search {

  constructor(site, config) {
    this.sitesDir = config.get('sitesDir');
    this.siteDir = path.join(this.sitesDir, site);
    this.schemasDir = config.get('schemasDir');
    this.siteInfo = new Site(site, config);
    this.schemaName = this.siteInfo.getConfigItem(site, 'schema');
    this.schema = new Schema(this.schemaName, config);
    this.apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  }

  init() {}

  insertOne() {}

  insertMany() {}

  update() {}

  delete() {}
}

class elasticSearch extends Search {}

class elasticLunr extends Search {

  init() {
    this.idx = elasticlunr(() => {});
    // TODO: get the map for this.
    this.idx.setRef('identifier');
  }

  insertOne(item, callback) {
    this.idx.addDoc(item);
    return callback(null);
  }

  push(callback) {
    const file = path.join(this.apiDir, 'search-index.json');
    fs.outputFile(file, JSON.stringify(this.idx), (err) => {
      callback(err, !err);
    });
  }
}

module.exports = {
  elasticLunr,
  elasticSearch,
};
