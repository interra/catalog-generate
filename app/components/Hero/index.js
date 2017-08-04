import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import messages from './messages';

class Hero extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
    <div className="jumbotron">
      <h1 className="display-3">Welcome to X</h1>
      <p className="lead">This is a new thing.</p>
      <hr className="my-4"/>
      <p className="lead">
        <Link className="btn btn-primary btn-lg" to="/about" role="button">Learn more</Link>
      </p>
    </div>
    );
  }
}

export default Hero;
