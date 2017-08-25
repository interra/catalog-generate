/**
 * Gets the repositories of the user from Github
 */

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { LOAD_REPOS } from 'containers/App/constants';

import { LOAD_COLLECTION, LOAD_SCHEMA, LOAD_COLLECTION_SUCCESS } from './constants';
import { collectionLoaded, schemaLoaded } from './actions';

import { reposLoaded, repoLoadingError } from 'containers/App/actions';

import request from 'utils/request';
import {makeSelectCollectionName, makeSelectCollection } from 'containers/CollectionEntity/selectors';

/**
 * Github repos request/response handler
 */
export function* getSchema() {

  // This breaks staic compilation. Lets fix that later :).
  const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const requestURL = url + '/schema.json';
  try {
    // Call our request helper (see 'utils/request')
    const currentSchema = yield call(request, requestURL);
    yield put(schemaLoaded(currentSchema));
  } catch (err) {
    console.log("error?", err);
    yield put(repoLoadingError(err));
  }
}

/**
 * Github repos request/response handler
 */
export function* getRepos() {

  // This breaks staic compilation. Lets fix that later :).
  const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  // Select username from store
  const collection = yield select(makeSelectCollectionName());
  const requestURL = url + '/collections/' + collection + '.json';
  try {
    // Call our request helper (see 'utils/request')
    const currentCollectionne = yield call(request, requestURL);
    yield put(collectionLoaded(currentCollectionne));
  } catch (err) {
    console.log("error?", err);
    yield put(repoLoadingError(err));
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* githubData() {
  // Watches for LOAD_REPOS actions and calls getRepos when one comes in.
  // By using `takeLatest` only the result of the latest API call is applied.
  // It returns task descriptor (just like fork) so we can continue execution
  // It will be cancelled automatically on component unmount
  yield takeLatest(LOAD_COLLECTION, getRepos);
  yield takeLatest(LOAD_SCHEMA, getSchema);

}
