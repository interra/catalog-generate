/*
 *
 * SearchPage actions
 *
 */

import {
  LOAD_FACETS,
  LOAD_FACETS_SUCCESS,
  LOAD_FACETS_RESULTS,
  LOAD_FACETS_RESULTS_SUCCESS,
  LOAD_SEARCH_RESULTS,
  LOAD_SEARCH_RESULTS_SUCCESS,
  LOAD_SEARCH_RESULTS_ERROR,
  LOAD_QUERY,
  UPDATE_SORT,
} from './constants';

export function actionLoadSearchResults(query) {
  return {
    type: LOAD_SEARCH_RESULTS,
    query,
  };
}

export function actionFacetResultsLoaded(facetsResults) {
  return {
    type: LOAD_FACETS_RESULTS_SUCCESS,
    facetsResults,
  };
}

export function actionLoadQuery(query) {
  return {
    type: LOAD_QUERY,
    query,
  };
}

export function actionUpdateSort(sort) {
  return {
    type: UPDATE_SORT,
    sort,
  };
}

export function actionLoadFacets() {
  return {
    type: LOAD_FACETS,
  };
}

export function actionFacetsLoaded(facets) {
  console.log("WHY AGAIN?");
  return {
    type: LOAD_FACETS_SUCCESS,
    facets,
  };
}

export function searchResultsLoaded(results) {
  return {
    type: LOAD_SEARCH_RESULTS_SUCCESS,
    results,
  };
}

export function searchResultsError(error) {
  return {
    type: LOAD_SEARCH_RESULTS_ERROR,
    error,
  };
}
