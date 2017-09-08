/*
 * SwaggerPage
 *
 * List all the features
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { makeSelectSwagger, makeSelectSwaggerLoading, makeSelectSwaggerError } from './selectors';
import reducer from './reducer';
import saga from './saga';
import { actionLoadSwagger } from './actions';
import SwaggerUI from './Swagger';
import './index.css';

import H1 from 'components/H1';

export class SwaggerPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  componentWillMount() {

    const { swagger, error, loading, loadSwagger } = this.props;

    if (swagger === false && error === false && loading === false) {
      loadSwagger();
    }
  }

  render() {
    const { swagger, error, loading } = this.props;

    const swaggerProps = {
      swagger,
      loading,
      error,
    }

    return (
      <div style={{padding: "20px 50px"}}>
        <Helmet>
          <title>API</title>
          <meta name="description" content="API" />
        </Helmet>
        <H1>API</H1>
        <p>The following is a <a href="http://swagger.io">swagger</a> rendered defintion of the Interra API.</p>

        <SwaggerUI {...swaggerProps} />

      </div>
    );
  }
}

SwaggerPage.propTypes = {
  dispatch: PropTypes.func,
  swagger: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadSwagger: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  swagger: makeSelectSwagger(),
  loading: makeSelectSwaggerLoading(),
  error: makeSelectSwaggerError(),
});

function mapDispatchToProps(dispatch) {
  return {
    loadSwagger: () => dispatch(actionLoadSwagger()),
  };
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'api', reducer });
const withSaga = injectSaga({ key: 'api', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(SwaggerPage);
