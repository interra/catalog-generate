import { createSelector } from 'reselect';

/**
 * Direct selector to the searchPage state domain
 */
const selectCollectionPageDomain = () => (state) => state.get('collection');

const makeSelectCollection = () => createSelector(
  selectCollectionPageDomain(),
  (substate) => substate.get('collection')
);

const makeSelectCollectionLoading = () => createSelector(
  selectCollectionPageDomain(),
  (substate) => substate.get('loading')
);

const makeSelectCollectionError = () => createSelector(
  selectCollectionPageDomain(),
  (substate) => substate.get('error')
);

export {
  makeSelectCollection,
  makeSelectCollectionLoading,
  makeSelectCollectionError,
};
