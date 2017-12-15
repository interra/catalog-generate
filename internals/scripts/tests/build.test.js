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
const indexMockSS = require('./mocksearchindexSS.json'); // eslint-disable-line
const indexMockEL = require('./mocksearchindexEL.json');
const swaggerMock = require('./mockswagger.json');
const datajsonMock = require('./mockdatajson.json');

// Let's start from scratch.
fs.emptyDirSync(path.join(buildDir, 'api/v1/collections'));

test('Build routes', (done) => {
  Build.routesExport(site, config, () => {
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/routes.json'));
    expect(JSON.parse(result)).toMatchObject(routesMock);
    done();
  });
});

test('Build docs', (done) => {
  Build.docsExport(site, config, 'dev', () => {
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    const tag = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/tags/transportation.json'));
    expect(JSON.parse(dataset)).toMatchObject(datasetMock);
    expect(JSON.parse(tag)).toMatchObject(tagMock);
    done();
  });
});

test('Build schema', (done) => {
  Build.schemaExport(site, config, () => {
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/schema.json'));
    expect(JSON.parse(result)).toMatchObject(schemaMock);
    done();
  });
});

// TODO: Test simpleSearch. Need to refactor build to pass fully-build site to override site setting.
test('Build search elasticLunr', (done) => {
  Build.searchExport(site, config, () => {
    const index = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/search-index.json'));
    expect(JSON.parse(index)).toMatchObject(indexMockEL);
    done();
  });
});

test('Build swagger', (done) => {
  Build.swaggerExport(site, config, () => {
    const swagger = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/swagger.json'));
    expect(JSON.parse(swagger)).toMatchObject(swaggerMock);
    done();
  });
});

test('Build datajson', (done) => {
  Build.datajsonExport(site, config, () => {
    const datajson = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/data.json'));
    expect(JSON.parse(datajson)).toMatchObject(datajsonMock);
    done();
  });
});

test('Build all', (done) => {
  Build.all(site, config, 'dev', () => {
    const datajson = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/data.json'));
    expect(JSON.parse(datajson)).toMatchObject(datajsonMock);
    const swagger = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/swagger.json'));
    expect(JSON.parse(swagger)).toMatchObject(swaggerMock);
    const index = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/search-index.json'));
    expect(JSON.parse(index)).toMatchObject(indexMockEL);
    const result = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/schema.json'));
    expect(JSON.parse(result)).toMatchObject(schemaMock);
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    const tag = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/tags/transportation.json'));
    expect(JSON.parse(dataset)).toMatchObject(datasetMock);
    expect(JSON.parse(tag)).toMatchObject(tagMock);
    done();
  });
});

test('Build doc', (done) => {
  fs.emptyDirSync(path.join(buildDir, site, 'api/v1/collections'));
  Build.docExport(site, config, 'datasets', 'dataset-one', 'dev', () => {
    const dataset = fs.readFileSync(path.join(config.get('buildDir'), site, 'api/v1/collections/datasets/dataset-one.json'));
    expect(JSON.parse(dataset)).toMatchObject(datasetMock);
    done();
  });
});


