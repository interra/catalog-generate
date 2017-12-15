import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function SectionTypeTitle(props) {
  return (
    <div>{props}</div>
  );
}

SectionTypeTitle.propTypes = {
  item: PropTypes.any,
};

export default SectionTypeTitle;
