Publish Site
--------

Sites are published as single page apps in the ``build/`` folder.

The published react app uses data from two sources:

1. Exported collection data and apis in the ``api/v1`` folder.
2. Contents of the site's ``config.yml`` that are exported by webpack as the ``interraConfig`` global variable for the app

Running the ``node cli.js`` command shows the available build commands.

Building Collection Data 
=======================

Collection data is stored in ``sites/SITE-NAME/collections``. The data stored there is "referenced" meaning it contains references to documents stored in other collections. When data is exported the documents are "derefenced" so they contain the full document with all of their referenced objects. Documents use the ``interra.id`` to reference each other.

Collection data is exported to ``builds/SITE-NAME/api/v1/collections``. To export all collection data run:

``node cli.js build-collection-data SITE-NAME``

To export an idividual document run:

``node cli.js build-collection-data-item SITE-NAME COLLECTION-NAME DOCUMENT-NAME``


Building APIs
=============

APIs are built use the ``node cli.js`` command. Available build commands include:

* **build-datajson** builds Projet Open Data's ``data.json`` file.
* **build-routes** builds a list of available routes in the ``routes.json`` file. Used by the react app to render collection page
* **build-schema** builds a description of the site schema in the ``schema.json`` file.
* **build-search** builds a search index in the ``search-index.json`` if elasticLunr or simpleSearch are used
* **build-swagger** builds a swagger api file for the site at ``swagger.json``.

All APIs for a site can be built at once using ``node cli.js build-apis SITE-NAME``.

Building the React App
=====================

A version of the react app is exported to each site directory. The only difference between them are the site configuraiton contained in the ``interraConfig`` variable which is exported as part of the app by webpack.

To build the app run ``node cli.js build-site SITE-NAME``.

.. toctree::
   :maxdepth: 1

