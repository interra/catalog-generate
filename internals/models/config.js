const YAML = require('yamljs');
const fs = require('fs-extra');
const path = require('path');

class Config {

 /**
  * @param {string} confiDir Full path to the dir that contains config.yml file.
  */
 constructor(configDir) {
   this.configDir = configDir;
   this.configFile = path.join(configDir, 'config.yml');
   this.data = {};
   if (!(fs.pathExistsSync(this.configFile))) {
     throw new Error('Config class could not be instantiated. config.yml file not found at :' + this.configFile);
   }
 }

 get(key) {
   const data = this.load();
   if (key === 'sitesDir' || key === 'schemasDir' || key === 'buildDir') {
     return path.join(this.configDir, data[key]);
   } else {
     return data[key];
   }
 }

  load() {
    if (Object.keys(this.data).length > 1) {
      return this.data;
    }
    else {
      const data = fs.readFileSync(this.configFile, 'utf8');
      this.data = YAML.parse(data);
      return this.data;
    }
  }
}

module.exports = Config;
