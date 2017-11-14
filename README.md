[![Build Status](https://travis-ci.org/interra/catalog-generate.svg?branch=master)](https://travis-ci.org/interra/catalog-generate)

# Interra Catalog Generate

A static site generated Open Data catalog using React.

*Open Data should be easier.*

This project generates an Open Data catalog as a static html site. It can be hosted on Github, S3, or any generic server. The schema is declared as JSON-Schema in Yaml files. The metadata and all content are stored in JSON files.

Storing data as static files, or optionally in a NoSQL store like MongoDB, drastically reduces the overhead for managing and publishing data. Catalogs using SQL databases rely on complex abstractions for translating data from open formats to an internal state and then back to open formats. For example, many data workflows involve ingesting JSON files, writing them to rows and tables in a SQL database using and ORM, changing the data, then exporting them back to JSON files. These catalogs also require a web server and scripting language to receive requests and serve JSON.

Interra Catalog takes a different approach. Data is saved in a [document store](https://en.wikipedia.org/wiki/Document-oriented_database), by default a file system. The only change in the way the data is stored verusus consumed are [internal references]() between docs. Updating data between harvesting, storing, and publishing is done with a small set of javascript functions. There is little state to understand and maintain.

Additional catalog features are added as microservices. [Interra Catalog Admin](http://github.com/interra/catalog-admin) offers a user-interface for creating, editing, and updating data. A datastore is coming soon using [CARTO](http://carto.com). Data visualization dashboards can be added with [React Dash](http://github.com/getdkan/react-dash).

The schema is extremely flexible and easy to update.  Adding a new field is as simple as adding lines to a configuration file. Example schema's include [Project Open Data](https://project-open-data.cio.gov/)'s schema however any schema that has the concept of a "primary collection" such as a "dataset". See the test suite for an [example](https://github.com/interra/catalog-generate/tree/master/internals/models/tests/schemas/test-schema). 


## Roadmap 

Roadmap soon to be shared. This project is still in early development.

# Example Site

Currently have an early POC here: [http://healthdata-example.interra.io](http://healthdata-example.interra.io).

## Getting Started

To get started install node modules:

```bash
npm install
```

The default search uses [ElasticLunr](http://elasticlunr.com/). We require the latest ``0.9.6`` version however the current version on npm is [``0.9.5``](https://github.com/weixsong/elasticlunr.js/issues/60). To get the latest version:

```bash
rm -r node_modules/elasticlunr; cd node_modules; git clone git@github.com:weixsong/elasticlunr.js.git elasticlunr;
```

To create a new site start the [plop](https://plopjs.com) generator:

```bash
node_modules/.bin/plop
```

## Documentation

Documentation can be found at [Read the docs](http://catalog-generate.readthedocs.io/en/latest).

## Requirements

Requires node v6+. This is built to run using Linux. Windows support will not be provided.
