module.exports = {
  // Save.
  preSave: function(identifier, collection, content, callback) {
      return callback(null, identifier, collection, content);
  },
  postSave: function(content, callback) {
      return callback(null, content);
  },
  // Load.
  preLoad: function(collection, file, callback) {
    return callback(null, file);
  },
  postLoad: function(collection, data, callback) {
    return callback(null, data);
  },
  // Dereference.
  preDereference: function(collection, data, callback) {
    return callback(null, data);
  },
  postDereference: function(collection, data, callback) {
    // Formats date for output.
    if (collection === "datasets") {
      const date = new Date(data.created);
      data.created = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    }
    return callback(null, data);
  },
  // Map.
  preMap: function(identifier, collection, content, callback) {
    return callback(null, identifier, collection, content);
  },
  postMap: function(data, callback) {
    return callback(null, data);
  }
  // Output.
  preOutput: function(identifier, collection, content, callback) {
    return callback(null, identifier, collection, content);
  },
  postOutput: function(data, callback) {
    return callback(null, data);
  }
  /**
  // Form
  preForm: function(data, callback) {
    return callback(null, data);
  },
  postForm: function(data, callback) {
    return callback(null, data);
  },
  */
}
