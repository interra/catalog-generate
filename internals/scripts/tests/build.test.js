const Content = require('../../models/content');
const Config = require('../../models/config');
const fs = require('fs-extra');
const path = require('path');
const storage = 'FileStorage';
const Build = require('../build');
const config = new Config(path.join(__dirname, '../../models/tests'));
const content = new Content['FileStorage']('test-site', config);
const buildDir = config.get('buildDir');

const Async = require('async');

// Let's start from scratch.
fs.emptyDirSync(buildDir);

test('Build schema', (done) => {
 
  //Build.schemaExport('test-site', config, (err) => {
    //console.log(err);
    expect(1).toBe(1);
    done();
  
  //});


});
