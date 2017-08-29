/*
 *
 * SearchPage reducer
 *
 */

import { fromJS } from 'immutable';
import {
  CLEAR_RESULTS,
  LOAD_FACETS,
  LOAD_FACETS_SUCCESS,
  LOAD_FACETS_RESULTS,
  LOAD_FACETS_RESULTS_SUCCESS,
  LOAD_HOME_PAGE_ICONS,
  LOAD_HOME_PAGE_ICONS_SUCCESS,
  LOAD_SEARCH_INDEX,
  LOAD_SEARCH_INDEX_SUCCESS,
  LOAD_SEARCH_RESULTS,
  LOAD_SEARCH_RESULTS_SUCCESS,
  LOAD_SEARCH_RESULTS_ERROR,
  LOAD_QUERY,
  UPDATE_SORT,
  UPDATE_RESULTS_COUNT,
} from './constants';

const initialState = fromJS({
  loading: true,
  query: false,
  results: false,
  error: false,
  facets: false,
  resultsCount: false,
  selectedFacets: false,
  facetsResults: false,
  loadingFacets: false,
  loadingFacetsResults: true,
  sort: "alpha",
  facets: false,
  index: false,
  homePageIcons: false,
  loadingHomePageIcons: false,
});

function searchPageReducer(state = initialState, action) {
  switch (action.type) {
    case CLEAR_RESULTS:
      return state
        .set('results', false)
        .set('query', false)
        .set('selectedFacets', false);
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
    case LOAD_HOME_PAGE_ICONS:
      return state
        .set('loadingHomePageIcons', true);
    case LOAD_HOME_PAGE_ICONS_SUCCESS:
      return state
        .set('loadingHomePageIcons', false)
        .set('homePageIcons', action.homePageIcons);
    case LOAD_QUERY:
      return state
        .set('loading', true)
        .set('query', action.query);
    case LOAD_SEARCH_INDEX_SUCCESS:
      return state
        .set('index', action.index);
    case LOAD_SEARCH_RESULTS:
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
