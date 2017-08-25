import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom'

class Input extends React.PureComponent {
  render() {
    return  (
      <input {...this.props} />
    );
  }

};

Input.PropTypes = {

}

export default Input;
