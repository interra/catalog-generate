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

  formats(distributions) {
    if (!distributions) {
      return null;
    }
    else {
      let i = 0;
      return distributions.map(function(dist) {
        i++
        return <span key={`dist-id-${dist.identifier}-${i}`} className="label" data-format={dist.format}>{dist.format}</span>
      })
    }
  }

  render() {

    const item = this.props.item;

    const description = excerpts(item.doc.description,{words: 35});
    const formats = this.formats(item.doc.distribution);

    // Put together the content of the repository
    const content = (
      <Wrapper>
        <Link to={`dataset/${item.ref}`} style={{fontSize: "1.2em"}}>
          { item.doc.title }
        </Link>
        <div className="row">
          <div className="col-md-12">
            <span style={{fontSize: ".9em"}}> {item.doc.theme}</span>
          </div>
          <div className="col-md-12" style={{textAlign: "right"}}>
            {formats}
          </div>
        </div>
        <div className="row" style={{fontSize: ".9em", padding: "5px 0px"}}>
          <div className="col-md-12" style={{padding: "10px 15px"}}>
            {description}
          </div>
          <div className="col-md-12"  style={{fontSize: ".9em", color: "#555"}}>
            <label>modified:</label> {item.doc.modified}
          </div>
          <div className="col-md-12"  style={{fontSize: ".9em", color: "#555"}}>
            <label>organization:</label> {item.doc.publisher.name}
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
