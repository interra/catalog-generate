//
const Content = require('../content');
const Schema = require('../schema');


const schemaDir = __dirname + '/schemas/test-schema';
const siteDir = __dirname + '/sites/test-site';

const content = new Content['FileStorage'](siteDir, schemaDir);


test("Get list of docs from tags collection", done => {
  content.list('tags', (err, result) => {
    expect(result).toContain("tags/health-care.yml");
    done();
  });
});

test("Get list of docs from organization collection", done => {
  content.list('organization', (err, result) => {
    expect(result).toContain("organization/bad-org.yml");
    done();
  });
});

test("Get count of docs from tags collection", done => {
  content.count('tags', (err, result) => {
    expect(result).toBe(6);
    done();
  });
});

test("Get count of docs from organization collection", done => {
  content.count('organization', (err, result) => {
    expect(result).toBe(2);
    done();
  });
});

test("Get count of docs from tags collection", done => {
  content.count('tags', (err, result) => {
    expect(result).toBe(6);
    done();
  });
});

test("Load specific file", done => {
  content.load('organization/good-org.yml', (err, result) => {
    expect(result.identifier).toBe("good-org");
    done();
  });
});

test("Retrieve all files of a group of collection", done => {
  content.findAll(['organization', 'tags'], false, (err, result) => {
    expect(result.organization[1].identifier).toBe("good-org");
    done();
  });
});

test("Retrieve all files of a collection", done => {
  content.findByCollection('organization', false, (err, result) => {
    expect(result[1].identifier).toBe("good-org");
    done();
  });
});

test("Retrieve all files of a collection dereferenced", done => {
  content.findByCollection('datasets', true, (err, result) => {
    expect(result[0].org.identifier).toBe("good-org");
    expect(result[0].tags[1].title).toBe("Health Care");
    expect(result[0].resources[0].type).toBe("csv");
    expect(result[0].resources[0].type).toBe("csv");
    done();
  });
});
