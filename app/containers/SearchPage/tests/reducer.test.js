
import { fromJS } from 'immutable';
import searchPageReducer from '../reducer';

describe('searchPageReducer', () => {
  it('returns the initial state', () => {
    expect(searchPageReducer(undefined, {})).toEqual(fromJS({}));
  });
});
