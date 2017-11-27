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
        const format = dist.format === undefined ? '' : dist.format.toLowerCase();
        return <div title={`format: ${dist.format}`} key={`dist-id-${dist.identifier}-${i}`} style={{float: "left"}} className="label" data-format={format}>{format}</div>
      })
    }
  }
  themes(themes) {
    if (!themes) {
      return null;
    }
    else {
      let i = 0;
      return themes.map(function(theme) {
        i++
        return <div title={`theme: ${theme.title}`} key={`dist-id-${theme.identifier}-${i}`} style={{fontSize:"1.4em", color: "#555", marginTop: "-5px", paddingLeft: "5px", float:"left"}} className={`font-icon-select-1 font-icon-select-1-${theme.icon}`}></div>
      })
    }
  }

  render() {

    const item = this.props.item;
    const description = excerpts(item.doc.description, {words: 35});
    const formats = this.formats(item.doc.distribution);
    const themes = this.themes(item.doc.theme);

    // Put together the content of the repository
    const content = (
      <Wrapper>
        <Link to={`dataset/${item.doc.interra.id}`} style={{fontSize: "1.2em"}}>
          { item.doc.title }
        </Link>
        <div style={{paddingTop: "20px"}} className="row">
          <div className="col-md-12" style={{textAlign: "right"}}>
          {formats} {themes}
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
