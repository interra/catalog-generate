import { createSelector } from 'reselect';

/**
 * Direct selector to the searchPage state domain
 */
const selectSearchPageDomain = () => (state) => state.get('search');

const makeSelectQuery = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('query')
);

const makeSelectResults = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('results')
)

const makeSelectSearchLoading = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('loading')
)

const makeSelectResultsError = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('error')
);;

export {
  selectSearchPageDomain,
  makeSelectQuery,
  makeSelectResults,
  makeSelectResultsError,
  makeSelectSearchLoading,
};
