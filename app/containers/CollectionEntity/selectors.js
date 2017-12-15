/**
 * Homepage selectors
 */

import { createSelector } from 'reselect';

const selectCol = (state) => { return state.get('collections')};


const makeSelectCollection = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('doc')}
);

const makeSelectSiteMap = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('sitemap')}
);

const makeSelectBreadcrumb = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('breadcrumb')}
);

const makeSelectBreadcrumbLoading = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('breadcrumbLoading')}
);

const makeSelectCollectionError = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('error')}
);

const makeSelectSchema = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('schema')}
);

const makeSelectCollectionName = () => createSelector(
  selectCol,
  (collectionState) => { return collectionState.get('collectionName')}
);


export {
  selectCol,
  makeSelectCollectionError,
  makeSelectCollectionName,
  makeSelectCollection,
  makeSelectSchema,
  makeSelectSiteMap,
  makeSelectBreadcrumb,
  makeSelectBreadcrumbLoading,
};
