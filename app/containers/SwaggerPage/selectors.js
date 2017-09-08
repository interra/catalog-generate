import { createSelector } from 'reselect';

/**
 * Direct selector to the searchPage state domain
 */
const selectSwaggerPageDomain = () => (state) => state.get('api');

const makeSelectSwagger = () => createSelector(
  selectSwaggerPageDomain(),
  (substate) => substate.get('swagger')
);

const makeSelectSwaggerLoading = () => createSelector(
  selectSwaggerPageDomain(),
  (substate) => substate.get('loading')
);

const makeSelectSwaggerError = () => createSelector(
  selectSwaggerPageDomain(),
  (substate) => substate.get('error')
);

export {
  makeSelectSwagger,
  makeSelectSwaggerLoading,
  makeSelectSwaggerError,
};
