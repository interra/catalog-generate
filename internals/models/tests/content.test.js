const Config = require('../config');
const Content = require('../content');
const fs = require('fs-extra');
const config = new Config(__dirname);
const path = require('path');
const storage = 'FileStorage';
const content = new Content[storage]('test-site', config);

test('Get list of docs from tags collection', (done) => {
  content.list('tags', (err, result) => {
    expect(result).toContain('tags/health-care.yml');
    done();
  });
});

test('Get list of docs from organization collection', (done) => {
  content.list('organization', (err, result) => {
    expect(result).toContain('organization/bad-org.yml');
    done();
  });
});

test('Get count of docs from tags collection', (done) => {
  content.count('tags', (err, result) => {
    expect(result).toBe(6);
    done();
  });
});

test('Get count of docs from organization collection', (done) => {
  content.count('organization', (err, result) => {
    expect(result).toBe(2);
    done();
  });
});

test('Get count of docs from tags collection', (done) => {
  content.count('tags', (err, result) => {
    expect(result).toBe(6);
    done();
  });
});

test('Load specific file', (done) => {
  content.load('organization/good-org.yml', (err, result) => {
    expect(result.identifier).toBe('good-org');
    done();
  });
});

test('Retrieve all files of a group of collection', (done) => {
  content.findAll(false, (err, result) => {
    expect(result.organization[1].identifier).toBe('good-org');
    done();
  });
});

test('Retrieve all files of a collection dereferenced', (done) => {
  content.findByCollection('datasets', true, (err, result) => {
    expect(result[0].org.identifier).toBe('good-org');
    expect(result[0].tags[1].title).toBe('Health Care');
    expect(result[0].resources[0].type).toBe('csv');
    expect(1).toBe(1);
    done();
  });
});

test('Retrieve all files of a collection', (done) => {
  content.findByCollection('organization', false, (err, result) => {
    expect(result[1].identifier).toBe('good-org');

    done();
  });
});

test('Deference a document', (done) => {
  const doc = {
    title: 'Dataset One',
    id: 'dataset-one',
    description: 'First test dataset',
    org:
    [{ 'interra-reference': 'good-org' }],
    tags:
    [{ 'interra-reference': 'education' },
       { 'interra-reference': 'health-care' }],
    created: '2017-08-01',
    modified: '2017-08-10',
    resources:
    [{ title: 'CSV of Data',
      uri: 'http://example.com/csv',
      type: 'csv' }] };
  content.Deref(doc, (err, result) => {
    expect(result.org.identifier).toBe('good-org');
    expect(result.tags[1].title).toBe('Health Care');
    done();
  });
});

test('Reject a document with a reference that doesn\'t exist', (done) => {
  const doc = {
    title: 'Dataset One',
    id: 'dataset-one',
    description: 'First test dataset',
    org:
    // There is no organization 'no-org'.
    [{ 'interra-reference': 'no-org' }],
    tags: [
      {
        'interra-reference': 'education',
      },
      {
        'interra-reference': 'health-care',
      }],
    created: '2017-08-01',
    modified: '2017-08-10',
    resources: [{
      title: 'CSV of Data',
      uri: 'http://example.com/csv',
      type: 'csv' }] };
  content.Deref(doc, (err) => {
    if (err) {
      expect(err).toBe('Doc contains reference file organization/no-org.yml from org field that does not exist.');
    }
    done();
  });
});

test('Reference a document', (done) => {
  const unreffed = {
    title: 'Dataset One',
    id: 'dataset-one',
    description: 'First test dataset',
    org: {
      name: 'Good Org',
      description: 'A very organization',
      identifier: 'good-org',
      created: '2017-09-12T00:00:00.000Z',
      refreshed: '2017-09-13T00:00:00.000Z',
      interra: { path: 'organizations/good-org' } },
    tags: [
      {
        title: 'Education',
        identifier: 'education',
        icon: 'education',
        modified: '2017-09-02T00:00:00.000Z',
      },
      {
        title: 'Health Care',
        identifier: 'health-care',
        icon: 'healthcare',
      }],
    created: '2017-08-01',
    modified: '2017-08-10',
    resources:
    [{ title: 'CSV of Data',
      uri: 'http://example.com/csv',
      type: 'csv' }] };
  const reffed = {
    title: 'Dataset One',
    id: 'dataset-one',
    description: 'First test dataset',
    org: { 'interra-reference': 'good-org' },
    tags:
    [{ 'interra-reference': 'education' },
      { 'interra-reference': 'health-care' }],
    created: '2017-08-01',
    modified: '2017-08-10',
    resources:
    [{ title: 'CSV of Data',
      uri: 'http://example.com/csv',
      type: 'csv' }] };
  content.Ref(unreffed, (err, result) => {
    expect(result).toMatchObject(reffed);
    done();
  });
});

test('Map a document', (done) => {
  const org = {
    name: 'Good Org',
    description: 'A very organization',
    identifier: 'good-org',
    created: '2017-09-12T00:00:00.000Z',
    refreshed: '2017-09-13T00:00:00.000Z',
    interra: { path: 'organizations/good-org' },
  };
  content.Map(org, 'organization', (err, result) => {
    expect(result.title).toBe('Good Org');
    done();
  });
});

test('Don\'t map a document without defined map', (done) => {
  const doc = {
    title: 'Dataset One',
    identifier: 'dataset-one',
    description: 'First test dataset',
    created: '2017-08-01',
    modified: '2017-08-10',
  };
  content.Map(doc, 'dataset', (err, result) => {
    expect(result).toMatchObject(doc);
    done();
  });
});

describe('Validates fields required by interra', () => {
  test('modified missing from doc', (done) => {
    const doc = {
      title: 'Dataset One',
      id: 'dataset-one',
      description: 'First test dataset',
      created: '2017-08-01',
    };
    content.validateRequired(doc, 'datasets', (err) => {
      if (err) {
        expect(err).toBe('modified field is required.');
        done();
      }
    });
  });
  test('Title missing from doc', (done) => {
    const doc = {
      id: 'dataset-one',
      description: 'First test dataset',
      created: '2017-08-01',
      modified: '2017-08-10',
    };
    content.validateRequired(doc, 'datasets', (err) => {
      if (err) {
        expect(err).toBe('title field is required.');
        done();
      }
    });
  });
});

test('Find doc by field value', (done) => {
  content.findByFieldValue('icon', 'tags', 'education', (err, result) => {
    expect(result.title).toBe('education');
    done();
  });
});

test('Find all with multiple collections', (done) => {
  content.findAll(false, (err, result) => {
    expect(result.datasets.length).toBe(2);
    expect(result.tags.length).toBe(6);
    expect(result.datasets[1].title).toBe('Dataset Two');
    done();
  });
});

test('Find by route', (done) => {
  content.findByInterraId('city-planning', 'tags', (err, result) => {
    expect(result.title).toBe('City Planning');
    done();
  });
});

test('Get value of map field', () => {
  expect(content.getMapFieldByValue('datasets', 'identifier')).toBe('id');
});

test('Get routes', (done) => {
  content.getRoutes('tags', (err, result) => {
    expect(result[2]).toBe('finance-and-budgeting');
    done();
  });
});

test('Build safe InterraId', () => {
  const routes = [
    'test-route-1',
    'test-route-2',
    'test-route_2',
    'test-route_2-2a',
    'test-route-3',
    'testroute-4',
  ];
  expect(content.buildInterraIdSafe('test-route-1', routes)).toBe('test-route-4');
  expect(content.buildInterraIdSafe('testroute-4', routes)).toBe('testroute-5');
  expect(content.buildInterraIdSafe('test-route_2-2a', routes)).toBe('test-route_2-2a-0');
});

test('Save a doc', (done) => {
  const doc = {
    title: 'Dataset One',
    id: 'dataset-one',
    description: 'First test dataset',
    created: '2017-08-01T21:22:48.2698750Z',
    modified: '2017-08-10T21:22:48.2698750Z',
    errantField: 'shouldn\'t be here',
    interra: {
      id: 'test-dataset',
    },
  };
  content.insertOne('test-dataset', 'datasets', doc, () => {
    const file = path.join(__dirname, 'sites/test-site/collections/datasets/test-dataset.yml');
    expect(fs.existsSync(file)).toBe(true);
    done();
  });
});

test('Delete a doc', (done) => {
  content.deleteOne('test-dataset', 'datasets', (err, result) => {
    expect(result).toBe(true);
    done();
  });
});

test('Build registry', (done) => {
  const reg = { 'dataset-two': 'dataset-two' };
  content.buildRegistry((err, result) => {
    expect(result.datasets[1]).toMatchObject(reg);
    expect(1).toBe(1);
    done();
  });
});

test('Add to registry', () => {
  const reg = {
    a: 'b',
  };
  content.addToRegistry({ a: 'b' }, 'datasets');
  expect(content.registry.datasets[2]).toMatchObject(reg);
  expect(content.registry.datasets.length).toBe(3);
});

test('Remove from registry', () => {
  content.removeFromRegistry('a', 'datasets');
  expect(content.registry.datasets[0]).toMatchObject({ 'http://example.com/view/dataset-one': 'dataset-one' });
  expect(content.registry.datasets[1]).toMatchObject({ 'dataset-two': 'dataset-two' });
  expect(content.registry.datasets.length).toBe(2);
});

test('Check unique with existing', (done) => {
  content.validateUnique('dataset-one', 'datasets', (err, result) => {
    expect(result).toBe('http://example.com/view/dataset-one');
    done();
  });
});

test('Check unique with new', (done) => {
  content.validateUnique('dataset-three', 'datasets', (err, result) => {
    expect(result).toBe(null);
    done();
  });
});

test('Create revision', () => {
  const doc = {
    title: 'Dataset One More',
    identifier: 'dataset-one',
    description: 'First test dataset edidte',
    created: '2017-08-01T21:22:48.2698750Z',
    modified: '2017-09-10T21:22:48.2698750Z',
    errantField: 'shouldn\'t be here',
    interra: {
      id: 'dataset-one',
    },
  };
  expect(content.createRevision('datasets', doc)[0]).toMatchObject(doc);
  const file = fs.readJsonSync(path.join(content.directory, 'datasets/rev/dataset-one.json'));
  expect(file[0]).toMatchObject(doc);
  fs.removeSync(path.join(content.directory, 'datasets/rev/dataset-one.json'));
});

test('Validate doc', (done) => {
  const doc = {
    title: 'Dataset One More',
    id: 'dataset-one',
    description: 'First test dataset edidte',
    created: '2017-08-01T21:22:48.2698750Z',
    modified: '2017-09-10T21:22:48.2698750Z',
    errantField: 'shouldn\'t be here',
    interra: {
      id: 'dataset-one',
    },
  };
  const collection = 'datasets';
  content.validateDoc(doc, collection, (err, result) => {
    expect(result).toBe(true);
    done();
  });
});

test('Reject invalid doc', (done) => {
  const doc = {
    title: 'Dataset One More',
    description: 'First test dataset edidte',
    created: '2017-08-01T21:22:48.2698750Z',
    modified: '2017-09-10T21:22:48.2698750Z',
    errantField: 'shouldn\'t be here',
    interra: {
      id: 'dataset-one',
    },
  };
  const rejection = {
    keyword: 'required',
    dataPath: '',
    schemaPath: '#/required',
    params: { missingProperty: 'id' },
    message: 'should have required property \'id\'',
  };
  const collection = 'datasets';
  content.validateDoc(doc, collection, (err) => {
    expect(err[0]).toMatchObject(rejection);
    done();
  });
});

test('Read Dataset One before update', (done) => {
  content.findByFieldValue('id', 'datasets', 'http://example.com/view/dataset-one', (err, result) => {
    expect(result.title).toBe('Dataset One');
    done();
  });
});

test('Update existing doc', (done) => {
  const update = {
    title: 'New title',
    description: 'new description',
  };
  content.updateOne('dataset-one', 'datasets', update, (err, result) => {
    expect(result.title).toBe('New title');
    expect(result.interra.id).toBe('dataset-one');
    done();
  });
});

test('Revert doc', (done) => {
  content.revertOne('dataset-one', 'datasets', 0, (err, result) => {
    expect(result.title).toBe('Dataset One');
    done();
  });
});

// TODO: Need to decide when to use map.
// TODO: Create functions for Store, Edit, View.

// exportOne().
// exportMany().
// loadWithField()?
// findByIdentifier()
// pagedFind().
// validateCollection (for content)
// validateAll (all content )
