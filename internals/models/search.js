const fs = require('fs-extra');
const elasticlunr = require('elasticlunr');
const Schema = require('./schema');
const Site = require('./site');
const path = require('path');
const apiSubDir = 'api/v1';
const AWS = require('aws-sdk');
const algoliasearch = require('algoliasearch');

class Search {

  constructor(site, config) {
    this.sitesDir = config.get('sitesDir');
    this.siteDir = path.join(this.sitesDir, site);
    this.schemasDir = config.get('schemasDir');
    this.siteInfo = new Site(site, config);
    this.schemaName = this.siteInfo.getConfigItem('schema');
    this.schema = new Schema(this.schemaName, config);
    this.searchConfig = this.siteInfo.getConfigItem('search');
    this.apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  }

  init(callback) {
    callback();
  }

  prepareSearchFields(doc, toString) {
    const prepped = {};
    this.searchConfig.fields.forEach((field) => {
      if (toString) {
      prepped[field] = stringify(doc[field]); 
      } else {
        prepped[field] = doc[field]; 
      }
    });
    prepped.identifier = doc.identifier;
    prepped.interra = doc.interra;
    prepped.modified = doc.modified;
    return prepped;
  }

  push(callback) {
    callback();
  }

  insertOne(callback) {
    callback();
  }

  insertMany() {}

  update() {}

  delete() {}
}

class algoliaSearch extends Search {

  init(callback) {
    this.algolia = this.siteInfo.getConfigItem('algolia');
    const client = algoliasearch(this.algolia.applicationId, this.algolia.apiKey);
    this.index = client.initIndex(this.algolia.index);
    this.index.clearIndex((err, content) => {
      callback(err, !err);
    });
  }

  insertOne(item, callback) {
    let doc = this.prepareSearchFields(item, false);
    doc.objectID = doc.interra.id;
    console.log("indexing " + doc.title);
    this.index.addObject(doc, (err, content) => {
      callback(err, !err);
    });
    
  }
}

class elasticSearch extends Search {

  init(callback) {
    this.private = this.siteInfo.getConfigItem('private');
    this.aws = this.private.aws;
    const accessKeyId = this.aws.accessKeyId; 
    const secretAccessKey = this.aws.secretAccessKey; 
    const region = this.aws.region; 
    const esEndpoint = this.aws.es.endpoint;
    AWS.config.update({
      credentials: new AWS.Credentials(accessKeyId, secretAccessKey),
      region
    });

    this.Client = require('elasticsearch').Client({
      hosts: [ esEndpoint ],
      connectionClass: require('http-aws-es')
    });
    const that = this;
   
    this.Client.ping({
      requestTimeout: 30000,
    }, function (error) {
      if (error) {
        callback(error);
      } else {
        that.Client.indices.delete({
          index: that.aws.es.index 
        }, (err, res) => {
          if (err) {
            callback(err.msg);
          } else {
            that.Client.indices.create({
              index: that.aws.es.index 
            }, (createErr, res) => {
              callback(createErr, !createErr);
            });
          }
        });
      }
    });
  }

  insertOne(item, callback) {
    const doc = this.prepareSearchFields(item, false);
    this.Client.create({
      index: this.aws.es.index,
      type: this.schema.getConfigItem('primaryCollection'),
      id: doc.identifier,
      body: doc 
    }, function (error, response) {
      callback(error, !error);
    });
  }

}

class simpleSearch extends Search {

  init(callback) {
    this.idx = [];
    callback();
  }

  insertOne(item, callback) {
    const doc = this.prepareSearchFields(item, false);
    const exp = {
      doc,
      ref: doc.interra.id,
    }
    this.idx.push(exp);
    return callback(null);
  }

  push(callback) {
    const file = path.join(this.apiDir, 'search-index.json');
    fs.outputFile(file, JSON.stringify(this.idx), (err) => {
      callback(err, !err);
    });
  }
}

class elasticLunr extends Search {

  init(callback) {
    this.idx = elasticlunr(() => {});
    // TODO: get the map for this.
    this.idx.setRef('identifier');
    this.searchConfig.fields.forEach((field) => {
      this.idx.addField(field);
    });
    callback();
  }

  insertOne(item, callback) {
    const doc = this.prepareSearchFields(item, false);
    this.idx.addDoc(doc);
    return callback(null);
  }

  push(callback) {
    const file = path.join(this.apiDir, 'search-index.json');
    fs.outputFile(file, JSON.stringify(this.idx), (err) => {
      callback(err, !err);
    });
  }
}

function type(obj) {
  return Object.prototype.toString.call(obj).match(/.* (.*)\]/)[  1]
}

function stringify(obj) {
  if (type(obj) === 'Function') {
    return null
  }
  if (type(obj) === 'Undefined') {
    return null
  }
  if (type(obj) === 'Null') {
    return 'null'
  }
  if (type(obj) === 'Number') {
    return obj
  }
  if (type(obj) === 'String') {
    return obj
  }
  if (type(obj) === 'Object' || type(obj) === 'Array') {
    var result = ''
    Object.keys(obj).forEach(function(key) {
      var val = stringify(obj[key])
      if (val !== null) {
      result = result.trim() + ' ' + val
      }
    })
    return result
  }
}

module.exports = {
  elasticLunr,
  simpleSearch,
  algoliaSearch,
  elasticSearch,
};
