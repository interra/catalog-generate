import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function PageItemString(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  return (
    <div>
    {label} {props.data.value}
    </div>
  );
}

PageItemString.propTypes = {
  item: PropTypes.any,
};

export default PageItemString;
