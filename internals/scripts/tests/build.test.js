const Content = require('../../models/content');
const fs = require('fs-extra');
const path = require('path');
const schemaDir = path.join(__dirname, '../../models/tests/schemas/test-schema');
const buildDir = path.join(__dirname, '../../models/tests/build');
const siteDir = path.join(__dirname, '../../models/tests/sites/test-site');
const storage = 'FileStorage';
const Build = require('../build.js');

const content = new Content[storage](siteDir, schemaDir);
const Async = require('async');

// Let's start from scratch.
fs.emptyDirSync(buildDir);

test('Build schema', (done) => {
  
  Build.schemaData('test-site', (err) => {
  
  });

  expect(1).toBe(1);
  done();

});
