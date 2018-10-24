const uuid = require('uuidv4');
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1); // eslint-disable-line
  let day = '' + d.getDate(); // eslint-disable-line
  const year = d.getFullYear();

  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;

  return [year, month, day].join('-');
}

module.exports = {
  // Save.
  // TODO: Don't mutate.
  preSave: (interraId, collection, doc, callback) => {
    const now = formatDate(Date.now());
    // TODO: move this logic to harvest.
    if (collection === 'distribution' || collection === 'organization') {
      if (!('identifier' in doc)) {
        doc.identifier = uuid(); // eslint-disable-line
      }
      if (!('created' in doc)) {
        doc.created = now; // eslint-disable-line
      }
      if (!('modified' in doc)) {
        doc.modified = now; // eslint-disable-line
      }
      if ('subOrganizationOf' in doc) {
        if (typeof doc.subOrganizationOf !== 'string') {
          delete doc.subOrganizationOf; // eslint-disable-line
        }
      }
    } else if (collection === 'dataset') {
      if (!('issued' in doc)) {
        doc.issued = now; // eslint-disable-line
      }
    }
    if (collection === 'distribution') {
      if ('mediaType' in doc && !('format' in doc)) {
        doc.format = doc.mediaType.substring(doc.mediaType.indexOf('/') + 1, doc.mediaType.length);
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
  preOutput: (identifier, collection, doc, callback) => {
    callback(null, identifier, collection, doc);
  },
  postOutput: (data, callback) => {
    callback(null, data);
  },
};
