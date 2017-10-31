//
const Content = require('../content');
const Schema = require('../schema');
const Harvest = require('../harvest').Harvest;
const fs = require('fs-extra');
const schemaDir = __dirname + '/schemas/test-schema';
const siteDir = __dirname + '/sites/test-site';
const content = new Content['FileStorage'](siteDir, schemaDir);
const Async = require('async');

const YAML = require('yamljs');

const sources = fs.readJsonSync(  __dirname + '/sites/test-site/harvest/sources.json');
const harvest = new Harvest(content, sources);

const doc = {
  "tags": [
    {
      "icon": "education",
      "modified": "Sat Jan 06 1979 15:46:03 GMT+0000 (UTC)",
      "identifier": "d6fec7ca-38ab-4331-b6c9-e15ca4534c6e",
      "title": "health"
    },
    {
      "icon": "education",
      "modified": "Thu Feb 20 1997 13:37:52 GMT+0000 (UTC)",
      "identifier": "0feb40ec-9d0c-476d-bf8a-411389ab8837",
      "title": "ut"
    },
    {
      "icon": "city-planning",
      "modified": "Sat Jun 02 1984 17:47:01 GMT+0000 (UTC)",
      "identifier": "d8ab825e-242b-4584-a311-58d2326a37bc",
      "title": "fugiat"
    }
  ],
  "org": {
    "refreshed": "Fri Apr 24 1987 06:42:29 GMT+0000 (UTC)",
    "created": "Sat Aug 19 2000 23:39:47 GMT+0000 (UTC)",
    "description": "Ad anim ex elit sunt eiusmod aliqua ea consequat. Aliqua deserunt ad Lorem reprehenderit tempor cupidatat quis. Incididunt deserunt eu consectetur labore. Fugiat excepteur nostrud eiusmod pariatur dolor ad laboris enim. Dolor nulla cillum duis in labore occaecat deserunt adipisicing consequat incididunt consectetur fugiat. Et et sunt culpa consectetur. Incididunt nostrud excepteur veniam proident.",
    "identifier": "f280a8c5-7d5e-4704-94d4-f37039fb72f7",
    "name": "fugiat"
  },
  "id": "516f7ea3-f6c4-4df8-bc03-14fc28df21e2",
  "description": "Occaecat irure esse qui nisi ipsum sunt reprehenderit magna amet aliquip dolor. Minim est aliquip anim eu quis aliqua tempor. Irure do sit aliquip sit nulla ut aliquip cupidatat quis. Voluptate dolore ex velit esse non consequat velit mollit adipisicing deserunt. Ipsum eu ipsum fugiat pariatur nisi qui. Officia minim Lorem consectetur duis culpa. Sit irure culpa pariatur ad laboris ut.",
  "title": "Quilk"
}

//console.log(doc);
const testSources = {
  "hothplanet": {
		"id": "hothplanet",
		"source": "file://harvest/test-harvest-source-hoth.json",
		"type": "Test",
		"filters": {
			"tags.title": ["snow", "cold", "space", "health"]
		},
		"excludes": {
			"id": "516f7ea3-f6c4-4df8-bc03-14fc28df21e2"
		},
		"defaults": {
		"org": {
      "name": "Planet of Hoth Federation",
      "identifier": "planet-hoth-group",
      "description": "Imperial Planet coordination group.",
      "created": "Fri Apr 10 1970 11:53:04 GMT+0000 (UTC)",
      "refreshed": "Wed Oct 15 1975 14:53:30 GMT+0000 (UTC)"
    },
    "license": ["http://opendefinition.org/licenses/odc-odbl/"]
		}
	}
}
/*
harvest.load((err, results) => {
  harvest._flattenResults(results, (err, docs) => {
    console.log(docs);
    console.log(docs.length);

  });
});
*/
content.buildFullRegistry((err, result) => {
  console.log(result);
});

harvest.load((err, docsGroup) => {
  const references = content.references;
    harvest._flattenResults(docsGroup, (err, docs) => {
      const primaryCollection = content.schema.getConfigItem('primaryCollection');
      content.buildFullRegistry((err, registryFull) => {
        Async.each(docs, (doc, done) => {
          const identifierField = content.getIdentifierField(primaryCollection);
          if (!(identifierField) in doc) {
            throw new Error("Doc missing identifier field " + doc);
          }
          content.refCollections(doc, primaryCollection, (err, fields) => {
            Async.eachOf(fields, (values, field, fin) => {
              if (!values) {
                fin();
              }
              else {
                const collection = references[primaryCollection][field];
                const identifier = content.getIdentifierField(collection);
                const type = harvest._toType(values);
                console.log(collection, registryFull);
                content.getRegistryCollection(registryFull, collection, (err, registry) => {
                  const title = content.getMapFieldByValue(collection, 'title');
                  if (type === 'array') {
                    doc[field] = [];
                    console.log('zzzzzzzzzzzzzzzz', doc[field]);
                    Async.eachSeries(values, (value, valdone) => {
                      if (!(identifier) in value) {
                        throw new Error("Ref missing identifier field " + value);
                      }
                      if (value[identifier] in registry) {
                        content.UpdateOne(registry[value[identifier]], collection, value, (err, res) => {
                          doc[field].push({'interra-reference': interraId});
                          valdone();
                        });
                      }
                      else {
                        const interraId = content.buildInterraIdSafe(content.buildInterraId(value.title), Object.values(registry));
                        content.insertOne(interraId, collection, value, (err, res) => {
                          doc[field].push({'interra-reference': interraId});
                          content.addToRegistry({[interraId]: value[identifier]}, collection);
                          valdone();
                        });
                      }
                    }, function(err) {
                      fin();
                    });
                  }
                  else if (type === 'object') {
                    doc[field] = {};
                    console.log("we shouldhave a registry", registry);
                    if (false) {
                      content.UpdateOne(registry[values[identifier]], collection, values, (err, res) => {
                        doc[field]['interra-reference'] = registry[values[identifier]];
                        fin();
                      });
                    }
                    else {
                      console.log(collection, registry);
                      const interraId = content.buildInterraIdSafe(content.buildInterraId(values[title]), Object.values(registry));
                      content.insertOne(interraId, collection, values, (err, res) => {
                        doc[field]['interra-reference'] = interraId;
                        // TODO: fix.
                        content.addToRegistry({[interraId]: values[identifier]}, collection);
                        fin();
                      });
                    }
                  }
                  else {
                    fin();
                  }
                });

            }
          }, function(err) {
            content.getRegistryCollection(registryFull, primaryCollection, (err, registry) => {
              if (doc[identifierField] in registry) {
                content.UpdateOne(doc[identifierField], collection, value, (err, res) => {
                  done();
                });
              }
              else {
                const title = content.getMapFieldByValue(primaryCollection, 'title');
                const interraId = content.buildInterraIdSafe(content.buildInterraId(doc.title), Object.values(registry));
                content.insertOne(interraId, primaryCollection, doc, (err, res) => {
                  content.addToRegistry({[interraId]: doc[identifierField]}, primaryCollection);
                  done();
                });
              }
            });
          });
          });
        });
      });
    });
});

//content.refCollections(doc, "datasets", (err, result) => {
  //console.log('should be different', result);
//});
