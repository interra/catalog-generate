const Ajv = require('ajv');
const fs = require('fs-extra');
const Config = require('../models/config');
const Site = require('../models/site');
const Schema = require('../models/schema');
const _ = require('lodash');
const chalk = require('chalk');
const slug = require('slug');
const Async = require('async');

const config = new Config();
const storage = config.get('storage');
const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

const swagger = {
  swagger:"2.0",
  info: {
    description:"Interra Open Data Catalog APIs. These are all read endpoints since Interra Generate runs without a server. Full CRUD APIs are available with Interra Admin.",
    version:"0.0.1",
    title: config.get('name') + " Data Catalog API"
  },
  paths: {
    "/data.json":{
      "get":{
        summary:"Project Open Data inspired endpoint",
        operationId: "dataJson",
        description: "A list of all of the datasets as fully rendered documents. If using the pod-full schema this will be Project Open Data compliant.",
        produces: ["application/json"],
        responses: {
          "200":{
            description: "This is a file so will either be 200 or 404",
            schema:{
              type: "array",
              items:{
                "$ref":"#/definitions/dataset"
              }
            }
          }
        }
      }
    },
    "/schema.json": {
      "get":{
        summary:"Schema for the catalog",
        operationId: "schema",
        description: "A list of all of the schemas for the catalog.",
        produces: ["application/json"],
        responses: {
          "200": {
            "description": "This is a file so will either be 200 or 404",
            "schema": {
              "type": "object",
              "properties": {
                "collections": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "title": "Collections",
                    "description": "A list of strings of the collections in the catalog."
                  }
                },
                "schema": {
                  "type": "object",
                  "title": "Schema",
                  "description": "Schemas for all of the catalog collections"
                },
                "map": {
                  "type": "object",
                  "description": "A mapping of expected keys for collections and the actual value. For example every collection should have an identifier. Map allows implementing a different key for identifier or other required keys.",
                  "title": "Map"
                },
                "uiSchema": {
                  "type": "object",
                  "title": "UISchema",
                  "description": "A UISchema for the forms for each collection. See Mozilla's react-json-schema-form for details."
                }
              }
            }
          }
        }
      }
    },
    "/routes.json": {
      "get": {
        summary: "A list of routes for the catalog.",
        description: "This list is used by the front end to determine what routes are rendered as well as the build process for rendering each HTML page.",
        operationId: "routes",
        produces: ["application/json"],
        responses: {
          "200": {
            description: "This is a file so will either be 200 or 404",
            schema:{
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        }
      }
    },
    "/latest.json": {
      "get": {
        summary: "A list of datasets in descending date order.",
        description: "This list is used by the front end to determine what routes are rendered as well as the build process for rendering each HTML page.",
        operationId: "latest",
        produces: ["application/json"],
        responses: {
          "200": {
            description: "This is a file so will either be 200 or 404",
            schema:{
              type: "array",
              items: {
                type: "object",
                properties: {
                  identifier: {
                    type: "string"
                  },
                  modified: {
                    type: "string"
                  }
                }
              }
            }
          }
        }
      }
    }

  },
  definitions: {
  },
  host: "",
  basePath:"/api/v1/",
  schemes:["https","http"]
}

function setCollectionPathDocDef(collection, collectionPathDef) {
  let documentPathDef = JSON.parse(JSON.stringify(collectionPathDef));
  documentPathDef.get['description'] = "An individual document in the " + collection;
  documentPathDef.get['operationId'] = collection + 'CollectionDoc';
  documentPathDef.get.parameters = [
    {
      in: "path",
      name: "document",
      type: "string",
      required: true,
      description: "The identifier for the document."
    }
  ];
  return documentPathDef;
}

function setCollectionPathDef(collection) {
  let conf = {
    'get': {
      summary: 'All results for ' + collection + ' collection',
      operationId: collection + 'Collection',
      produces: ["application/json"],
      responses: {
        200: {
          description: "This is a file so will either be 200 or 404",
          schema: {
            type: "array",
            items: {
              "$ref":"#/definitions/" + collection
            }
          }
        }
      }
    }
  };
  return conf;
}

function get(site) {
    var siteInfo = new Site();
    var schemaName = siteInfo.getConfigItem(site, 'schema');
    var schema = new Schema(schemaName);
    var collections = schema.getConfigItem('collections');
    var buildDir = config.get('buildDir');
    var siteDir = __dirname.replace("internals/scripts", "") + buildDir + '/' + site + '/api/v1';

    Async.each(collections, function(collection, callback) {
        if (collection == 'dataset') {
            schema.dereference(collection, (err, collectionSchema) => {
                if (err) {
                    console.log(chalk.red("Error for " + collection), err);
                    process.exit(1);
                }
                // Swagger doesn't like these.
                delete collectionSchema['$schema'];
                delete collectionSchema['id'];
                swagger.definitions[collection] = collectionSchema;
                const collectionPathDef = setCollectionPathDef(collection);
                swagger.paths['/collections/' + collection + '.json'] = collectionPathDef;
                swagger.paths['/collections/' + collection + '/{document}.json'] = setCollectionPathDocDef(collection, collectionPathDef)
                callback();
            });
        }
        else {
            schema.load(collection, (err, collectionSchema) => {
                if (err) {
                    console.log(chalk.red("Error for " + collection), err);
                    process.exit(1);
                }
                // Swagger doesn't like these.
                delete collectionSchema['$schema'];
                delete collectionSchema['id'];
                swagger.definitions[collection] = collectionSchema;
                const collectionPathDef = setCollectionPathDef(collection);
                swagger.paths['/collections/' + collection + '.json'] = collectionPathDef;
                swagger.paths['/collections/' + collection + '/{document}.json'] = setCollectionPathDocDef(collection, collectionPathDef)

                callback();
            });
        }

    }, function (err) {
      fs.outputJson(siteDir + '/swagger.json', swagger, err => {
          if (err) {
              console.log(err);
          }
      });
    });

}

module.exports = {
   get
}
