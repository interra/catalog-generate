module.exports = {
    // Save.
    preSave: function(identifier, collection, content, callback) {
        return callback(null, identifier, collection, content);
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
