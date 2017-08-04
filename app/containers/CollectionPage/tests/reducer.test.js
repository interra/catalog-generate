
import { fromJS } from 'immutable';
import collectionPageReducer from '../reducer';

describe('collectionPageReducer', () => {
  it('returns the initial state', () => {
    expect(collectionPageReducer(undefined, {})).toEqual(fromJS({}));
  });
});
