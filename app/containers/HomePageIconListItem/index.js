/**
 * RepoListItem
 *
 * Lists the name and the issue count of a repository
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ListItem from 'components/ListItem';
import Wrapper from './Wrapper';
import StyledLink from './StyledLink';

export class HomePageIconListItem extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function

  render() {
   const item = this.props.item;
   const columnWidth = item.columnWidth;
   const click = item.click;

    // Put together the content of the repository
    const content = (
      <StyledLink to="search" onClick={click}>
        <div data-facet-name={item.title} className={`font-icon-select-1 font-icon-select-1-${item.icon}`}></div>
        <div data-facet-name={item.title}>{item.title}</div>
      </StyledLink>
    );

    // Render the content into a list item
    return (
      <Wrapper key={item.ref} className={`col-xs-12 col-sm-6 col-md-${item.columnWidth}`}>{content}</Wrapper>
    );
  }
}

HomePageIconListItem.propTypes = {
  item: PropTypes.object,
};

export default connect()(HomePageIconListItem);
