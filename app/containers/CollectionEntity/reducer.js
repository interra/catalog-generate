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
  LOAD_COLLECTION,
  LOAD_COLLECTION_SUCCESS,
  LOAD_SCHEMA,
  LOAD_SCHEMA_SUCCESS,
} from './constants';

// The initial state of the App
const initialState = fromJS({
  loading: false,
  username: '',
  collectionName: '',
  collection: false,
  error: false,
  schema: false,
});

function homeReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_COLLECTION:
      console.log('were are loading', action);
      return state
        .set('loading', true)
        .set('collectionName', action.collectionName);
    case LOAD_COLLECTION_SUCCESS:
      return state
        .set('loading', false)
        .set('collection', action.collection);
    case LOAD_SCHEMA:
      console.log('were are loading', action);
      return state
        .set('loading', true)
    case LOAD_SCHEMA_SUCCESS:
      return state
        .set('loading', false)
        .set('schema', action.schema);
    default:
      return state;
  }
}

export default homeReducer;
