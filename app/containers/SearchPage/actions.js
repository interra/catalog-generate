/*
 *
 * SearchPage actions
 *
 */

import {
  LOAD_SEARCH_RESULTS,
  LOAD_SEARCH_RESULTS_SUCCESS,
  LOAD_SEARCH_RESULTS_ERROR,
  LOAD_QUERY,
} from './constants';

export function actionLoadSearchResults(query) {
  return {
    type: LOAD_SEARCH_RESULTS,
    query,
  };
}

export function actionLoadQuery(query) {
  return {
    type: LOAD_QUERY,
    query,
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
