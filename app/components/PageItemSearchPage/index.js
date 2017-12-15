import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import SearchPage from 'containers/SearchPage';


function PageItemSearchPage(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  const collection = props.data.def.collection;
  const item = props.data.doc[props.data.def.arg];
  const selectedFacets = [[collection, item]];
  return (
    <div style={{margin: "50px 0"}}>
    {label}
    <SearchPage passedFacets={selectedFacets} />
    </div>
  );
}

PageItemSearchPage.propTypes = {
  item: PropTypes.any,
};

export default PageItemSearchPage;
