import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import { Parser } from 'html-to-react';

function PageItemText(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  const parser = new Parser();
  const text = props.data.value ?  parser.parse(props.data.value) : '';

  return (
    <div className="media-body" style={{clear: "both", lineHeight: "1.8em"}}>
    {label} {text}
    </div>
  );
}

PageItemText.propTypes = {
  item: PropTypes.any,
};

export default PageItemText;
