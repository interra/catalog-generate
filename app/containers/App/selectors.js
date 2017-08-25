/**
 * The global state selectors
 */

import { createSelector } from 'reselect';

const selectGlobal = (state) => state.get('global');

const selectRoute = (state) => state.get('route');

const selectSearchPageDomain = (state) => state.get('search');

const makeSelectIndex = () => createSelector(
  selectSearchPageDomain,
  (substate) => substate.get('index')
);

const makeSelectQuery = () => createSelector(
  selectSearchPageDomain,
  (globalState) => globalState.get('query')
);

const makeSelectCollection = () => createSelector(
  selectGlobal,
  (globalState) => globalState.get('collection')
);

const makeSelectCollectionName = () => createSelector(
  selectGlobal,
  (globalState) => globalState.get('collectionName')
);


const makeSelectCurrentUser = () => createSelector(
  selectGlobal,
  (globalState) => globalState.get('currentUser')
);

const makeSelectLoading = () => createSelector(
  selectGlobal,
  (globalState) => globalState.get('loading')
);

const makeSelectError = () => createSelector(
  selectGlobal,
  (globalState) => globalState.get('error')
);

const makeSelectRepos = () => createSelector(
  selectGlobal,
  (globalState) => globalState.getIn(['userData', 'repositories'])
);

const makeSelectLocation = () => createSelector(
  selectRoute,
  (routeState) => routeState.get('location').toJS()
);

export {
  selectGlobal,
  makeSelectIndex,
  makeSelectQuery,
  makeSelectCollection,
  makeSelectCollectionName,
  makeSelectCurrentUser,
  makeSelectLoading,
  makeSelectError,
  makeSelectRepos,
  makeSelectLocation,
};
