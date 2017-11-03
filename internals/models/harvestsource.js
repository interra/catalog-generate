const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const axios = require('axios');

class HarvestSource {
  constructor(content, source) {
    this.content = content;
    this.source = source;
  }
  cache(callback) {
    const that = this;
    const dir = this.content.directory.substring(0, this.content.directory.length - 12) + '/harvest/' + slug(this.source.id);
    fs.ensureDirSync(dir);
    console.log("Downloading data from " + this.source.source);
    if (this.source.source.substring(0,7) === 'file://') {
      const sourceFile = this.content.directory.substring(0, this.content.directory.length - 12) + this.source.source.substring(6, this.source.source.length);
      fs.copySync(sourceFile, dir + '/' + this.source.type + '.json');
      return callback(null);
    }
    else {
      axios.get(this.source.source)
        .then(function (response) {
          if (response.status === 200) {
            fs.writeJsonSync(dir + '/' + that.source.type + '.json', response.data);
          }
          return callback(null);
        })
        .catch(function (error) {
          console.log(error);
          return callback(error);
        });
    }
  }

  load(callback) {
    const dir = this.content.directory.substring(0, this.content.directory.length - 12) + '/harvest/' + slug(this.source.id);
    fs.readJson(dir + '/' + this.source.type + '.json', (err, result) => {
      callback(null, result);
    });
  }

}

class DataJSON extends HarvestSource {
  constructor(content, source) {
    super(content, source);
  }
  load(callback) {
    const dir = this.content.directory.substring(0, this.content.directory.length - 12) + '/harvest/' + slug(this.source.id);
    fs.readJson(dir + '/' + this.source.type + '.json', (err, result) => {
      callback(null, result.dataset);
    });
  }
}

class CKAN extends HarvestSource {
  constructor(content, source) {
    super(content, source);
  }
}

class Test extends HarvestSource {}

/**
1. Consume config file [x]
1. Save JSON URL to file. [x]
2. Version if new  [-]
3. Load source from file load()
4. Parse individual docs prepare()
5. Reference docs ref()
6. Save docs
7. Create log?
*/


module.exports = {
  DataJSON,
  Test,
  CKAN
};
