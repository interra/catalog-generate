import React from 'react';
import PropTypes from 'prop-types';

import List from 'components/List';
import ListItem from 'components/ListItem';
import LoadingIndicator from 'components/LoadingIndicator';
import SearchListItem from 'containers/SearchListItem';
import H3 from './H3';
import LI from './LI';
import StyledA from './StyledA';

import FacetBlockDiv from './FacetBlockDiv';


function FacetBlocks({ title, items, loading }) {
//    console.log(title);
//    console.log(items);
//    console.log(loading);
    if (loading) {
      return <FacetBlockDiv><h4>{title}</h4><List component={LoadingIndicator} /></FacetBlockDiv>;
    }
    let content = (<ul></ul>);
    console.log(items);
    console.log(items[title]);
    content = Object.entries(items[title]).map(function callback(facet, i) {
      const name = facet[0];
      const value = facet[1];
      return <LI key={`facet-${i}`}><StyledA href={`#facet-${title}-${name}`}>{name} ({value})</StyledA></LI>
    });

    return <FacetBlockDiv><h4>{title}</h4><ul className="list-group" key="items">{content}</ul></FacetBlockDiv>;

}


function FacetList({ facets, loadingFacets, loadingFacetsResults, facetsResults }) {
  console.log("loadingFacets", loadingFacets);
  console.log("facets", facets);
  console.log("loadingFacetsResults", loadingFacetsResults);
  console.log("facetsResults", facetsResults);
  console.log(".....");

  let content = (<div></div>);

  if (loadingFacets) {
      return <List component={LoadingIndicator} />;
  }

  if (facets !== false) {
//    console.log(facets);
    content = facets.map((item) => (
        <FacetBlocks title={item} key={item} items={facetsResults} loading={loadingFacetsResults} />
    ));
//    console.log(content);
    return <div key="wtf">{content}</div>;
    return <div>wow</div>;

  }

  return null;
}

FacetList.propTypes = {
  facets: PropTypes.any,
  facetsLoading: PropTypes.any,
};

export default FacetList;
