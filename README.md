[![Build Status](https://travis-ci.org/interra/catalog-generate.svg?branch=master)](https://travis-ci.org/interra/catalog-generate)

# Interra Catalog Generate

A static site generated Open Data catalog using React.

*Open Data should be easier.*

This project generates an Open Data catalog as a static html site. It can be hosted on Github, S3, or any generic server. The schema is declared as JSON-Schema in Yaml files. The metadata and all content are stored in JSON files.

When a file is added or updated it generates a new HTML page.

This includes a script to generate pages but there is also an express server if you want to go that route.

## Dev Version

This is a couple of weeks away from a point where an MVP is documented and up and running. Currently have an early POC here: http://healthdata-example.interra.io/. Once I have the collection pages working, the build pipeline fully built (95% there) and the basic docs up and running I will share and start taking PRs.

## Getting Started

To get started install node modules:

```bash
npm install
```

The default search uses [ElasticLunr](http://elasticlunr.com/). We require the latest ``0.9.6`` version however the current version on npm is [``0.9.5``](https://github.com/weixsong/elasticlunr.js/issues/60). To get the latest version:

```bash
rm -r node_modules/elasticlunr; cd node_modules; git clone git@github.com:weixsong/elasticlunr.js.git elasticlunr;
```

## Requirements

Requires node v6+.
