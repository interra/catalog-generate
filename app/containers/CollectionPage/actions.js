/*
 *
 * CollectionPage actions
 *
 */

import {
  LOAD_COLLECTION,
  LOAD_COLLECTION_SUCESS,
  LOAD_COLLECTION_ERROR,
} from './constants';

/**
 * Load the repositories, this action starts the request saga
 *
 * @return {object} An action object with a type of LOAD_REPOS
 */
export function actionLoadCollection(collectionName) {
  return {
    type: LOAD_COLLECTION,
    collectionName,
  };
}

/**
 * Dispatched when the repositories are loaded by the request saga
 *
 * @param  {array} repos The repository data
 * @param  {string} username The current username
 *
 * @return {object}      An action object with a type of LOAD_REPOS_SUCCESS passing the repos
 */
export function collectionLoaded(collection, collectionName) {
  return {
    type: LOAD_COLLECTION_SUCCESS,
    collection,
    collectionName,
  };
}

/**
 * Dispatched when loading the repositories fails
 *
 * @param  {object} error The error
 *
 * @return {object}       An action object with a type of LOAD_REPOS_ERROR passing the error
 */
export function collectionLoadingError(error) {
  return {
    type: LOAD_COLLECTION_ERROR,
    error,
  };
