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
			"org.name": ["Planet of Hoth"],
			"license": ["http://opendefinition.org/licenses/odc-odbl/"]
		}
	}
}

harvest._getObjValue(doc, ["tags", "title"], (err, result) => {
  console.log(result);
});

harvest._getObjValue(doc, ["org", "name"], (err, result) => {
  console.log(result);
});

harvest._getObjValue(doc, ["id"], (err, result) => {
  console.log(result);
});

harvest._getObjValue(doc, ["ids"], (err, result) => {
  console.log(result);
});

harvest._getObjValue(doc, ["org", "ids"], (err, result) => {
  console.log(result);
});

harvest._getObjValue(doc, ["org"], (err, result) => {
  console.log(result);
});

harvest._searchObj(doc, "tags.title", ["health"], (err, result) => {
  console.log(result);
});
harvest._searchObj(doc, "tags.title", ["healths"], (err, result) => {
  console.log(result);
});

harvest._filter(testSources, {"hothplanet": [doc]}, (err, result) => {
  console.log(result);
});

harvest._exclude(testSources, {"hothplanet": [doc]}, (err, result) => {
  console.log(result);
});
