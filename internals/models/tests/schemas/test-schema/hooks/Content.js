function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
module.exports = {
    preSave: function(interraId, collection, doc, callback) {
      // Properly format dates. This is to simulate getting differently
      // formatted data from remote sources.
      if ("created" in doc) {
        doc.created = formatDate(doc.created);
      }
      if ("refreshed" in doc) {
        doc.refreshed = formatDate(doc.refreshed);
      }
      if ("modified" in doc) {
        doc.modified = formatDate(doc.modified);
      }
      return callback(null, interraId, collection, doc);
    },
    postSave: function(content, callback) {
        return callback(null, content);
    },
    // Load.
    preLoad: function(file, callback) {
        return callback(null, file);
    },
    postLoad: function(data, callback) {
        return callback(null, data);
    },
    // Dereference.
    preDereference: function(data, callback) {
        return callback(null, data);
    },
    postDereference: function(data, callback) {
        return callback(null, data);
    },
    // Reference.
    preReference: function(data, callback) {
        return callback(null, data);
    },
    postReference: function(data, callback) {
        return callback(null, data);
    },
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
