
module.exports = {
  // Converts harvested schema to native.
  Store: function(doc, type, callback) {
    return callback(null, doc);
  }
}
