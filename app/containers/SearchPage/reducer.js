/*
 *
 * SearchPage reducer
 *
 */

import { fromJS } from 'immutable';
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

const initialState = fromJS({
  loading: true,
  query: '*',
  results: false,
  error: false,
  facets: false,
  resultsCount: false,
  selectFacets: false,
  facetsResults: false,
  loadingFacets: false,
  loadingFacetsResults: true,
  sort: "alpha",
  facets: false,
});

function searchPageReducer(state = initialState, action) {
  console.log(action.type);
  switch (action.type) {
    case LOAD_FACETS:
      return state
        .set('loadingFacets', true);
    case LOAD_FACETS_SUCCESS:
      return state
        .set('loadingFacets', false)
        .set('facets', action.facets);
    case LOAD_FACETS_RESULTS_SUCCESS:
      return state
        .set('loadingFacetsResults', false)
        .set('facetsResults', action.facetsResults);
    case LOAD_QUERY:
      return state
        .set('loading', true)
        .set('query', action.query);
    case LOAD_SEARCH_RESULTS:
      console.log("what the but");
      return state
        .set('loading', true)
        .set('loadingFacetsResults', true)
        .set('selectedFacets', action.selectedFacets)
        .set('query', action.query);
    case LOAD_SEARCH_RESULTS_SUCCESS:
      return state
        .set('loading', false)
        .set('results', action.results);
    case UPDATE_SORT:
      return state
        .set('loading', true)
        .set('sort', action.sort);
    case UPDATE_RESULTS_COUNT:
      return state
        .set('resultsCount', action.number);
    default:
      return state;
  }
}

export default searchPageReducer;
