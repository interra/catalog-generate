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

export class HomePageIconListItem extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function

  render() {
   const item = this.props.item;
   const columnWidth = this.props.columnWidth;
   console.log(this.props);

    // Put together the content of the repository
    const content = (
      <a href="">
      <span className={`font-icon-select-1 font-icon-select-1-${item.icon}`}></span>
      <span style={{display:"block"}}>{item.title}</span>
      </a>
    );

    // Render the content into a list item
    return (
      <li key={item.ref} className={`col-xs-12 col-sm-6 col-md-${item.columnWidth}`}>{content}</li>
    );
  }
}

HomePageIconListItem.propTypes = {
  item: PropTypes.object,
};

export default connect()(HomePageIconListItem);
