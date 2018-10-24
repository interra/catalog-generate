import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function PageItemTag(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  const tags = props.data.value.map((tag) => {

    return (
      <div
        style={{margin: "6px", float: "left", padding: "7px"}}
        className="label label-default"
        key={tag.identifier}>
        {tag.title}
      </div>
    );
  }, '<div></div>');
  return (
    <div style={{margin: "10px -5px"}}>
    {label} {tags}
    </div>
  );
}

PageItemTag.propTypes = {
  item: PropTypes.any,
};

export default PageItemTag;
