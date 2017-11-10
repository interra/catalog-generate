const merge = require('lodash.merge');
function formatDate(date) {
    const d = new Date(date)
    let month = '' + (d.getUTCMonth() + 1);
    let day = '' + d.getUTCDate();
    let year = d.getUTCFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    const newDate = [year, month, day].join('-');
    return newDate;
}
module.exports = {
    preSave: function(interraId, collection, doc, callback) {
      const newDoc = merge({}, doc);
      // Properly format dates. This is to simulate getting differently
      // formatted data from remote sources.
      if ("created" in doc) {
        newDoc.created = formatDate(doc.created);
      }
      if ("refreshed" in doc) {
        newDoc.refreshed = formatDate(doc.refreshed);
      }
      if ("modified" in doc) {
        newDoc.modified = formatDate(doc.modified);
      }
      return callback(null, interraId, collection, newDoc);
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
