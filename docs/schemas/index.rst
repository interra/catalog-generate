Schemas
--------

Schemas are collections or JSON-Schema files as well as a few other settings. Each schema should have the following files and folders:

.. code-block:: console

   collections/
   hooks/
   config.yml
   map.yml
   UISchema.yml
   PageSchema.yml


collections/
============

A JSON-Schema representation of each collection for the catalog. ``$ref:`` references are supported.

hooks/
=====

Hooks for overriding docs. This is currently required.

config.yml
=========

The schema's config.yml file has the following properties:

* **name** Human readable name of the schema
* **api** Currently "1" supported
* **collections**  A list of collections the schema describes
* **facets** A list of facets that a catalog's search page would use for this schema. Will be moved to individual sites.
* **references** An object listing each collection that contains references to other collections and on what properties they are connected.
* **routeCollections** Collections that should have routes in the catalog.

map.yml
=======

Each doc has several required fields that the catalog needs:

* title
* identifier
* created
* modified

The ``map.yml`` file allows schemas to map one of the required fields to an existing field in the schema. This keeps schema's from having to keep redundent data and schema's to remain as untouched as possible. For example Project Open Data uses ``name`` for the ``Organization`` instead of ``title``. The ``map.yml`` file allows the ``name`` to be mapped to ``title`` for organizations for use in the catalog.

UISchema.yml
============

Used to map fields in each schema to a widget for the document creation and edit forms in the `Interra Catalog Admin <>`_ project. This uses the `React JSON-Schema Form <https://github.com/mozilla-services/react-jsonschema-form>`_ library which provides that API. See that projects documentation for more details.

PageSchema.yml
============

Similar to the ``UISchema.yml`` file but for rendering collection pages in the react app. Still under development.

.. toctree::
   :maxdepth: 1

