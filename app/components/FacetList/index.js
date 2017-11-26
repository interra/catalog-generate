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


function FacetBlocks({ title, items, facetKey, loading, click, selectedFacets }) {
    if (loading) {
      return <FacetBlockDiv><h4>{title}</h4><List component={LoadingIndicator} /></FacetBlockDiv>;
    }
    let content = (<ul></ul>);

    content = items[facetKey].map(function callback(facet, i) {
      const name = facet[0];
      var value = "(" + facet[1] + ")";
      let active = false;
      if (selectedFacets) {
        selectedFacets.forEach(function(facet) {
          if (facetKey == facet[0] && name == facet[1]) {
            active = 'active';
            value = ""
          }
        });
      }
      return <LI key={`facet-${i}`}><StyledA data-facet-type={facetKey} className={active} onClick={click} href={`#facet-${title}-${name}`}>{name} {value}</StyledA></LI>
    });

    return <FacetBlockDiv><h4>{title}</h4><ul className="list-group" key="items">{content}</ul></FacetBlockDiv>;

}


function FacetList({ facets, loadingFacets, loadingFacetsResults, selectedFacets, facetsResults, facetClick }) {

  let content = (<div></div>);

  if (loadingFacets) {
      return <List component={LoadingIndicator} />;
  }

  if (facets !== false) {
    let items = [];
    for (var facet in facets) {
      items.push(facet);
    }
    content = items.map((item) => (
      <FacetBlocks title={facets[item].label} key={item} facetKey={item} selectedFacets={selectedFacets} items={facetsResults} click={facetClick} loading={loadingFacetsResults} />
    ));

    return <div key="facets">{content}</div>;
  }

  return null;
}

FacetList.propTypes = {
  facets: PropTypes.any,
  facetsLoading: PropTypes.any,
};

export default FacetList;
