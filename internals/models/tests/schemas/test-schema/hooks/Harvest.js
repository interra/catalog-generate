module.exports = {
  // Converts harvested schema to native.
  convertToSchema: function(type, doc, callback) {
    if (type === 'DataJSON') {
      const converted = {};
      converted.title = doc.title;
      converted.id = doc.identifier;
      // TODO: cycle through and convert object properties.
      converted.org = doc.organization;
      // TODO: cycle through and convert object properties.
      converted.tags = doc.tags;
      converted.created = doc.created;
      converted.modified = doc.modified;
      // TODO: cycle through and convert object properties.
      converted.resource = doc.distribution;
      return callback(null, converted);
    }
    else if (type === 'Test') {
      return callback(null, doc);
    }
    else {
      return callback("Schema not supported for harvesting.");
    }
  }
}
