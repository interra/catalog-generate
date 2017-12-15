import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function SectionTypeLeft(props) {
  return (
    <div>
      {Object.keys(props).map((prop, index) => {
        return props[index]
      })}
    </div>
  );
}

SectionTypeLeft.propTypes = {
  item: PropTypes.any,
};

export default SectionTypeLeft;
