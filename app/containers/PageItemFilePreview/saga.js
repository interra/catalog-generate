
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { LOAD } from './constants';
import { actionLoadFile, actionLoadSuccess, actionLoadError } from './actions';

import request from 'utils/requestFile';
import { makeSelect } from './selectors';
import parse from 'csv-parse';

function parseResponse(response) {
  const initialContentType = response.headers.get('Content-Type');
  const contentType = initialContentType.substring(0, initialContentType.indexOf(';'));
  const length = response.headers.get('Content-Length');
  if (length < 99999) {
    if (contentType === 'text/csv') {
      return response.text().then((item) => {
         return new Promise(resolve => {
           parse(item, {columns: true}, (err, output) => {
             resolve(output);
          });
        });
      });
    } else if (contentType === 'application/json') {
      return response.json().then(item);
    }
  } else {
    return false;
  }
}

export function* get(action) {
  const requestURL = action.file;

  try {
    //  TODO: do this all on the server and export as the schema.
    const response = yield call(request, requestURL);
    const data = yield call(parseResponse, response);
    yield put(actionLoadSuccess(data));

  } catch (err) {
    console.log("error?", err);
    yield put(actionLoadError(err));
    return null;
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* Data() {

  yield takeLatest(LOAD, get);


}
