const uuid = require('uuidv4');

module.exports = {
  // Converts harvested schema to native.
  Store: function(doc, type, callback) {
    if (type === 'DataJSON') {
      if (!('identifier') in doc) {
        doc.identifier = uuidv4();
      }
    }
    return callback(null, doc);
  }
}
