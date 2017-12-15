import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import { Link } from 'react-router-dom';


function PageItemResource(props) {
  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  const resources = props.data.value.map((resource, i) => {
    return (
      <div
        key={i}>
          <li style={{display: "block", position: "relative", minHeight: "60px", paddingLeft: "45px"}}>
            <div>
              <Link className='heading' title={`${resource.format}`} to={`/distribution/${resource.interra.id}`}>
                {resource.title}
                <span
                  data-toggle='tooltip'
                  data-placement='top'
                  data-original-title={resource.format}
                  data-format={resource.format}
                  className='format-label'
                  >
                  {resource.format}
                </span>
              </Link>
            </div>
          </li>
      </div>)
  }, '<div></div>');
  return (
    <div style={{padding: "15px 0 0 0", clear: "both"}}>
      <h3>Data and Resources</h3>
      {label}
      <ul style={{padding: "0", margin: "0"}}>
        {resources}
      </ul>
    </div>
  );
}

PageItemResource.propTypes = {
  item: PropTypes.any,
  field: PropTypes.any,
};

export default PageItemResource;
