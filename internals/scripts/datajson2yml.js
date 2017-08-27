require('es6-promise').polyfill();
require('isomorphic-fetch');
const _ = require('lodash');
const fs = require('fs-extra');
const YAML = require('yamljs');
const slug = require('slug');
const uuidv4 = require('uuid/v4');
const Config = require('../models/config');
const Async = require('async');
const chalk = require('chalk');

const config = new Config();
var sitesDir = config.get('sitesDir');

function createCollectionFileName(identifier) {
    return slug(identifier.toLowerCase());
}

// Adds references to datasets.
function prepareDataset(dataset, references, callback) {
  Async.map(references, function(reference, done) {
    if (reference in dataset) {
      if (reference == 'publisher') {
        dataset[reference] = {'interra-reference' : createCollectionFileName(dataset[reference].name)}
      }
      else {
        _.each(dataset[reference], function (dist, i) {
          if ('title' in dist) {
            dist.identifier = slug(dist.title.toLowerCase()) + '-' + uuidv4();
          }
          else {
            dist.identifier = uuidv4();
          }
          dataset[reference][i] = {'interra-reference': createCollectionFileName(dist.identifier)}
        })
      }
  }
  done(dataset);
}, function(err) {
  callback({dataset: dataset, identifier: dataset.identifier, collection: 'dataset'});

});

}

function dataJsonImport(url, collections, site) {
  fetch(url)
    .then(function(response) {
      if (response.status != 200) {
        throw new Error("Bad response.");
      }
      return response.json();
    })
    .then(function(data) {
      Async.auto({
        prepareCollections: function (done) {
          Async.forEachOf(data.dataset, function (dataset, key, callback) {
            Async.forEachOfSeries(['distribution','publisher','keyword','theme'], function(collection, i, call) {
              if (dataset[collection] === undefined) {
                call();
              }
              else {
                  console.log(collection);

                switch (collection) {
                  case 'distribution':
                    Async.eachSeries(dataset['distribution'], function(dist, callme) {
                      if ('title' in dist) {
                        dist.identifier = slug(dist.title.toLowerCase()) + '-' + uuidv4();
                        }
                        else {
                            dist.identifier = uuidv4();
                        }
                        dist['interra-published'] = true;
                        saveToYmlFile(dist, dist.identifier, collection, site, (re) => {
                            callme();
                        });
                        data.dataset[key][collection][i] = dist;
                    }, function(err) {
                        call();
                    });
                    break;
                  case 'publisher':
                    if ('publisher' in dataset) {
                      var slugged = createCollectionFileName(dataset['publisher'].name);
                      saveToYmlFile(dataset['publisher'], slugged, 'organization', site, (re) => {
                        call();
                      });
                    }
                  break;
                case "theme":
                case "keyword":
                  Async.eachSeries(dataset[collection], function(dist, callme) {
                    var tag = {};
                    tag.title = dist;
                    tag.identifier = slug(tag.title.toLowerCase());
                    saveToYmlFile(tag, slug(tag.title.toLowerCase()), collection, site, (re) => {
                        callme();
                    });
                }, function(err) {
                  if (err) {
                    console.log(err);
                  }
                  call();
                });
                break;
            }
          }
        }, function (err) {
          if (err) {
            console.log(err)
          }
          else {
            return callback();
          }
        });
    }, function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    return done(null, data.dataset);
                }
            });
          },
          // Adds references to datasets.
          prepareDataset:['prepareCollections', function(datasets, done) {
              _.each(datasets.prepareCollections, function (dataset, n) {
                  if ('publisher' in data.dataset[n]) {
                      data.dataset[n]['publisher'] = {'interra-reference' : createCollectionFileName(dataset['publisher'].name)};
                  }
                  if ('distribution' in data.dataset[n]) {
                      _.each(dataset['distribution'], function (dist, i) {
                          data.dataset[n]['distribution'][i] = {'interra-reference': createCollectionFileName(dist.identifier)}
                      });
                  }
              });
              return done(null, data.dataset);
          }],
          saveDataset: ['prepareDataset', function (datasets, done) {
              Async.eachSeries(datasets.prepareDataset, function(dataset, callback) {
                  console.log(chalk.blue("Saving dataset: ") + dataset.title);
                  saveToYmlFile(dataset, createCollectionFileName(dataset.title), 'dataset', site, (err) => {
                        if (err) {
                            throw new Error(err)
                        }
                        else {
                            return callback(null);
                        }
                    });
                }, function(err) {
                    return done(null);
                });

          }]
      }, function(err, results) {
          if (err) {
              return console.log(err);
          }
      });
  });
}

function saveToYmlFile(dist, identifier, collection, site, callback) {
    var yml = YAML.stringify(dist, 2, 2);
    var file = sitesDir + '/' + site + '/collections/' + collection + '/' + identifier + '.yml';
    fs.outputFile(file, yml, err => {
        if (err) {
            throw new Error("Can't write to file " + file + ".");
        }
        return callback(null);
    });
};

function convertCollection(collection, name) {
    var referenced = [];
    _.each(collection, function(dist) {
        if ('title' in dist) {
            dist.identifier = slug(dist.title.toLowerCase()) + '-' + uuidv4();
        }
        else {
            dist.identifier = uuidv4();
        }
        referenced.push(dist.identifier);
    });
    collection[name] = referenced;
    return collection;
}

function readableUiid (name) {
    var identifier = uuid.v1();
    return name + '-' + identifier.substring(name.length+1);
}

module.exports = dataJsonImport;
