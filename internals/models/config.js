const YAML = require('yamljs');
const fs = require('fs-extra');
const path = require('path');

class Config {

   get(key) {
       var data = this.load();
       return data[key];
   }

    load() {
        var data = fs.readFileSync(__dirname + '/../../config.yml', 'utf8');
        return YAML.parse(data);
    }
}

module.exports = Config;
