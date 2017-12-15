/*
 *
 * SearchPage reducer
 *
 */

import { fromJS } from 'immutable';
import {
  LOAD,
  LOAD_SUCCESS,
  LOAD_ERROR,
  LEAVE,
} from './constants';

const initialState = fromJS({
  loading: false,
  collection: false,
  fileData: false,
  file: false,
  error: false,
});

function collectionPageReducer(state = initialState, action) {
  switch (action.type) {
    case LEAVE:
      return initialState;
    case LOAD:
      return state
        .set('loading', true);
    case LOAD_SUCCESS:
      return state
        .set('loading', false)
        .set('fileData', action.data);
    case LOAD_ERROR:
      return state
        .set('loading', false)
        .set('error', action.error);
    default:
      return state;
  }
}

export default collectionPageReducer;
