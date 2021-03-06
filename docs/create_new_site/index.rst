Create a New Site
=================

Sites are stored in the ``sitesDir`` which is stored in the root directory's ``config.yml`` file. The default sites directory is ``./sites``.

Use Plop Generator
------------------

A new site can be created using plop: ``node_modules/.bin/plop``.

Create a Site Manually
---------------------

New sites can be created manually by copying the "test-site" in ``./internals/models/tests/sites/test-site``.

Use Catalog Admin
---------------------

`Interra Catalog Admin <https://github.com/interra/catalog-admin>`_ includes a user interface for creating and editing sites.

Validating Sites
---------------------

To validate your site configuration type: ``node cli.js validate-site SITE``.

Site Configration
---------------------

Below is a description of the site configuration file: ``config.yml``.


**Properties**

+-----------------+-----------------+-----------------+-----------------+
|                 | Type            | Description     | Required        |
+=================+=================+=================+=================+
| **name**        | ``string``      | The name of the | Yes             |
|                 |                 | site            |                 |
+-----------------+-----------------+-----------------+-----------------+
| **schema**      | ``string``      | The schema of   | Yes             |
|                 |                 | the site        |                 |
+-----------------+-----------------+-----------------+-----------------+
| **identifier**  | ``string``      | Unique ID of    | Yes             |
|                 |                 | the site        |                 |
+-----------------+-----------------+-----------------+-----------------+
| **description** | ``string``      | Description of  | No              |
|                 |                 | the site        |                 |
+-----------------+-----------------+-----------------+-----------------+
| **search**      | ``string``      | Search settings | Yes             |
|                 |                 | of the site     |                 |
+-----------------+-----------------+-----------------+-----------------+
| **private**     | ``object``      | Private settings| No              |
|                 |                 | of the site     |                 |
+-----------------+-----------------+-----------------+-----------------+
| **front-page-ic | ``string``      | The collection  | No              |
| on-collection** |                 | to be used for  |                 |
|                 |                 | front page      |                 |
|                 |                 | icons           |                 |
+-----------------+-----------------+-----------------+-----------------+
| **front-page-ic | ``array[]``     | The icons to be | No              |
| ons**           |                 | used for front  |                 |
|                 |                 | page icons      |                 |
+-----------------+-----------------+-----------------+-----------------+
| **fontConfig**  | ``object``      | Configuration   | No              |
|                 |                 | object for      |                 |
|                 |                 | fonts           |                 |
+-----------------+-----------------+-----------------+-----------------+

Additional properties are allowed.

name
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The name of the site

-  **Type**: ``string``
-  **Required**: No

schema
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The schema of the site

-  **Type**: ``string``
-  **Required**: No
-  **Allowed values**:

   -  ``"pod-full"``
   -  ``"pod"``
   -  ``"test-schema"``

identifier
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Unique ID of the site

-  **Type**: ``string``
-  **Required**: No

search
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Search settings for the site.

**type**:

The search engine to use for the site. Options include elasticLunr, elasticSearch, and simpleSearch

- type: ``string``
- required: Yes

**fields**:

The fields to include in the search. 

- type: ``array``
- required: Yes

**endpoint**:

Endpoint for Elastic Search or other remote search backend

- type: ``string``
- required: no 
- format: uri

private
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Private settings for the site that are not exported to the production instance. Includes settings for AWS and other services

description
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Description of the site

-  **Type**: ``string``
-  **Required**: No

front-page-icon-collection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The collection to be used for front page icons

-  **Type**: ``string``
-  **Required**: No

front-page-icons
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The icons to be used for front page icons

-  **Type**: ``array[]``
-  **Required**: No

fontConfig
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Configuration object for fonts

-  **Type**: ``object``
-  **Required**: No

.. toctree::
   :maxdepth: 1

