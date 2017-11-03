const uuid = require('uuidv4');
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
  // Save.
  preSave: function(interraId, collection, doc, callback) {
    const now = formatDate(Date.now());
    // TODO: move this logic to harvest.
    if (collection === 'distribution' || collection === 'organization') {
      if (!("identifier" in doc)) {
        doc.identifier = uuid();
      }
      if (!("created" in doc)) {
        doc.created = now;
      }
      if (!("modified" in doc)) {
        doc.modified = now;
      }
      if ("subOrganizationOf" in doc) {
        if (typeof doc["subOrganizationOf"] !== 'string') {
          delete doc["subOrganizationOf"];
        }
      }
    }
    else if (collection === 'dataset') {
      if (!("issued" in doc)) {
        doc.issued = now;
      }
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
