import React from 'react';
import { shallow } from 'enzyme';

import PageContainer from '../index';

describe('<PageContainer />', () => {
  it('should render a prop', () => {
    const id = 'testId';
    const renderedComponent = shallow(
      <PageContainer id={id} />
    );
    expect(renderedComponent.prop('id')).toEqual(id);
  });

  it('should render its text', () => {
    const children = 'Text';
    const renderedComponent = shallow(
      <PageContainer>{children}</PageContainer>
    );
    expect(renderedComponent.contains(children)).toBe(true);
  });
});
