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
import excerpts from 'excerpts';

export class SearchListItem extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {

    const item = this.props.item;

    const description = excerpts(item.doc.description,{words: 35});


    // Put together the content of the repository
    const content = (
      <Wrapper>
        <Link to={`dataset/${item.ref}`} style={{fontSize: "1.2em"}}>
          { item.doc.title }
        </Link>
        <div className="row" style={{fontSize: ".8em", color: "#555"}}>
          <div className="col-md-6">
            <span style={{fontSize: "1.2em"}}> {item.doc.theme}</span>
          </div>
          <div className="col-md-6">
            modified: {item.doc.modified}
          </div>
        </div>
        <div className="row" style={{fontSize: ".9em", padding: "10px 0"}}>
          <div className="col-md-12">
            {description}
          </div>
        </div>
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
