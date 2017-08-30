/*
 * HomeReducer
 *
 * The reducer takes care of our data. Using actions, we can change our
 * application state.
 * To add a new action, add it to the switch statement in the reducer function
 *
 * Example:
 * case YOUR_ACTION_CONSTANT:
 *   return state.set('yourStateVariable', true);
 */
import { fromJS } from 'immutable';

import {
  CHANGE_USERNAME,
} from './constants';

// The initial state of the App
const initialState = fromJS({
  query: false,
  index: false,
  results: false,
  loading: false,
});

function homeReducer(state = initialState, action) {
  switch (action.type) {

    default:
      return state;
  }
}

export default homeReducer;
