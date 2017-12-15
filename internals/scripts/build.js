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
 * Exports media files.
 */
function mediaExport(site, config, callback) {
  const buildDir = path.join(config.get('buildDir'), site, 'media');
  const siteDir = path.join(config.get('sitesDir'), site, 'media');
  fs.emptyDirSync(buildDir);
  fs.copySync(siteDir, buildDir);
  // Moves logo.png if it exists.
  if (fs.pathExistsSync(path.join(config.get('sitesDir'), site, '/logo.png'))) {
    fs.copySync(path.join(config.get('sitesDir'), site, '/logo.png'), path.join(config.get('buildDir'), site, '/logo.png'));
  }
  // Moves favicon.ico if it exists.
  if (fs.pathExistsSync(path.join(config.get('sitesDir'), site, '/favicon.ico'))) {
    fs.copySync(path.join(config.get('sitesDir'), site, '/favicon.ico'), path.join(config.get('buildDir'), site, '/favicon.ico'));
  }
  callback(null, true);
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
function docsExport(site, config, env, callback) {
  const content = prepare(site, config);
  const siteInfo = new Site(site, config);
  const url = siteInfo.getConfigItem(`${env}Url`);
  const re = new RegExp('\\[interraUrl\\]', 'g');

  content.findAll(true, (err, results) => {
    Async.each(content.collections, (collection, done) => {
      let docs = results[collection];
      // Replaces interraUrl with env url.
      // TODO: move to content model in exportOne.
      docs = JSON.stringify(docs);
      docs = docs.replace(re, url);
      docs = JSON.parse(docs);
      const file = path.join(config.get('buildDir'), site, 'api/v1/collections', `${collection}.json`);
      fs.outputFile(file, JSON.stringify(docs), (fileerr) => {
        content.exportMany(docs, collection, (experr) => {
          done(experr, !experr);
        });
      });
    }, (eacherr) => {
      callback(eacherr, !eacherr);
    });
  });
}

/**
 * Exports json file for single doc.
 */
function docExport(site, config, collection, interraId, env, callback) {
  const content = prepare(site, config);
  const siteInfo = new Site(site, config);
  const url = siteInfo.getConfigItem(`${env}Url`);
  const re = new RegExp('\\[interraUrl\\]', 'g');

  content.findByInterraId(interraId, collection, (err, doc) => {
    if (err) callback(err);
    content.Deref(doc, (derefErr, dereffed) => {
      if (err) callback(derefErr);
      dereffed = JSON.stringify(dereffed);
      dereffed = dereffed.replace(re, url);
      dereffed = JSON.parse(dereffed);
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
  const schemaName = siteInfo.getConfigItem('schema');
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
    pageSchema: {},
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
    schemas.uiSchema = schema.uiSchema();
    schemas.pageSchema = siteInfo.pageSchema();
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

function getCollectionMap(schema, content, siteMapCollections, primaryCollection, callback) {
  schema.dereference(primaryCollection, (e, primaryCollectionSchema) => {
    content.findByCollection(primaryCollection, true, (loadErr, results) => {
      Async.map(results, (doc, done) => {
        content.Map(doc, primaryCollection, (mapErr, mappedDoc) => {
          done(mapErr, mappedDoc);
        }); 
      }, (err, docs) => {
        const cols = siteMapCollections.slice().reverse();
        const siteMapCollectionsBuild = docs.reduce((acc, doc) => {
          const entries = cols.reduce((entryAcc, col) => {
            let entry = {};
            if (col === primaryCollection) {
              entry = {
                loc: `/${col}/${doc.interra.id}`, 
                title: doc.title,
                children: entryAcc,
              };

              return entry;
            } else {
              const field = content.getRefFieldVal(primaryCollection, col);
              if (field in doc) {
                const type = primaryCollectionSchema.properties[field].type;
                if (type === 'object') {
                  return {
                    loc: `/${col}/${doc[field].interra.id}`, 
                    title: doc[field].name,
                    children: [entryAcc],
                  };
                } else {
                  const items = doc[field].map((item) => {
                    return {
                      loc: `/${col}/${item.interra.id}`, 
                      title: item.title,
                    };
                  });
                  return items;
                }
              }
              else {
                exit();
              }
            }
          }, {});
          const highestLevelLoc = entries.loc;
          const i = Object.values(acc).findIndex((i) => { return i.loc === highestLevelLoc});
          if (i !== -1) {
            acc[i].children.push(entries.children[0]);
            return acc; 
          } else {
            acc.push(entries);
            return acc;
          }
        }, []);
        callback(err, siteMapCollectionsBuild);
      });
    });
  });
}

function addCollectionsMaptoSiteMap(obj, arr) {
  return JSON.parse(JSON.stringify(obj)
    .replace(new RegExp('\\[\"collections\"]'), JSON.stringify(arr)))
}

/**
 * Exports search file for site.
 */
function siteMapExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const siteMap = siteInfo.getConfigItem('siteMap');
  const siteMapCollections = siteInfo.getConfigItem('siteMapCollections');
  const schemaName = siteInfo.getConfigItem('schema');
  const schema = new Schema(schemaName, config);
  const content = prepare(site, config);
  const apiDir = path.join(config.get('buildDir'), site, apiSubDir);
  const primaryCollection = schema.getConfigItem('primaryCollection');
  getCollectionMap(schema, content, siteMapCollections, primaryCollection, (err, result) => {
    const mapBuild = addCollectionsMaptoSiteMap(siteMap, result);
    const file = path.join(apiDir, 'sitemap.json');
    fs.outputFile(file, JSON.stringify(mapBuild), (fileErr) => {
      callback(fileErr, !fileErr);
    });
  });
}


/**
 * Exports search file for site.
 */
function searchExport(site, config, callback) {
  const siteInfo = new Site(site, config);
  const schemaName = siteInfo.getConfigItem('schema');
  const schema = new Schema(schemaName, config);
  const searchConfig = siteInfo.getConfigItem('search');
  const searchEngine = searchConfig.type;
  const search = new Search[searchEngine](site, config);
  const content = prepare(site, config);
  const primaryCollection = schema.getConfigItem('primaryCollection');

  search.init((err) => {
    if (err) {
      callback(err);
    } else {
      Async.auto({
        load: (done) => {
          content.findByCollection(primaryCollection, true, (loadErr, results) => {
            done(loadErr, results);
          });
        },
        index: ['load', (results, done) => {
          Async.eachSeries(results.load, (item, fin) => {
            search.insertOne(item, (insErr, out) => {
              fin(insErr, out);
            });
          }, (derr) => {
            done(derr, !derr);
          });
        }],
      }, (ferr) => {
        if (ferr) {
          callback(ferr);
        } else {
          search.push((pusherr) => {
            callback(pusherr, !pusherr);
          });
        }
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
  const schemaName = siteInfo.getConfigItem('schema');
  const schema = new Schema(schemaName, config);
  const primaryCollection = schema.getConfigItem('primaryCollection');
  const collections = schema.getConfigItem('collections');

  const swagger = {
    swagger: '2.0',
    info: {
      description: 'Interra Open Data Catalog APIs. These are all read endpoints since Interra Generate runs without a server. Full CRUD APIs are available with Interra Admin.',
      version: '0.0.1',
      title: `${siteInfo.getConfigItem('name')} Data Catalog API`,
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
  const schemaName = siteInfo.getConfigItem('schema');
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

function all(site, config, env, callback) {
  Async.waterfall([
    (done) => {
      docsExport(site, config, env, (err) => {
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
      mediaExport(site, config, (err) => {
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
  siteMapExport,
  mediaExport,
  datajsonExport,
  all,
};
