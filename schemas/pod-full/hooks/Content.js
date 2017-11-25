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
  preSave: (interraId, collection, doc, callback) => {
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

    callback(null, interraId, collection, doc);
  },
  postSave: (content, callback) => {
    callback(null, content);
  },
  // Load.
  preLoad: (file, callback) => {
    callback(null, file);
  },
  postLoad: (data, callback) => {
    callback(null, data);
  },
  // Dereference.
  preDereference: (data, callback) => {
    callback(null, data);
  },
  postDereference: (data, callback) => {
    callback(null, data);
  },
  // Map.
  preMap: (identifier, collection, content, callback) => {
    callback(null, identifier, collection, content);
  },
  postMap: (data, callback) => {
    callback(null, data);
  },
  // Output.
  preOutput: (identifier, collection, content, callback) => {
    callback(null, identifier, collection, content);
  },
  postOutput: (data, callback) => {
    callback(null, data);
  }
}
