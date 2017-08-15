# Interra Data Generate

A static site generated Open Data catalog using React.

*Open Data should be easier.*

This project generates an Open Data catalog as a static html site. It can be hosted on Github, S3, or any generic server. The schema is declared in Yaml files. The metadata and all content are also stored in Yaml files.

When a file is added or updated it generates a new HTML page.

This includes a script to generate pages but there is also an express server if you want to go that route.

This is built off of <a href="https://github.com/orgs/react-boilerplate">React Boilerplate (ssr branch)</a>

## Pre Pre Pre Dev Version

This is not yet ready to even play around with. Updates soon.

## Getting Started

To get started install node modules:

```bash
npm install
```

The default search uses [ElasticLunr](http://elasticlunr.com/). We require the latest ``0.9.6`` version however the current version on npm is ``0.9.5``. To get the latest version:

```bash
rm -r node_modules/elasticlunr; cd node_modules; git clone git@github.com:weixsong/elasticlunr.js.git elasticlunr;
```
