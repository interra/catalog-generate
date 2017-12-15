

import React, { Children } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import A from './A';
import StyledButton from './StyledButton';
import Wrapper from './Wrapper';

function Breadcrumb(props) {

  let items = (<li></li>);

  if (!props.loading && props.breadcrumbs) {
    items = props.breadcrumbs.map((breadcrumb, i) => {
      let text = '';
      if (breadcrumb.icon) {
        text = <span className={`glyphicon glyphicon-${breadcrumb.icon}`}></span>;
      } else {
        text = `${breadcrumb.title}`;
      }
      let link = '';
      if (i === props.breadcrumbs.length - 1) {
        link = text
      } else {
        link = <Link to={breadcrumb.loc}>{text}</Link>;
      }
      return (<li key={breadcrumb.title}>{link}</li>)
    });

  }


  return (
    <ul className="breadcrumb" style={{backgroundColor: "inherit"}}>
      {items}
    </ul>
  );
}

Breadcrumb.propTypes = {
  loading: PropTypes.bool,
  breadcrumbs: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
};

export default Breadcrumb;
