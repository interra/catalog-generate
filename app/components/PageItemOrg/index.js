import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import { Link } from 'react-router-dom';


function PageItemOrg(props) {
  const name = props.data.value.name;
  const image = props.data.value.image ? <img alt={name} src={props.data.value.image} /> : '';
  const description = props.data.value.description;
  const link = `/organization/${props.data.value.interra.id}`;

  return (
    <div style={{borderRadius: "5px",
    border: "1px solid #ddd",
    marginBottom: "20px",
    padding: "15px 20px"}}>
      <div style={{textAlign: "center", padding: "15px 0"}}>{image}</div>
      <h3><Link to={link}>{name}</Link></h3>
      {description}
    </div>
  );
}

PageItemOrg.propTypes = {
  item: PropTypes.any,
  field: PropTypes.any,
};

export default PageItemOrg;
