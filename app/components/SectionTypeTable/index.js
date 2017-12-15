import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function SectionTypeTable(props) {
  const rows = Object.keys(props).map((prop, index) => {
    if (props[index]) {
      return (<tr key={props[index].props.labelValue}><td>{props[index].props.labelValue}</td><td>{props[index].props.data.value}</td></tr>);
    } else {
      return null;
    }
  });
  if (rows.length) {
    return (
      <div style={{clear: "both", padding: "5px 0"}}>
        <h3>Additional Information</h3>
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  } else {
    return (<span></span>);
  }
}

SectionTypeTable.propTypes = {
  item: PropTypes.any,
};

export default SectionTypeTable;
