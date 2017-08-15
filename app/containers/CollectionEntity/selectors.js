/**
 * Homepage selectors
 */

import { createSelector } from 'reselect';

const selectCol = (state) => { return state.get('collections')};


const makeSelectCollection = () => createSelector(
  selectCol,
  (collectionState) => { console.log(collectionState.get('collection')); return collectionState.get('collection')}
);

const makeSelectSchema = () => createSelector(
  selectCol,
  (collectionState) => { console.log(collectionState.get('schema')); return collectionState.get('schema')}
);

const makeSelectCollectionName = () => createSelector(
  selectCol,
  (collectionState) => { console.log(collectionState.get('collectionName')); return collectionState.get('collectionName')}
);


export {
  selectCol,
  makeSelectCollectionName,
  makeSelectCollection,
  makeSelectSchema,
};
