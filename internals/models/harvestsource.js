const fs = require('fs-extra');
const slug = require('slug');
const axios = require('axios');
const path = require('path');

class HarvestSource {
  constructor(content, source) {
    this.content = content;
    this.source = source;
  }
  cache(callback) {
    const dir = path.join(this.content.directory.substring(0, this.content.directory.length - 12), 'harvest', slug(this.source.id));
    fs.ensureDirSync(dir);
    console.log('Downloading data from ' + this.source.source); // eslint-disable-line
    if (this.source.source.substring(0, 7) === 'file://') {
      const sourceFile = path.join(this.content.directory.substring(0, this.content.directory.length - 12), this.source.source.substring(6, this.source.source.length));
      fs.copySync(sourceFile, path.join(dir, `${this.source.type}.json`));
      callback(null);
    } else {
      axios.get(this.source.source)
        .then((response) => {
          if (response.status === 200) {
            fs.writeJsonSync(path.join(dir, `${this.source.type}.json`), response.data);
          }
          callback(null);
        })
        .catch((error) => {
          callback(error);
        });
    }
  }

  load(callback) {
    const dir = path.join(this.content.directory.substring(0, this.content.directory.length - 12), 'harvest', slug(this.source.id));
    fs.readJson(path.join(dir, `${this.source.type}.json`), (err, result) => {
      callback(err, result);
    });
  }

}

class DataJSON extends HarvestSource {
  load(callback) {
    const dir = path.join(this.content.directory.substring(0, this.content.directory.length - 12), 'harvest', slug(this.source.id));
    fs.readJson(path.join(dir, `${this.source.type}.json`), (err, result) => {
      callback(err, result.dataset);
    });
  }
}

class CKAN extends HarvestSource {}

class Test extends HarvestSource {}

module.exports = {
  DataJSON,
  Test,
  CKAN,
};
