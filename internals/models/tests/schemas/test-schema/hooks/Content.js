const merge = require('lodash.merge');
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getUTCMonth() + 1); // eslint-disable-line
  let day = '' + d.getUTCDate(); // eslint-disable-line
  const year = d.getUTCFullYear();

  if (month.length < 2) month = '0' + month; // eslint-disable-line
  if (day.length < 2) day = '0' + day; // eslint-disable-line
  const newDate = [year, month, day].join('-');
  return newDate;
}
module.exports = {
  preSave: (interraId, collection, doc, callback) => {
    const newDoc = merge({}, doc);
    // Properly format dates. This is to simulate getting differently
    // formatted data from remote sources.
    if ('created' in doc) {
      newDoc.created = formatDate(doc.created);
    }
    if ('refreshed' in doc) {
      newDoc.refreshed = formatDate(doc.refreshed);
    }
    if ('modified' in doc) {
      newDoc.modified = formatDate(doc.modified);
    }
    callback(null, interraId, collection, newDoc);
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
  // Reference.
  preReference: (data, callback) => {
    callback(null, data);
  },
  postReference: (data, callback) => {
    callback(null, data);
  },
  // Output.
  preOutput: (identifier, collection, content, callback) => {
    callback(null, identifier, collection, content);
  },
  postOutput: (data, callback) => {
    callback(null, data);
  },
};
