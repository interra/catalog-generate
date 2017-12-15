/*
 * Home Actions
 *
 * Actions change things in your application
 * Since this boilerplate uses a uni-directional data flow, specifically redux,
 * we have these actions which are the only way your application interacts with
 * your application state. This guarantees that your state is up to date and nobody
 * messes it up weirdly somewhere.
 *
 * To add a new Action:
 * 1) Import your constant
 * 2) Add a function like this:
 *    export function yourAction(var) {
 *        return { type: YOUR_ACTION_CONSTANT, var: var }
 *    }
 */

import {
  SET_COLLECTION_NAME,
  LEAVE_COLLECTION,
  LOAD_COLLECTION,
  LOAD_COLLECTION_SUCCESS,
  LOAD_COLLECTION_ERROR,
  LOAD_SCHEMA,
  LOAD_SCHEMA_SUCCESS,
  LOAD_SCHEMA_ERROR,
  LOAD_SITEMAP_SUCCESS,
  LOAD_BREADCRUMB,
  LOAD_BREADCRUMB_SUCCESS,
  LOAD_BREADCRUMB_ERROR,
} from './constants';



/**
* Load the repositories, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionSetCollectionName(collectionName) {
    return {
      type: SET_COLLECTION_NAME,
      collectionName,
    };
}

/**
* Load the repositories, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionLoadCollection(path) {
    return {
      type: LOAD_COLLECTION,
      path,
    };
}

/**
* Load the repositories, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionLoadSchema() {
    return {
      type: LOAD_SCHEMA,
    };
}

/**
* Load the repositories, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionLeaveCollection() {
    return {
      type: LEAVE_COLLECTION,
    };
}


/**
* Dispatched when the repositories are loaded by the request saga
*
* @param  {string} collection The current collection
*
* @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
*/
function schemaLoaded(schema) {
    return {
      type: LOAD_SCHEMA_SUCCESS,
      schema,
    };
}

/**
* Dispatched when the CollectionEntity page loads for the first time
*
* @param  {string} siteMap The loaded siteMap
*
* @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
*/
function siteMapLoaded(siteMap) {
    return {
      type: LOAD_SITEMAP_SUCCESS,
      siteMap,
    };
}

/**
* Load the breadcrumb, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionLoadBreadcrumb(path) {
    return {
      type: LOAD_BREADCRUMB,
      path,
    };
}

/**
* Dispatched when the CollectionEntity page loads for the first time
*
* @param  {string} breadcrumb The loaded breadcrumb
*
* @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
*/
function breadcrumbLoaded(breadcrumb) {
    return {
      type: LOAD_BREADCRUMB_SUCCESS,
      breadcrumb,
    };
}

/**
* Dispatched when the CollectionEntity page loads for the first time
*
* @param  {string} breadcrumb The loaded breadcrumb
*
* @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
*/
function breadcrumbLoadedError(error) {
    return {
      type: LOAD_BREADCRUMB_ERROR,
      error,
    };
}

/**
* Dispatched when the repositories are loaded by the request saga
*
* @param  {string} collection The current collection
*
* @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
*/
function collectionLoaded(doc) {
    return {
      type: LOAD_COLLECTION_SUCCESS,
      doc,
    };
}

/**
* Dispatched when loading the repositories fails
*
* @param  {object} error The error
*
* @return {object}       An action object with a type of LOAD_REPOS_ERROR passing the error
*/
function collectionLoadingError(error) {
return {
  type: LOAD_COLLECTION_ERROR,
  error,
  }
};



export {
    actionLeaveCollection,
    collectionLoaded,
    actionLoadCollection,
    actionSetCollectionName,
    actionLoadSchema,
    schemaLoaded,
    siteMapLoaded,
    breadcrumbLoadedError,
    breadcrumbLoaded,
    actionLoadBreadcrumb,
    collectionLoadingError,
}
