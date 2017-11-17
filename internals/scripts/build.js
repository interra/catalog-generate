/**
 * @file
 * Build functions for exporting site content and config.
 * TODO: Maybe make this a class like the others so we can properly pass config.
 */
const Content = require('../models/content');
const Site = require('../models/site');
const Search = require('../models/search');
const Schema = require('../models/schema');
const fs = require('fs-extra');
const Async = require('async');
const path = require('path');
const apiSubDir = 'api/v1';

function prepare(site, config) {
  const storage = config.get('storage');
  const content = new Content[storage](site, config);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  fs.ensureDirSync(apiDir);
  return content;
}

/**
 * Exports routes.
 */
function routesExport(site, config, callback) {
  const content = prepare(site, config);
  const routeCollections = content.schema.getConfigItem('routeCollections');
  const file = path.join(config.get('buildDir'), site, 'api/v1/routes.json');

  content.buildRegistry((err, results) => {
    Async.transform(results, (acc, item, index, done) => {
      if (routeCollections.indexOf(index) !== -1) {
        acc[index] = item;
      }
      done(null);
    }, (transerr, result) => {
      fs.outputFile(file, JSON.stringify(result), (fileerr) => {
        callback(fileerr, !fileerr);
      });
    });
  });
}

/**
 * Exports json files for each doc in each collection.
 */
function docsExport(site, config, callback) {
  const content = prepare(site, config);

  content.findAll(true, (err, results) => {
    Async.each(content.collections, (collection, done) => {
      const docs = results[collection];
      content.exportMany(docs, collection, (experr) => {
        done(experr, !experr);
      });
    }, (eacherr) => {
      callback(eacherr, !eacherr);
    });
  });
}

/**
 * Exports json file for single doc.
 */
function docExport(site, config, collection, interraId, callback) {
  const content = prepare(site, config);
  content.findByInterraId(interraId, collection, (err, doc) => {
    if (err) callback(err);
    content.Deref(doc, (derefErr, dereffed) => {
      if (err) callback(derefErr);
      content.exportOne(interraId, collection, dereffed, (exportErr) => {
        callback(exportErr, !exportErr);
      });
    });
  });
}

/**
 * Exports the schema for the site.
 */
function schemaExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName, config);
  const collections = schema.getConfigItem('collections');
  const facets = schema.getConfigItem('facets');
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);

  const schemas = {
    collections,
    schema: {},
    map: {},
    uiSchema: {},
    facets,
  };
  Async.each(collections, (collection, done) => {
    if (collection === primaryCollection) {
      schema.dereference(collection, (err, collectionSchema) => {
        if (err) {
          callback(err);
        }
        schemas.schema[collection] = collectionSchema;
        done();
      });
    } else {
      schema.load(collection, (err, collectionSchema) => {
        if (err) {
          callback(err);
        }
        schemas.schema[collection] = collectionSchema;
        done();
      });
    }
  }, () => {
    schemas.map = schema.mapSettings();
    schema.uiSchema = schema.uiSchema();
    fs.outputJson(`${apiDir}/schema.json`, schemas, (fileerr) => {
      callback(fileerr, !fileerr);
    });
  });
}

/**
 * Exports configuration.
 */
function configExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const siteConfig = siteInfo.getConfig(site);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  fs.outputJson(`${apiDir}/config.json`, siteConfig, (err) => {
    callback(err, !err);
  });
}

/**
 * Exports search file for site.
 */
function searchExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName, config);
  const searchEngine = config.get('search');
  const search = new Search[searchEngine](site, config);
  const content = prepare(site, config);
  const primaryCollection = schema.getConfigItem('primaryCollection');

  search.init();

  Async.auto({
    load: (done) => {
      content.findByCollection(primaryCollection, true, (err, results) => {
        done(err, results);
      });
    },
    index: ['load', (results, done) => {
      Async.eachSeries(results.load, (item, fin) => {
        search.insertOne(item, (err, out) => {
          fin(err, out);
        });
      }, (err) => {
        done(err, !err);
      });
    }],
  }, (err) => {
    if (err) {
      callback(err);
    } else {
      search.push((pusherr) => {
        callback(pusherr, !pusherr);
      });
    }
  });
}

function setCollectionPathDocDef(collection, collectionPathDef) {
  const documentPathDef = JSON.parse(JSON.stringify(collectionPathDef));
  documentPathDef.get.description = `An individual document in the ${collection}`;
  documentPathDef.get.operationId = `${collection}CollectionDoc`;
  documentPathDef.get.parameters = [
    {
      in: 'path',
      name: 'document',
      type: 'string',
      required: true,
      description: 'The identifier for the document.',
    },
  ];
  return documentPathDef;
}

function setCollectionPathDef(collection) {
  const conf = {
    get: {
      summary: `All results for ${collection} collection`,
      operationId: `${collection}Collection`,
      produces: ['application/json'],
      responses: {
        200: {
          description: 'This is a file so will either be 200 or 404',
          schema: {
            type: 'array',
            items: {
              $ref: `#/definitions/${collection}`,
            },
          },
        },
      },
    },
  };
  return conf;
}

function swaggerExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName, config);
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const collections = schema.getConfigItem('collections');

  const swagger = {
    swagger: '2.0',
    info: {
      description: 'Interra Open Data Catalog APIs. These are all read endpoints since Interra Generate runs without a server. Full CRUD APIs are available with Interra Admin.',
      version: '0.0.1',
      title: `${siteInfo.getConfigItem(site, 'name')} Data Catalog API`,
    },
    paths: {
      '/data.json': {
        get: {
          summary: 'Project Open Data inspired endpoint',
          operationId: 'dataJson',
          description: 'A list of all of the datasets as fully rendered documents. If using the pod-full schema this will be Project Open Data compliant.',
          produces: ['application/json'],
          responses: {
            200: {
              description: 'This is a file so will either be 200 or 404',
              schema: {
                type: 'array',
                items: {
                  $ref: '#/definitions/dataset',
                },
              },
            },
          },
        },
      },
      '/schema.json': {
        get: {
          summary: 'Schema for the catalog',
          operationId: 'schema',
          description: 'A list of all of the schemas for the catalog.',
          produces: ['application/json'],
          responses: {
            200: {
              description: 'This is a file so will either be 200 or 404',
              schema: {
                type: 'object',
                properties: {
                  collections: {
                    type: 'array',
                    items: {
                      type: 'string',
                      title: 'Collections',
                      description: 'A list of strings of the collections in the catalog.',
                    },
                  },
                  schema: {
                    type: 'object',
                    title: 'Schema',
                    description: 'Schemas for all of the catalog collections',
                  },
                  map: {
                    type: 'object',
                    description: 'A mapping of expected keys for collections and the actual value. For example every collection should have an identifier. Map allows implementing a different key for identifier or other required keys.',
                    title: 'Map',
                  },
                  uiSchema: {
                    type: 'object',
                    title: 'UISchema',
                    description: 'A UISchema for the forms for each collection. See Mozilla\'s react-json-schema-form for details.',
                  },
                },
              },
            },
          },
        },
      },
      '/routes.json': {
        get: {
          summary: 'A list of routes for the catalog.',
          description: 'This list is used by the front end to determine what routes are rendered as well as the build process for rendering each HTML page.',
          operationId: 'routes',
          produces: ['application/json'],
          responses: {
            200: {
              description: 'This is a file so will either be 200 or 404',
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      '/latest.json': {
        get: {
          summary: 'A list of datasets in descending date order.',
          description: 'This list is used by the front end to determine what routes are rendered as well as the build process for rendering each HTML page.',
          operationId: 'latest',
          produces: ['application/json'],
          responses: {
            200: {
              description: 'This is a file so will either be 200 or 404',
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    identifier: {
                      type: 'string',
                    },
                    modified: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    definitions: {
    },
    host: '',
    basePath: '/api/v1/',
    schemes: ['https', 'http'],
  };

  Async.each(collections, (collection, done) => {
    if (collection === primaryCollection) {
      schema.dereference(collection, (err, collectionSchema) => {
        if (err) {
          callback(err);
        }
        // Swagger doesn't like these.
        delete collectionSchema.$schema; // eslint-disable-line no-param-reassign
        delete collectionSchema.id; // eslint-disable-line no-param-reassign
        swagger.definitions[collection] = collectionSchema; // eslint-disable-line no-param-reassign
        const collectionPathDef = setCollectionPathDef(collection);
        swagger.paths['/collections/' + collection + '.json'] = collectionPathDef; // eslint-disable-line prefer-template
        swagger.paths['/collections/' + collection + '/{document}.json'] = setCollectionPathDocDef(collection, collectionPathDef); // eslint-disable-line prefer-template
        done();
      });
    } else {
      schema.load(collection, (err, collectionSchema) => {
        if (err) {
          callback(err);
        }
        // Swagger doesn't like these.
        delete collectionSchema.$schema; // eslint-disable-line no-param-reassign
        delete collectionSchema.id; // eslint-disable-line no-param-reassign
        swagger.definitions[collection] = collectionSchema;
        const collectionPathDef = setCollectionPathDef(collection);
        swagger.paths['/collections/' + collection + '.json'] = collectionPathDef; // eslint-disable-line prefer-template
        swagger.paths['/collections/' + collection + '/{document}.json'] = setCollectionPathDocDef(collection, collectionPathDef); // eslint-disable-line prefer-template
        done();
      });
    }
  }, () => {
    fs.outputJson(path.join(apiDir, 'swagger.json'), swagger, (outerr) => {
      callback(outerr, swagger);
    });
  });
}

function datajsonExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  const schemaName = siteInfo.getConfigItem(site, 'schema');
  const schema = new Schema(schemaName, config);
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const content = prepare(site, config);

  const datajson = {
    '@context': 'https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld',
    '@id': 'http://demo.getdkan.com/data.json',
    '@type': 'dcat:Catalog',
    conformsTo: 'https://project-open-data.cio.gov/v1.1/schema',
    describedBy: 'https://project-open-data.cio.gov/v1.1/schema/catalog.json',
    dataset: [],
  };

  Async.auto({
    load: (done) => {
      content.findByCollection(primaryCollection, true, (colerr, results) => {
        done(colerr, results);
      });
    },
    index: ['load', (results, done) => {
      Async.each(results.load, (item, call) => {
        datajson.dataset.push(item);
        call(null);
      }, (err) => {
        if (err) {
          done(err);
        } else {
          done(null);
        }
      });
    }],
  }, (err) => {
    if (err) {
      callback(err, !err);
    }
    const file = path.join(apiDir, 'data.json');
    fs.outputFile(file, JSON.stringify(datajson), (fileErr) => {
      callback(fileErr, !fileErr);
    });
  });
}

function all(site, config, callback) {
  Async.waterfall([
    (done) => {
      routesExport(site, config, (err) => {
        done(err);
      });
    },
    (done) => {
      docsExport(site, config, (err) => {
        done(err);
      });
    },
    (done) => {
      routesExport(site, config, (err) => {
        done(err);
      });
    },
    (done) => {
      schemaExport(site, config, (err) => {
        done(err);
      });
    },
    (done) => {
      searchExport(site, config, (err) => {
        done(err);
      });
    },
    (done) => {
      swaggerExport(site, config, (err) => {
        done(err);
      });
    },
    (done) => {
      datajsonExport(site, config, (err) => {
        done(err);
      });
    },
  ], (err) => {
    callback(err, !err);
  });
}

module.exports = {
  routesExport,
  docsExport,
  docExport,
  configExport,
  schemaExport,
  searchExport,
  swaggerExport,
  datajsonExport,
  all,
};
