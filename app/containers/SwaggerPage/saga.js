// import { take, call, put, select } from 'redux-saga/effects';

import { call, put, select, takeLatest, fetch } from 'redux-saga/effects';

import { LOAD_SWAGGER } from './constants';
import { actionLoadSwagger, actionLoadSwaggerSuccess, actionLoadSwaggerError } from './actions';

import request from 'utils/request';
import { makeSelectSwagger } from './selectors';

export function* getSwagger() {

  // This breaks staic compilation. Lets fix that later :).
  //const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const url = interraConfig.devUrl;
  const requestURL = url + '/api/v1/swagger.json';

  try {
    //  TODO: do this all on the server and export as the schema.
    const swagger = yield call(request, requestURL);

    yield put(actionLoadSwaggerSuccess(swagger));
  } catch (err) {
    console.log("error?", err);
    yield put(actionLoadSwaggerError(err));
    return null;
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* swaggerData() {

  yield takeLatest(LOAD_SWAGGER, getSwagger);


}
