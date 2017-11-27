Harvesting
--------

Harvests are configured and stored in the ``sites/SITE-NAME/harvest`` folder.

Harvest Sources
===============

The ``sources.json`` file in the ``harvest`` folder provides a list of harvest sources. The list uses the following format:

* **id** The human readable identifier for the harvest source
* **source** The source of the harvest. Can be a remote ``http://`` or ``https://`` source or a local source ``file://``.
* **type** The type of source. Currently DataJSON is the only option.
* **filters** Allows the filtering of sources by a key and value that will need to appear in each source document that is included in the harvest.
* **exclude** The opposite of filter.
* **overrides** Override a value in each doc.
* **defaults** Provides a default value only if that value is missing from each source doc.

Running Harvests
===============

Caching
~~~~~~
Harvests sources are first cached to local files before processing. This makes dealing with remote source timeout issues easier. Cached sources are stored in the ``harvest/SOURCE-NAME/SOURCE-TYPE`` folder. To run the cache type:

``node cli.js harvest-cache SITE-NAME``

Running
~~~~~~

Once files are cached type the following to run a harvest:

``node cli.js harvest-run SITE-NAME``

Harvest sources are now stored in the site's ``collections`` folder as site documents. The harvest source is added to the ``interra`` object in each doc.



.. toctree::
   :maxdepth: 1

