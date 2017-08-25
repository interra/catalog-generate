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

export class SearchListItem extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const item = this.props.item;

    // Put together the content of the repository
    const content = (
      <Wrapper>
        <Link to={`dataset/${item.ref}`}>
          { item.doc.title }
        </Link>
      </Wrapper>
    );

    // Render the content into a list item
    return (
      <ListItem key={`repo-list-item-${item.ref}`} item={content} />
    );
  }
}

SearchListItem.propTypes = {
  item: PropTypes.object,
};

export default connect()(SearchListItem);
