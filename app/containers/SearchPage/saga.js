// import { take, call, put, select } from 'redux-saga/effects';

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { LOAD_REPOS } from 'containers/App/constants';

import { LOAD_SEARCH_RESULTS, UPDATE_SORT, LOAD_FACETS } from './constants';
import { searchResultsLoaded, searchResultsError, actionFacetsLoaded, actionFacetResultsLoaded } from './actions';

import request from 'utils/request';
import { makeSelectQuery, makeSelectSort, makeSelectFacets, makeSelectResults } from 'containers/SearchPage/selectors';
import elasticlunr from 'elasticlunr';

export function* getFacets(results) {
    console.log("facets loading!");

  // This breaks staic compilation. Lets fix that later :).
  const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const requestURL = url + '/schema.json';
  try {
    // Call our request helper (see 'utils/request')
    const currentSchema = yield call(request, requestURL);

    yield put(actionFacetsLoaded(currentSchema.facets));
  } catch (err) {
        console.log("error?", err);
    yield put(searchResultsError(err));
  }
}


export function* sortResults(action) {
    const results = yield select(makeSelectResults());
    const sort = yield select(makeSelectSort());
    const query = yield select(makeSelectQuery());
    // Just temp until we have dates.
    if (!query) {
        yield put(searchResultsLoaded(results));
        return;
    }

    switch (sort) {
        case "relevance":
          const relaItems = relatize(results);
          yield put(searchResultsLoaded(relaItems));
          return;
        case "alpha":
          const alphaItems = alphabetize(results);
          yield put(searchResultsLoaded(alphaItems));
          break;
        case "date":
          return;
    }
}

/**
 * Get Search results.
 */
export function* getResults(action) {

  const url = window.location.origin + '/search-index.json';

  var query = action.query;// yield select(makeSelectQuery());
  var index = '';//yield select(makeSelectIndex());
  const facets = yield select(makeSelectFacets());
  const relevance = yield select(makeSelectSort());

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
        // Alphabetical by default if there is no query.
        items = alphabetize(items);
    }

    const testFacets =
        {
          keyword: {
            test: 5,
            best: 2,
            none: 1
          },
          theme: {
            one: 14,
            lost: 10,
            bots: 2
          }
        };

    yield put(searchResultsLoaded(items));
    yield put(actionFacetResultsLoaded(testFacets));

  } catch (err) {
    console.log("error?", err);
    yield put(searchResultsError(err));
  }
}

function relatize(items) {
    return items.sort(relatCompare);
}

function alphabetize(items) {
    return items.sort(alphaCompare);
}

function relatCompare(a,b) {
  if (a.score < b.score)
    return -1;
  if (a.score > b.score)
    return 1;
  return 0;
}

function alphaCompare(a,b) {
  if (a.doc.title < b.doc.title)
    return -1;
  if (a.doc.title > b.doc.title)
    return 1;
  return 0;
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
  yield takeLatest(UPDATE_SORT, sortResults);
  yield takeLatest(LOAD_FACETS, getFacets);

}
