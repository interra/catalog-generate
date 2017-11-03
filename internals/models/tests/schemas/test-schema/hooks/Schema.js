module.exports = {
  // Load.
  preLoad: function(file, callback) {
    return callback(null, file);
  },
  postLoad: function(collection, schema, callback) {
    if (collection === 'tags') {
      schema.properties.created = {
        "type": "string",
        "title": "Created",
        "pattern": "[0-9]{4}-[0-9]{2}-[0-9]{2}"
      }
      schema.required.push("created");
    }
    return callback(null, schema);
  },
  // Dereference.
  preDereference: function(schema, callback) {
    return callback(null, schema);
  },
  postDereference: function(schema, callback) {
    return callback(null, schema);
  },
  // Form
  preForm: function(data, callback) {
    return callback(null, data);
  },
  postForm: function(data, callback) {
    return callback(null, data);
  },
  // Output
  preOutput: function(data, callback) {
    return callback(null, data);
  },
  postOutput: function(data, callback) {
    return callback(null, data);
  }
}
