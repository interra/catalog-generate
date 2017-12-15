import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function PageItemImage(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  const float = props.data.def.float;
  return (
    <div className={`media-${float}`}>
    {label} <img src={props.data.value} />
    </div>
  );
}

PageItemImage.propTypes = {
  item: PropTypes.any,
};

export default PageItemImage;
