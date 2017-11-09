'use strict';
const Async = require('async');
const fs = require('fs-extra');
const chalk = require('chalk');
const elasticlunr = require('elasticlunr');

const Config = require('./config');
const Schema = require('./schema');
const Site = require('./site');
const path = require('path');
const apiSubDir = 'api/v1';

class Search {

  constructor(site, config) {
    this.sitesDir = config.get('sitesDir');
    this.siteDir = path.join(this.sitesDir, site);
    this.schemasDir = config.get('schemasDir');
    this.siteInfo = new Site(this.sitesDir);
    this.schemaName = this.siteInfo.getConfigItem(site,'schema'); 
    this.schema = new Schema(path.join(this.schemasDir, this.schemaName));
    this.apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  }

  init() {}

  insertOne() {}

  insertMany() {}

  update() {}

  delete() {}
}

class elasticSearch extends Search {

}

class dataJsonSearch extends Search {

}

class elasticLunr extends Search {

  constructor(site, config) {
    super(site, config);
  }

  init() {
    this.idx = elasticlunr(function(){});
    // TODO: get the map for this.
    this.idx.setRef('identifier');
  }

  insertOne(item, callback) {
    this.idx.addDoc(item)
    return callback(null);
  }

  push(callback) {
    const file = path.join(this.apiDir, 'search-index.json');
    fs.outputFile(file, JSON.stringify(this.idx), err => {
      callback(err, !err);
    });
  }
}

function type(obj) {
  return Object.prototype.toString.call(obj).match(/.* (.*)\]/)[  1]
}

function stringify(obj) {
  if (type(obj) === "Function") {
    return null
  }
  if (type(obj) === "Undefined") {
    return null
  }
  if (type(obj) === "Null") {
    return "null"
  }
  if (type(obj) === "Number") {
    return obj
  }
  if (type(obj) === "String") {
    return obj
  }
  if (type(obj) === "Object" || type(obj) === "Array") {
    var result = ""
    Object.keys(obj).forEach(function(key) {
      var val = stringify(obj[key])
      if (val !== null) {
	    result = result.trim() + " " + val
      }
    })
    return result
  }
}


module.exports = {
  elasticLunr
};
