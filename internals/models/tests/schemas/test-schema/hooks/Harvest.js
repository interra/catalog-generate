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
  // Converts harvested schema to native.
  Store: function(doc, type, callback) {

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
      const created = formatDate(doc.created);
      const modified = formatDate(doc.modified);
      const update = {
        'created': created,
        'modified': modified
      }
      const formattedDoc = Object.assign(doc, update);
      return callback(null, formattedDoc);
    }
    else {
      return callback("Schema not supported for harvesting.");
    }
  }
}
