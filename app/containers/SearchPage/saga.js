// import { take, call, put, select } from 'redux-saga/effects';

import { call, put, select, takeLatest, fetch } from 'redux-saga/effects';
import { LOAD_REPOS } from 'containers/App/constants';

import { LOAD_HOME_PAGE_ICONS, LOAD_SEARCH_INDEX, LOAD_SEARCH_RESULTS, UPDATE_SORT, LOAD_FACETS, UPDATE_FACETS } from './constants';
import { actionLoadHomePageIconsLoaded, selectedFacets, searchIndexLoaded, searchResultsLoaded, searchResultsError, actionsearchResultsTotal, actionFacetsLoaded, actionFacetResultsLoaded } from './actions';

import request from 'utils/request';
import { makeSelectIndex, makeSelectQuery, makeSelectSort, makeSelectFacets, makeSelectResults } from 'containers/SearchPage/selectors';
import elasticlunr from 'elasticlunr';
import search from 'search';

export function* getIcons(action) {
  const collection = interraConfig['front-page-icon-collection'];
  const icons = interraConfig['front-page-icons'];
  const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];

  try {
    const responses = yield icons.map(p => call(request, url + '/api/v1/collections/' + collection + '/' + p + '.json'));
    yield put(actionLoadHomePageIconsLoaded(responses));
    return responses;
  } catch (err) {
    console.log("error getting Icons", err);
    return null;
  }
}

export function* getFacets() {

  // This breaks staic compilation. Lets fix that later :).
  const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const requestURL = url + '/api/v1/schema.json';
  try {
    //  TODO: do this all on the server and export as the schema.
    const currentSchema = yield call(request, requestURL);

    yield put(actionFacetsLoaded(currentSchema.facets));
    return currentSchema.facets;
  } catch (err) {
    console.log("error?", err);
    yield put(searchResultsError(err));
    return null;
  }
}

export function* sortResults(action) {
    const results = yield select(makeSelectResults());
    const sort = yield select(makeSelectSort());
    const query = yield select(makeSelectQuery());

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
          const dateItems = datetize(results);
          yield put(searchResultsLoaded(dateItems));
          return;
    }
}

Object.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter( key => predicate(obj[key]) )
    .reduce( (res, key) => (res[key] = obj[key], res), {} );

/**
 * Get Search results.
 */
export function* loadIndex() {
  const searchType = interraConfig.search.type;
  const searchEngine = new search[searchType];
  const index = yield searchEngine.init();
  yield put(searchIndexLoaded(index));
  return index;
}


function getFacetValue(doc, facet, facets) {
  let fields = facets[facet].field.split('.');
  let docR = new Object();
  let docRArray = [];

  fields.forEach(function(field, i) {
    // If we are at the end of the field array just return the value, otherwise
    // we just get the entire array.
    if (fields.length - 1 === i && Array.isArray(docR)) {
      docRArray = docR;
      docRArray.forEach(function(item, x) {
        docR[x] = item[field];
      });
    } else {
      // Clone the object or array if the docR hasn't been recorded yet.
      if (Array.isArray(doc[field])) {
        docR = doc[field].slice(0);
      }
      else {
        docR = Object.keys(docR).length === 0 ? Object.assign({}, doc[field]) : docR[field];
      }
    }
  });
  return docR;
}

export function* loadFacetsFromResults() {
  let facets = yield select(makeSelectFacets());
  if (!facets) {
    facets = yield getFacets();
  }
  const results = yield select(makeSelectResults());
  const loadedFacets = yield loadFacets(facets, results);
  yield put(actionFacetResultsLoaded(loadedFacets))
}

// This confusing piece of junk loops through the results and facets and grabs
// the values of the final facet value from the doc.
// Facet fields can look like "distribution.format" hence the split.
export function* getFacetInitialTotal(facets, results) {
  let facetsTotal = [];
  results.forEach(function(result) {
    for (var facet in facets) {
      const docR = getFacetValue(result.doc, facet, facets);

      facetsTotal[facet] = !facetsTotal[facet] ? [] : facetsTotal[facet];
      // We want to flatten the results so there is one big array instead of a
      // combo of array results.
      if (Array.isArray(docR)) {
        docR.forEach(function(item, x) {
          facetsTotal[facet].push(item);
        });
      }
      else {
        if (docR && Object.keys(docR).length !== 0 ) {
          facetsTotal[facet].push(docR);
        }
      }
    }
  });
  return facetsTotal;
}

export function* loadFacets(facets, results) {

  const pageSizeFacets = 10;

  const facetsTotal = yield getFacetInitialTotal(facets, results);

  var facetsResults = {};

  for (var facet in facets) {
    facetsResults[facet] = {};
    if (facetsTotal[facet]) {
      facetsTotal[facet].forEach(function(i) {
          facetsResults[facet][i] = (facetsResults[facet][i]||0)+1;
      });
    }
  };

  // TODO: separate into func.
  let facetsSorted = {};
  for (var facet in facets) {
    facetsSorted[facet] = [];
    facetsSorted[facet] = Object.entries(facetsResults[facet]).sort(function(a,b) {
      return (a[1] > b[1]) ? -1 : ((b[1] > a[1]) ? 1 : 0)
    });
  };

  // TODO:
  let facetsPaged = {};
  for (var facet in facets) {
    facetsPaged[facet] = facetsSorted[facet].slice(0, pageSizeFacets);
  };
  return facetsPaged;
}

/**
 * Get Search results.
 */
export function* getResults(action) {
  const searchType = interraConfig.search.type;
  const searchEngine = new search[searchType];

  var query = action.query;// yield select(makeSelectQuery());
  var index = yield select(makeSelectIndex());
  let selectedFacets = action.selectedFacets;

  const sort = yield select(makeSelectSort());
  const pageSize = 25;
  const currentPage = 0; // yield select(makeSelectCurrentPage());
  try {
    if (!index) {
      index = yield call(loadIndex);
    }
    let facets = yield select(makeSelectFacets());
    if (!facets) {
      facets = yield getFacets();
    }
    var items = [];

    console.time("Querying index.");

    if (query) {
      items = yield searchEngine.query(query, index);
    } else {
      items = yield searchEngine.getAll(index);
      // Alphabetical by default if there is no query.
      items = alphabetize(items);

    }
    console.timeEnd("Query Loaded");

    let faceted = [];

    if (selectedFacets && selectedFacets.length > 0) {

      selectedFacets.forEach(function(selectedFacet) {
        let term = selectedFacet[0];
        let value = selectedFacet[1];
        faceted = items.filter(function(item) {
          let facetValue = getFacetValue(item.doc, term, facets);
          if (Array.isArray(facetValue)) {
            if (Object.values(facetValue).indexOf(value) > -1) {
              return true;
            }
          }
          else if (facetValue == value) {
            return true;
          }
          return false;
        });
      })
    } else {
      console.log("no selected facets");
      faceted = items;
    }
    yield put(actionsearchResultsTotal(faceted.length));

    const paged = faceted.slice(0, pageSize);
    yield put(searchResultsLoaded(paged));

    if (facets) {
      const preparedFacets = yield loadFacets(facets, faceted);
      yield put(actionFacetResultsLoaded(preparedFacets))
    }

  } catch (err) {
    console.log("error getResults?", err);
    yield put(searchResultsError(err));
  }
}

function relatize(items) {
    return items.sort(relatCompare);
}

function datetize(items) {
    return items.sort(dateCompare);
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

function dateCompare(a,b) {
  if (a.doc.modified > b.doc.modified)
    return -1;
  if (a.doc.modified < b.doc.modified)
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
  yield takeLatest(LOAD_HOME_PAGE_ICONS, getIcons);
  yield takeLatest(LOAD_SEARCH_RESULTS, getResults);
  yield takeLatest(UPDATE_SORT, sortResults);
  yield takeLatest(LOAD_FACETS, getFacets);
  yield takeLatest(UPDATE_FACETS, loadFacetsFromResults);
  yield takeLatest(LOAD_SEARCH_INDEX, loadIndex);


}
