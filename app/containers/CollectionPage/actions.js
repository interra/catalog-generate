/*
 *
 * SearchPage actions
 *
 */

import {
  LOAD_COLLECTION,
  LOAD_COLLECTION_SUCCESS,
  LOAD_COLLECTION_ERROR,
} from './constants';


export function actionLoadCollection(collectionType) {
  return {
    type: LOAD_COLLECTION,
    collectionType,
  };
}

export function actionLoadCollectionSuccess(collection) {
  return {
    type: LOAD_COLLECTION_SUCCESS,
    collection
  };
}

export function actionLoadCollectionError() {
  return {
    type: LOAD_COLLECTION_ERROR,
  };
}
