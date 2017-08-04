/**
 *
 * CollectionPage
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';

import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import makeSelectCollections from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';
import H2 from 'components/H2';

export class CollectionPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  componentWillMount() {
      console.log('wtf');
    const { collection, loadCollection, repos, error } = this.props;
    if (collection === false && error === false) {
      //loadCollection('dataset/httpsdatamedicaregovapiviewst6ug-wt53');
    }
  }


    // Since state and props are static,
    // there's no need to re-render this component
    shouldComponentUpdate() {
      return false;
    }

    render() {
      console.log(this);
      return (
        <div>
          <Helmet>
            <title>X Page</title>
            <meta name="description" content="Feature page of React.js Boilerplate application" />
          </Helmet>
            <H2>
              { this.props.location.pathname }
            </H2>
          </div>
        );
      }
}

CollectionPage.propTypes = {
  loading: PropTypes.bool,
  loadCollection: PropTypes.func,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  collection: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ])
};

export function mapDispatchToProps(dispatch) {
  return {
    loadCollection: (collection) => dispatch(actionLoadCollection(collection))
  };
}

const mapStateToProps = createStructuredSelector({
  collection: makeSelectCollections(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'collection', reducer });
const withSaga = injectSaga({ key: 'collection', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(CollectionPage);
