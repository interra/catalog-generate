import { createSelector } from 'reselect';

/**
 * Direct selector to the searchPage state domain
 */
const selectSearchPageDomain = () => (state) => state.get('search');

const makeSelectQuery = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('query')
);

const makeSelectFacets = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('facets')
);

const makeSelectFacetsLoading = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('loadingFacets')
);

const makeSelectResultsCount = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('resultsCount')
);

const makeSelectFacetsResults = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('facetsResults')
);

const makeSelectFacetsResultsLoading = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('loadingFacetsResults')
);

const makeSelectSort = () => createSelector(
  selectSearchPageDomain(),
  (substate) => substate.get('sort')
)

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
  makeSelectSort,
  makeSelectFacets,
  makeSelectFacetsLoading,
  makeSelectFacetsResults,
  makeSelectFacetsResultsLoading,
  makeSelectQuery,
  makeSelectResults,
  makeSelectResultsCount,
  makeSelectResultsError,
  makeSelectSearchLoading,
};
