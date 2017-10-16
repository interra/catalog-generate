//
const Schema = require('../schema');

const schema = new Schema(__dirname + '/schemas/test-schema');

test("instantiates schema", () => {
  expect(schema.dir).toContain("schema");
  expect(schema.configFile).toContain("config.yml");
})

test("loads UISchema file", () => {
  const UISchema = schema.uiSchema();
  expect(UISchema.datasets.description["ui:widget"]).toBe("textarea");
});

test("loads map file", () => {
  const map = schema.mapSettings();
  expect(map.datasets.id).toBe("identifier");
});

test("loads collection schema", done => {
  schema.load("datasets", (err, datasetSchema) => {
    expect(datasetSchema.description).toBe("A simple dataset.");
    expect(datasetSchema.properties.tags.items["$ref"]).toBe("tag.yml");
    done();
  });
});

test("loads collection schema with a load hook", done => {
  // Hook.preLoad looks for "tag" collection.
  schema.load("tag", (err, tagSchema) => {
    expect(tagSchema.properties.created.title).toBe("Created");
    done();
  });
});

test("Validates correct schema", () => {
  const goodSchema = {
    "properties": {
      "foo": { "type": "string" },
      "bar": { "type": "number", "maximum": 3 }
    }
  };
  const valid = schema.validateCollectionSchema(goodSchema);
  expect(valid).toBeTruthy();
});

test("Rejects invalid schema", () => {
  const badSchema = {
    "properties": {
      "foo": { "type": "strin" },
      "bar": { "type": "number", "maximum": 3 }
    }
  };
  expect(() => {
    schema.validateCollectionSchema(badSchema);
  }).toThrowError("Schema is not valid.");
});

test("Validates collection item", () => {
  const goodSchema = {
    "properties": {
      "foo": { "type": "string" },
      "bar": { "type": "number", "maximum": 3 }
    }
  };
  const item = {
    "foo": "yes",
    "bar": 2
  }
  const valid = schema.validateCollectionItem(goodSchema, item);
  expect(valid).toBe(true);
});

test("Rejects invalid collection item", () => {
  const goodSchema = {
    "properties": {
      "foo": { "type": "string" },
      "bar": { "type": "number", "maximum": 3 }
    }
  };
  const item = {
    "foo": "yes",
    "bar": "no"
  }
  const rejection = [{
    keyword: 'type',
    dataPath: '.bar',
    schemaPath: '#/properties/bar/type',
    params: { type: 'number' },
    message: 'should be number'
  }]
  const valid = schema.validateCollectionItem(goodSchema, item);
  expect(valid).toMatchObject(rejection);
});

test("Dereferences schema", done => {

  schema.dereference("datasets", (err, dereferenced) => {
    expect(dereferenced.properties.organization.properties.identifier.description).toBe("Unique identifier for organization.");
    expect(dereferenced.properties.tags.items.properties.icon.title).toBe("icon");

    done();
  });
});

test("Get config", () => {
  const config = schema.getConfig();
  expect(config.api).toBe(1);
});

test("Get config item", () => {
  const api = schema.getConfigItem('api');
  expect(api).toBe(1);
});

test("Get list", done => {
  schema.list((err,list) => {
    expect(list[0]).toBe("test-schema");
    done();
  })
});

// -> dereference
// -> each Hook
// -> validateFullSchema
// -> story of how the the schema works (done!)
