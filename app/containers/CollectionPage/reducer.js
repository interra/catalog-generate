/*
 *
 * CollectionPage reducer
 *
 */

import { fromJS } from 'immutable';
import {
  DEFAULT_ACTION,
} from './constants';

const initialState = fromJS({
  loading: false,
  error: false,
  currentCollection: false,
  collectionName: false,
  userData: {
    repositories: false,
  },
});

function collectionPageReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_COLLECTION:
      return state
        .set('loading', true)
        .set('error', false)
        .set('collectivo', false);
    case LOAD_REPOS_SUCCESS:
      return state
        .set('collectivo', action.repos)
        .set('loading', false)
        .set('currentUser', action.username);
    case LOAD_REPOS_ERROR:
      return state
        .set('error', action.error)
        .set('loading', false);
    default:
      return state;
  }
}

export default collectionPageReducer;
