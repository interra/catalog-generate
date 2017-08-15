/*
 *
 * SearchPage reducer
 *
 */

import { fromJS } from 'immutable';
import {
  LOAD_SEARCH_RESULTS,
  LOAD_SEARCH_RESULTS_SUCCESS,
  LOAD_SEARCH_RESULTS_ERROR,
  LOAD_QUERY,
} from './constants';

const initialState = fromJS({
  loading: false,
  query: '',
  results: false,
  error: false,
  facets: false,
});

function searchPageReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_QUERY:
      return state
        .set('loading', true)
        .set('query', action.query);
    case LOAD_SEARCH_RESULTS:
      return state
        .set('loading', true)
        .set('query', action.query);
    case LOAD_SEARCH_RESULTS_SUCCESS:
      return state
        .set('loading', false)
        .set('results', action.results);
    default:
      return state;
  }
}

export default searchPageReducer;
