[![Build Status](https://travis-ci.org/interra/catalog-generate.svg?branch=master)](https://travis-ci.org/interra/catalog-generate)

# Interra Catalog Generate

*Open Data should be easier.*

This project generates an Open Data catalog as a static html site. It can be hosted on Github, S3, or any generic server. The schema is declared using [JSON Schema](http://json-schema.org/) in Yaml files. The metadata and all content are stored in JSON files.

### Features

 * CKAN / DKAN style data catalog
 * Full-text search using [Elasticlunr](http://elasticlunr.com)
 * Easy to update and override schema
 * Simple data workflows
 * Harvesting from outside catalogs and data sources
 * Easy-to-update or override React front end
 * Full administrative interfeace using [Interra Catalog Admin](http://github.com/interra/catalog-admin)
 * Low-cost hosting using S3, github pages, or other static file server
 * Additional features as microservices

### Reduced Overhead

Traditional catalogs use a SQL database (MySQL, PostgreSQL), webserver (Nginx, Apache), and search engine (SOLR, ElasticSearch) to provide a simple catalog. Many catalogs consist of metadata for less than 1,000 datasets with some additional features such as a datastore or visualization library. Interra drastically reduces the overhead for publishing data, especially for catalogs with under 1,000 records, because a database, webserver (if published to S3), and search engine are not necessary. Interra uses [Elasticlunr](http://elasticlunr.com) as a search index which offers some features search engines such as boosts and query tokens without the overhead of that service. 

### Storage

Storing data as static files, or optionally in a NoSQL store like MongoDB, drastically reduces the overhead for managing and publishing data. Catalogs using SQL databases rely on complex abstractions for translating data from open formats to an internal state and then back to open formats. For example, many data workflows involve ingesting JSON files, writing them to rows and tables in a SQL database using an ORM, changing the data, then exporting them back to JSON files. These catalogs also require a web server and scripting language to receive requests and serve JSON.

Interra Catalog takes a different approach. Data is saved in a [document store](https://en.wikipedia.org/wiki/Document-oriented_database) which is by default a file system. The only change in the way the data is stored verusus consumed are [internal references]() between docs. Updating data between harvesting, storing, and publishing is done with a small set of javascript functions. There is little state to understand and maintain.

### Publishing

Documents are exported as JSON files and rendered using a React app. Search is provided using [Elasticlunr](http://elasticlunr.com). 

### Additional Features

Additional catalog features are added as microservices. [Interra Catalog Admin](http://github.com/interra/catalog-admin) offers a user-interface for creating, editing, and updating data. A datastore is coming soon using [CARTO](http://carto.com). Data visualization dashboards will be added with [React Dash](http://github.com/getdkan/react-dash).

### Extending

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
