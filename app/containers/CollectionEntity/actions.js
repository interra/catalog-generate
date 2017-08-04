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
    LOAD_COLLECTION,
    LOAD_COLLECTION_SUCCESS,
    LOAD_COLLECTION_ERROR,
    LOAD_SCHEMA,
    LOAD_SCHEMA_SUCCESS,
    LOAD_SCHEMA_ERROR,
    } from './constants';

/**
* Load the repositories, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionLoadCollection(collectionName) {
    return {
      type: LOAD_COLLECTION,
      collectionName,
    };
}

/**
* Load the repositories, this action starts the request saga
*
* @return {object} An action object with a type of LOAD_REPOS
*/
function actionLoadSchema() {
    console.log('action fired');
    return {
      type: LOAD_SCHEMA,
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
    console.log('it got loaded!!!!!!!!!!!!!!!!!!');
    return {
      type: LOAD_SCHEMA_SUCCESS,
      schema,
    };
}

/**
* Dispatched when the repositories are loaded by the request saga
*
* @param  {string} collection The current collection
*
* @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
*/
function collectionLoaded(collection) {
    console.log('it got loaded');
    return {
      type: LOAD_COLLECTION_SUCCESS,
      collection,
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
    collectionLoaded,
    actionLoadCollection,
    actionLoadSchema,
    schemaLoaded,
    collectionLoadingError,
}
