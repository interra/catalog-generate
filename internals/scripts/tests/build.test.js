const Config = require('../../models/config');
const fs = require('fs-extra');
const path = require('path');
const Build = require('../build');
const config = new Config(path.join(__dirname, '../../models/tests'));
const buildDir = config.get('buildDir');
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
  Build.routesExport(site, config, () => {
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/routes.json'));
    expect(routesMock).toMatchObject(JSON.parse(result));
    done();
  });
});

test('Build docs', (done) => {
  Build.docsExport(site, config, () => {
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    const tag = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/tags/transportation.json'));
    expect(datasetMock).toMatchObject(JSON.parse(dataset));
    expect(tagMock).toMatchObject(JSON.parse(tag));
    done();
  });
});

test('Build doc', (done) => {
  fs.emptyDirSync(buildDir);
  Build.docExport(site, config, 'datasets', 'dataset-one', () => {
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    expect(datasetMock).toMatchObject(JSON.parse(dataset));
    done();
  });
});

test('Build schema', (done) => {
  Build.schemaExport(site, config, () => {
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/schema.json'));
    expect(schemaMock).toMatchObject(JSON.parse(result));
    done();
  });
});


test('Build search', (done) => {
  Build.searchExport(site, config, () => {
    const index = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/search-index.json'));
    expect(indexMock).toMatchObject(JSON.parse(index));
    done();
  });
});

test('Build swagger', (done) => {
  Build.swaggerExport(site, config, () => {
    const swagger = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/swagger.json'));
    expect(swaggerMock).toMatchObject(JSON.parse(swagger));
    done();
  });
});

test('Build datajson', (done) => {
  Build.datajsonExport(site, config, () => {
    const datajson = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/data.json'));
    expect(datajsonMock).toMatchObject(JSON.parse(datajson));
    done();
  });
});

test('Build all', (done) => {
  fs.emptyDirSync(buildDir);
  Build.all(site, config, () => {
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
