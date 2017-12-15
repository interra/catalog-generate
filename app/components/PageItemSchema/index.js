import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';

function PageItemSchema(props) {
  if ('fields' in props.data.value) {
    const rows = Object.values(props.data.value.fields).map((field) => {
      const name = 'name' in field ? field.name : '';
      const type = 'name' in field ? field.type : '';
      const desc = 'name' in field ? field.description : '';

      return <tr key={name}><td>{field.name}</td><td>{type}</td><td>{desc}</td></tr>;
    });
    return (
      <div style={{clear: "both", padding: "5px 0"}}>
        <h3>Schema</h3>
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Format</th>
              <th>Description</th>

            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  } else {
    return (
      <div></div>
    );
  }
}

export default PageItemSchema;
