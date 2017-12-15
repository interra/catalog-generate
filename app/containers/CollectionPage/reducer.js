/*
 *
 * SearchPage reducer
 *
 */

import { fromJS } from 'immutable';
import {
  LOAD_COLLECTION,
  LOAD_COLLECTION_SUCCESS,
  LOAD_COLLECTION_ERROR,
} from './constants';

const initialState = fromJS({
  loading: false,
  collection: false,
  error: false,
});

function collectionPageReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_COLLECTION:
      return state
        .set('loading', true);
    case LOAD_COLLECTION_SUCCESS:
      return state
        .set('loading', false)
        .set('collection', action.collection);
    case LOAD_COLLECTION_ERROR:
      return state
        .set('loading', false)
        .set('error', action.error);
    default:
      return state;
  }
}

export default collectionPageReducer;
