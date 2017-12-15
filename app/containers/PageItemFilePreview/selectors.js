import { createSelector } from 'reselect';

/**
 * Direct selector to the searchPage state domain
 */
const selectPageDomain = () => (state) => state.get('fileData');

const makeSelectFile = () => createSelector(
  selectPageDomain(),
  (substate) => substate.get('fileData')
);

const makeSelectLoading = () => createSelector(
  selectPageDomain(),
  (substate) => substate.get('loading')
);

const makeSelectError = () => createSelector(
  selectPageDomain(),
  (substate) => substate.get('error')
);

export {
  makeSelectFile,
  makeSelectLoading,
  makeSelectError,
};
