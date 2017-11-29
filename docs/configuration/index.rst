Configuration
--------

Harvests are configured and stored in the ``sites/SITE-NAME/harvest`` folder.

Front Page Icons 
===============

The front page icons are associated with a certain collection. To set the collection add the following in ``config.yml``:


.. code-block:: yaml 
  front-page-icon-collection:
    - [COLLECTION]
  front-page-icons:
   - [COLLECTION ITEM IDS]

For example:

.. code-block:: yaml 
  front-page-icon-collection: theme 
  front-page-icons:
   - city-planning
   - finance-and-budgeting
   - health-care
   - public-safety
   - transporation

Adding Icons to Collection Items
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The actual icon types are added to the collection items with the ``icon`` key. For example:

.. code-block:: json 

  {
    "title": "City Planning",
    "identifier": "city-planning",
    "icon": "building-12"
  }

Available Icons
~~~~~~~~~~~~~~

Below is the default icon list:

.. figure:: assets/fonts1.png
.. figure:: assets/fonts2.png
.. figure:: assets/fonts3.png
.. figure:: assets/fonts4.png
.. figure:: assets/fonts5.png

.. toctree::
   :maxdepth: 1

