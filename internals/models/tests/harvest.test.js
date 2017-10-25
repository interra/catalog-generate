//
const Content = require('../content');
const Schema = require('../schema');
const Harvest = require('../harvest');
const fs = require('fs-extra');
const schemaDir = __dirname + '/schemas/test-schema';
const siteDir = __dirname + '/sites/test-site';
const content = new Content['FileStorage'](siteDir, schemaDir);
const YAML = require('yamljs');

const sources = fs.readJsonSync(  __dirname + '/sites/test-site/harvest/sources.json');
const harvest = new Harvest['DataJSON'](content, sources);

test("what", () => {
  expect(1).toBe(1);
});

test("Create cache", done => {
  harvest.createCache((err,result) => {
    expect(1).toBe(1);
    done();

  });
});
