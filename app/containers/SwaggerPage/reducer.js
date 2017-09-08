/*
 *
 * SearchPage reducer
 *
 */

import { fromJS } from 'immutable';
import {
  LOAD_SWAGGER,
  LOAD_SWAGGER_SUCCESS,
  LOAD_SWAGGER_ERROR,
} from './constants';

const initialState = fromJS({
  loading: false,
  swagger: false,
  error: false,
});

function swaggerPageReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_SWAGGER:
      return state
        .set('loading', true);
    case LOAD_SWAGGER_SUCCESS:
      return state
        .set('loading', false)
        .set('swagger', action.swagger);
    case LOAD_SWAGGER_ERROR:
      return state
        .set('loading', false)
        .set('error', action.error);
    default:
      return state;
  }
}

export default swaggerPageReducer;
