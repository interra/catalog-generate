# Project Open Data Schema Full

This schema comes from [Project Open Data](https://project-open-data.cio.gov/).

## Alterations

The schema has been altered in the following way.

### AnyOf and Redacted Removed
The ``anyOf`` and ``"^(\[\[REDACTED).*?(\]\])$"`` "REDACTED" validation items were removed. Interra doesn't currently support ``anyOf`` because it is not supported properly in [React JSON Schema](https://github.com/mozilla-services/react-jsonschema-form/pull/417) and it is [hard](https://github.com/mozilla-services/react-jsonschema-form/pull/417#issuecomment-288341970) and doesn't add a lot of value.
