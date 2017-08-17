// import { take, call, put, select } from 'redux-saga/effects';

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { LOAD_REPOS } from 'containers/App/constants';

import { LOAD_SEARCH_RESULTS } from './constants';
import { searchResultsLoaded, searchResultsError } from './actions';

import request from 'utils/request';
import { makeSelectQuery } from 'containers/SearchPage/selectors';
import elasticlunr from 'elasticlunr';

//const elasticlunr = require('elasticlunr');


/**
 * Get Search results.
 */
export function* getResults(action) {

  const url = window.location.origin + '/search-index.json';

  var query = action.query;// yield select(makeSelectQuery());
  var index = '';//yield select(makeSelectIndex());

  try {
    if (!index) {
      console.time("Loading index.");
      index = yield call(request, url);
      index = elasticlunr.Index.load(index);
      //yield put(searchIndexLoaded(index));
      console.timeEnd("Index Loaded");
    }

    var items = [];

    if (query) {
      items = index.search(query, {expand: true});
    }
    else {
        const docs = index.documentStore.docs;
        items = Object.keys(docs).map(function(index) {
            var item = {
                doc: docs[index],
                ref: index,
                score: 1
            }
            return item;
        });
    }

    yield put(searchResultsLoaded(items));
  } catch (err) {
    console.log("error?", err);
    yield put(searchResultsError(err));
  }
}


/**
 * Root saga manages watcher lifecycle
 */
export default function* searchData() {
  // Watches for LOAD_REPOS actions and calls getRepos when one comes in.
  // By using `takeLatest` only the result of the latest API call is applied.
  // It returns task descriptor (just like fork) so we can continue execution
  // It will be cancelled automatically on component unmount
  yield takeLatest(LOAD_SEARCH_RESULTS, getResults);

}
