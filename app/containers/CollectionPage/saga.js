// import { take, call, put, select } from 'redux-saga/effects';

import { call, put, select, takeLatest, fetch } from 'redux-saga/effects';

import { LOAD_COLLECTION } from './constants';
import { actionLoadCollection, actionLoadCollectionSuccess, actionLoadCollectionError } from './actions';

import request from 'utils/request';
import { makeSelectCollection } from './selectors';

export function* getCollection(action) {

  // This breaks staic compilation. Lets fix that later :).
  const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const requestURL = `${url}/api/v1/collections/${action.collectionType}.json`;

  try {
    //  TODO: do this all on the server and export as the schema.
    const collection = yield call(request, requestURL);

    yield put(actionLoadCollectionSuccess(collection));
  } catch (err) {
    console.log("error?", err);
    yield put(actionLoadCollectionError(err));
    return null;
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* collectionData() {

  yield takeLatest(LOAD_COLLECTION, getCollection);


}
