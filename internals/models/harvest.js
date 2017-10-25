const fs = require('fs-extra');
const Config = require('./config');
const Site = require('./site');
const Schema = require('./schema');
const YAML = require('yamljs');
const Async = require('async');
const slug = require('slug');
const axios = require('axios');
const Ajv = require('ajv');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
const sourceSchema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Schema for the source",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "remote", "type"],
    "properties": {
      "id": {
        "type": "string",
        "title": "ID",
        "description": "Unique id for the source"
      },
      "remote": {
        "type": "string",
        "title": "Remote source",
        "format": "uri"
      },
      "type": {
        "type": "string",
        "title": "Type of source",
        "enum": ["datajson_v1_1_json"]
      },
      "excludes": {
        "type": "object",
        "title": "Exclude"
      },
      "defaults": {
        "type": "object",
        "title": "Defaults"
      },
      "overrides": {
        "type": "object",
        "title": "Overrides"
      },
    }
  }
}
class Harvest {
  constructor(content, sources) {
    this.content = content;
    this.sources = sources;
    const validator = ajv.compile(sourceSchema);
    const valid = validator(sources);
    if (!valid) {
      throw new Error("Sources file is not valid: " + JSON.stringify(validator.errors));
    }
  }
  /**
   *
   */
  createCache(callback) {
    Async.eachSeries(this.sources, (source, done) => {
      const dir = this.content.directory + '/../harvest/' + slug(source.id);
      console.log(dir);
      fs.ensureDirSync(dir);
      axios.get(source.remote)
        .then(function (response) {
          fs.writeJsonSync(dir + '/' + source.type + '.json', response);
//          console.log(response);
          done();
        })
        .catch(function (error) {
          console.log(err);
          done(error);
        });
    }, function(err) {
      return callback(err, true);
    });
  }

  static get sourceSchema() {
    return sourceSchema;
  }

  load(source) {

  }

}

/**
1. Consume config file
1. Save JSON URL to file.
2. Version if new
3. Load source from file
4. Parse individual docs
5. Reference docs
6. Save docs
7. Create log?
*/

class DataJSON extends Harvest {
  constructor(content, sources) {
    super(content, sources);
  }

}

module.exports = {
  DataJSON
};
