import { createSelector } from 'reselect';

/**
 * Direct selector to the collectionPage state domain
 */
const selectCollectionPageDomain = () => (state) => state.get('collectionPage');

/**
 * Other specific selectors
 */


/**
 * Default selector used by CollectionPage
 */

const makeSelectCollections = () => createSelector(
  selectCollectionPageDomain(),
  (substate) => substate.toJS()
);

export default makeSelectCollections;
export {
  selectCollectionPageDomain,
};
