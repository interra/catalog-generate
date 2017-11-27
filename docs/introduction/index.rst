Introduction
------------

For the pros and const of this library see the `ReadMe <https://github.com/interra/catalog-generate#interra-catalog-generate>`_.

The following is an overview of concepts and use.

Metadata
========

The purpose of this project is to make it as easy as possible to catalog metadata. The primary use-case is "open data" but it can be adapted to any schema that takes a similar shape. Files can also be stored and published along side the metadata. Services such as `Carto <http://carto.com>`_ can be used to provide an API for interacting with files or what open data catalog's refer to as a `DataStore <http://docs.ckan.org/en/latest/maintaining/datastore.html>`_.

A document store offers a good solution for storing metadata because it limits the service area for reciving (JSON Objects), storing end editing (JSON Objects with references), and publishing (JSON Objects) metadata.

By limiting the scope and functionality of a metadata catalog this project is designed to make it easier to interact with outside services. For example the integration with `ElasticSearch <https://github.com/interra/catalog-generate/blob/master/internals/models/search.js#L79>`_ consists of only two methods.

Collections and Docs
====================

Content in this catalog is divided into ``collections`` and ``documents`` similar to MongoDB or other `Document Stores <https://en.wikipedia.org/wiki/Document-oriented_database>`_. ``Collections`` are types of content such as a "dataset" or "organization" though they can be anything defined by a schema. ``Docs`` are the individual content items.

The `content model<>`_ contains a ``FileStorage`` and ``MongoDB`` sub-classes which are options for storage. The ``FileStorage``  class treats the local file system as a document databse storing and retrieving results from disk. Using files to store metadata is a primary advantage of this project however a Mongo option is offered since it is necessary for `Interra Catalog Admin <>`_ and the methods for interacting with the data (ie `InsertOne<>`_) are identical. Note the Mongo methods are `not fully supported yet <https://github.com/interra/catalog-generate/issues/12>`_.

Structure
=========

This project consists of the following:

.. code-block:: console

  config.yml
  models/
  schemas/
  build/
  sites/
  app/
  cli.js
  plopfile.js


The rest of the files and folders are artifacts of `react boilerplate <https://github.com/react-boilerplate/react-boilerplate>`_ which drives the ``app/``.

config.yml
~~~~~~~~~~

Contains variables for the location of the ``sites/``, ``build/``, ``schemas/`` directories and the storage mechanism. Storage options are the default FileStorage. Mongo is `not fully supported yet <https://github.com/interra/catalog-generate/issues/12>`_.


models/
~~~~~~

Contains classes for creating, storing and building catalogs.

schemas/
~~~~~~~

Contains the base schemas for the catalog. For adding new schemas it is recommended to change the schema directory in the base ``config.yml`` file.

build/
~~~~~~

Contains the fully-built sites separated by site name. Each site consists of an export of the collection data of the site as well as the built version of the app. The site folder is the production version of the site.

sites/
~~~~~

Contains the data for each site separated by site name. Each site contains a ``config.yml`` file, media files, collection data, and harvest sources.

app/
~~~~

Contains the react app that builds renders the catalog.

cli.js
~~~~~~

A cli for performing site tasks built using `Caporal <https://github.com/mattallty/Caporal.js>`_.

React App Front-End
===================

The front end app is built using `react boilerplate <https://github.com/react-boilerplate/react-boilerplate>`_. This will likely be separated from the models at some point. Data for each site is exported to the ``build/`` folder. Content data is exported to ``build/SITE-NAME/api/v1``. Each site exports a swagger-based documentation of the APIs at ``/api`` which is exported to ``build/SITE-NAME/api/v1/swagger.json``.

Development
~~~~~~~~~~~

Thanks to `react boilerplate <https://github.com/react-boilerplate/react-boilerplate>`_ this project includes a hot-reloading dev-server. To run first build the DLLs ``node cli.js run-dev-dlls SITE-NAME`` and then run the dev server ``node cli.js run-dev SITE-NAME``.


.. toctree::
   :maxdepth: 1

