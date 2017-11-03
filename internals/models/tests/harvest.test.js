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


const testDoc = {
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

const testDocNoOrg = {
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
  "id": "516f7ea3-f6c4-4df8-bc03-14fc28df21e2",
  "description": "Sit irure culpa pariatur ad laboris ut.",
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
  		"org": {
        "name": "Planet of Hoth Federation",
        "identifier": "planet-hoth-group",
        "description": "Imperial Planet coordination group.",
        "created": "Fri Apr 10 1970 11:53:04 GMT+0000 (UTC)",
        "refreshed": "Wed Oct 15 1975 14:53:30 GMT+0000 (UTC)"
      },
	    "license": ["http://opendefinition.org/licenses/odc-odbl/"],
      "description": "Hold my beer"
		},
    "overrides": {
      "title": "A different title"
    }
	}
}

test("Tests harvest load", done => {
  harvest.load((err, docs) => {
      Async.eachOf(docs, (result, id, fin) => {
        if (id === 'hothplanet') {
          expect(result.length).toBe(6);
          expect(result[0].title).toBe('Quadeebo');
          expect(result[1].title).toBe('Cormoran');
        }
        else if (id === 'cityofmoseisleygov') {
          expect(result.length).toBe(7);
          expect(result[0].title).toBe('Elemantra');
        }
        else if (id === 'moonendor') {
          expect(result.length).toBe(7);
          expect(result[1].title).toBe('Quadeebo');
        }
        fin(null);

      }, function(err) {
      done();

    });
  });
});

test("_getObjValue returns array of objs val", done => {
  harvest._getObjValue(testDoc, ["tags", "title"], (err, result) => {
    expect(result).toEqual(expect.arrayContaining(["health", "ut", "fugiat"]));
    done();
  });
});
test("_getObjValue returns objs val", done => {
  harvest._getObjValue(testDoc, ["org", "name"], (err, result) => {
    expect(result).toBe("fugiat");
    done();
  });
});
test("_getObjValue returns string val", done => {
  harvest._getObjValue(testDoc, ["id"], (err, result) => {
    expect(result).toBe("516f7ea3-f6c4-4df8-bc03-14fc28df21e2");
    done();
  });
});
test("_getObjValue returns null for missing val", done => {
  harvest._getObjValue(testDoc, ["ids"], (err, result) => {
    expect(result).toBe(null);
    done();
  });
});

test("Tests harvest prepare", done => {
  harvest.load((err, json) => {
    harvest.prepare(json, (err, prepped) => {
      Async.eachOf(prepped, (result, id, fin) => {
        if (id === 'hothplanet') {
          expect(result[0].title).toBe('Quadeebo');
          expect(result[1].title).toBe('Cormoran');
          // In our source the doc "Quilk" and "Intrawear" are excluded.
          expect(result.length).toBe(2);
        }
        else if (id === 'cityofmoseisleygov') {
          expect(result[0].title).toBe('Elemantra');
        }
        else if (id === 'moonendor') {
          expect(result[0].title).toBe('Quadeebo');
          expect(result[1].title).toBe('Infotrips');
          expect(result.length).toBe(2);
        }
        fin();

      }, function(err) {
        expect(1).toBe(1);
        done();
      });
    });
  });
});


test("Tests _filter", done => {
  harvest._filter(testSources, {"hothplanet": [testDoc]}, (err, result) => {
    expect(result.hothplanet[0].title).toBe("Quilk");
    done();
  })
});

test("Tests _exclude", done => {
  harvest._exclude(testSources, {"hothplanet": [testDoc]}, (err, result) => {
    expect(result.hothplanet.length).toBe(0);
    done();
  });
});

test("Tests _defaults", done => {
  harvest._defaults(testSources, {"hothplanet": [testDocNoOrg]}, (err, result) => {
    expect(result.hothplanet[0].org.name).toBe("Planet of Hoth Federation");
    // Should not change the description since one exists.
    expect(result.hothplanet[0].description).toBe("Sit irure culpa pariatur ad laboris ut.");
    done();
  });
});

test("Tests _overrides", done => {
  harvest._overrides(testSources, {"hothplanet": [testDoc]}, (err, result) => {
    expect(result.hothplanet[0].title).toBe("A different title");
    done();
  });
});

test("Harvest run", done => {
  harvest.run((err, result) => {
    // TODO: Read file system to verify output.
    expect(1).toBe(1);
    done();
  });
});
