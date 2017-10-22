# Test Schema

This test schema exhibits some of the options and constraints for creating schemas. Schemas are declared in yaml files and must be [JSON Schema](http://json-schema.org/) compliant.

## Collections

"Test Schema" has three collections, datasets, organizations, and tags, with the following fields:

### Datasets
* title
* id
* description
* organization
* tags
* created
* modified
* resources
* interra.path

### Organization
* name
* description
* refreshed
* created

### Tag
* title
* identifier
* created

## Required fields

To function as a catalog Interra requires several fields: ``title``, ``identifier``, ``created``, and ``modified``. Interra doesn't require that you add all of these fields to your schemas because most schemas have their own ways of describing these fields. Interra tries to reduce the amount of changes to schemas as much as possible.

### Interra Object

Collections that should be viewed as individual pages in the catalog, identified as ``routeCollections`` in the schema's ``config.yml``, require ``path`` in the ``interra`` object. The ``path`` is stored in the ``interra`` object because it is specific to the catalog. Other fields that are useful for catalog specific collection properties and workflows, for example a catalog may want to track "users", should be stored in the ``interra`` object.

### Managing Required Fields Not Included in Schemas

Required fields can be added to schemas in several ways:

1. Directly to the schema
2. Mapped from existing fields using ``map.yml``
3. Added or mutated using the schema Hooks in ``hooks/Schema.js``
4. Added or mutated using the collection items hooks in ``hooks/Content.js``

### Adding Required Fields Directly to a Schema

Required fields can be added directly to a schema. In the ``datasets`` schema for example ``title``, ``modified`` and ``created`` are already part of the schema:

```yml
title:
  type: string
  title: Title
...
created:
  type: string
  title: Created
  format: date-time  
modified:
  type: string
  title: Modified
  format: date-time
```

### Mapping Fields Declared in Schemas to Required Fields

Required fields are often declared in schema but have a different name. If this is the case they can be mapped to a required field using the ``map.yml`` file. In this schema in ``datasets`` the ``id` field is equivalent to ``identifier`` and in the ``organization`` collection ``name`` is equivalent to the required ``title``. These are mapped in the ``map.yml`` file:

```yml
organization:
  name: title
  refreshed: modified
datasets:
  id: identifier
```

### Edit Schema Definition With Schema Hooks

The schema hooks in ``hooks/Schema.js`` provide the opportunity to add or edit schemas as they are used by the schema model. You may want to use a hook instead of changing the schema so that you can keep the schema definition unchanged from its original definition. This would be true if you were importing the schema from a standard defined outside of your organization.

You also may want to change something like the format of a field depending on whether it is being loaded from a form or stored. For the ``organization`` we are adding the ``created`` field and making it required by adding it to the hook:

```javascript
postLoad: function(collection, schema, callback) {
  if (collection === 'tag') {
    schema.properties.created = {
      "type": "string",
      "title": "Created",
      "format": "date-time"
    }
    schema.required.push("created");
  }
  return callback(null, schema);
},
```

### Edit Collection Item With Content Hooks
The output of required or other fields can be altered using the hooks in ``hooks/Content.js``. For example a date field may need to be harvested or stored in a format that is different than what the catalog would expect.

```javascript
  postDereference: function(collection, data, callback) {
    // Formats date for output.
    if (collection === "datasets") {
      const date = new Date(data.created);
      data.created = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    }
    return callback(null, data);
  },
```
