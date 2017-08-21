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
  UPDATE_RESULTS_COUNT,
} from './constants';

export function actionLoadSearchResults(query, selectedFacets) {
  console.log(selectedFacets);
  return {
    type: LOAD_SEARCH_RESULTS,
    query,
    selectedFacets,
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
  return {
    type: LOAD_FACETS_SUCCESS,
    facets,
  };
}

export function actionsearchResultsTotal(number) {
  return {
    type: UPDATE_RESULTS_COUNT,
    number,
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
