import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function PageItemTheme(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  const themes = props.data.value.map((theme, i) => {
    const icon = theme.icon ? theme.icon : 'cog';
    return (
      <div key={`item-${i}`} style={{float:"left", paddingRight: "15px"}}>
        <span title={`theme: ${theme.title}`} key={`dist-id-${theme.identifier}-${i}`}
          style={{fontSize:"1.2em", paddingRight: "5px", float:"left"}}
          className={`font-icon-select-1 font-icon-select-1-${icon}`}></span>
        <span key={`theme-${theme.title}`} style={{float: "left", marginTop:"1px"}}>{theme.title}</span></div>)
  });
  return (
    <div style={{clear: "both", display: "inline-block", padding: "10px 0 0"}}>
      {label} {themes}
    </div>
  );
}

PageItemTheme.propTypes = {
  item: PropTypes.any,
};

export default PageItemTheme;
