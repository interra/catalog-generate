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
const site = 'test-site';

const schemaMock = require('./mockschema.json');
const routesMock = require('./mockroutes.json');
const datasetMock = require('./mockdatasetone.json');
const tagMock = require('./mocktagtransportation.json');
const indexMock = require('./mocksearchindex.json');
const swaggerMock = require('./mockswagger.json');
const datajsonMock = require('./mockdatajson.json');

// Let's start from scratch.
fs.emptyDirSync(buildDir);

test('Build routes', (done) => {
  Build.routesExport(site, config, (err) => {
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/routes.json'));
    expect(routesMock).toMatchObject(JSON.parse(result));
    done();
  });
});

test('Build docs', (done) => {
  Build.docsExport(site, config, (err) => {
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    const tag = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/tags/transportation.json'));
    expect(datasetMock).toMatchObject(JSON.parse(dataset));
    expect(tagMock).toMatchObject(JSON.parse(tag));
    done();
  });
});

test('Build doc', (done) => {
  fs.emptyDirSync(buildDir);
  Build.docExport(site, config, 'datasets', 'dataset-one', (err) => {
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    expect(datasetMock).toMatchObject(JSON.parse(dataset));
    done();
  });
});

test('Build schema', (done) => {
  Build.schemaExport(site, config, (err) => {
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/schema.json'));
    expect(schemaMock).toMatchObject(JSON.parse(result));
    done();
  });
});


test('Build search', (done) => {
  Build.searchExport(site, config, (err) => {
    const index = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/search-index.json'));
    expect(indexMock).toMatchObject(JSON.parse(index));
    done();
  });
});

test('Build swagger', (done) => {
  Build.swaggerExport(site, config, (err) => {
    const swagger = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/swagger.json'));
    expect(swaggerMock).toMatchObject(JSON.parse(swagger));
    done();
  });
});

test('Build datajson', (done) => {
  Build.datajsonExport(site, config, (err) => {
    const datajson = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/data.json'));
    expect(datajsonMock).toMatchObject(JSON.parse(datajson));
    done();
  });
});

test('Build all', (done) => {
  fs.emptyDirSync(buildDir);
  Build.all(site, config, (err) => {
    const datajson = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/data.json'));
    expect(datajsonMock).toMatchObject(JSON.parse(datajson));
    const swagger = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/swagger.json'));
    expect(swaggerMock).toMatchObject(JSON.parse(swagger));
    const index = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/search-index.json'));
    expect(indexMock).toMatchObject(JSON.parse(index));
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/schema.json'));
    expect(schemaMock).toMatchObject(JSON.parse(result));
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    const tag = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/tags/transportation.json'));
    expect(datasetMock).toMatchObject(JSON.parse(dataset));
    expect(tagMock).toMatchObject(JSON.parse(tag));
    done();
  });
});
