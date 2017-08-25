/**
 * RepoListItem
 *
 * Lists the name and the issue count of a repository
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import StyledLink from './StyledLink';
import ListItem from 'components/ListItem';
import Wrapper from './Wrapper';

export class HomeListItem extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const item = this.props.item;

    // Put together the content of the repository
    const content = (
      <StyledLink to={`dataset/${item.ref}`}>
        { item.doc.title }
      </StyledLink>
    );

    const Listy = (props) => {
      return (<li key={props.itemKey}>
        {props.item}
      </li>);
    }

    // Render the content into a list item
    return (
      <Listy itemKey={`repo-list-item-${item.ref}`} item={content} />
    );
  }
}

HomeListItem.propTypes = {
  item: PropTypes.object,
};

export default connect()(HomeListItem);
