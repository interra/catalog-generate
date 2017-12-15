/*
 * CollectionPage
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
import { makeSelectCollection, makeSelectCollectionLoading, makeSelectCollectionError } from './selectors';
import { actionLoadCollection } from './actions';
import PageContainer from 'components/PageContainer';
import Breadcrumb from 'components/Breadcrumb';
import PageItemCard from 'components/PageItemCard';

import reducer from './reducer';
import saga from './saga';
import './index.css';

import H1 from 'components/H1';

export class CollectonPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  componentWillMount() {

    const { collection, error, loading, loadCollection } = this.props;
    const collectionType = 'organization';

    if (collection === false && error === false && loading === false) {
      loadCollection(collectionType);
    }
  }

  render() {
    const { collection, error, loading } = this.props;
    const collectionType = 'organization';

    const data = {
      collection,
      collectionType,
    }
    const collectionProps = {
      label: false,
      data,
      loading,
      error,
    }
    const breadcrumbs = [{
      title: 'Home',
      loc: '/',
      icon: 'home'
    },{
      title: 'Groups',
      loc: '/groups'
    }];
    return (
    <PageContainer>
      <Helmet>
        <title>Groups</title>
        <meta name="description" content="Groups" />
      </Helmet>
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <H1>Groups</H1>
      <PageItemCard {... collectionProps} />
    </PageContainer>
    );
  }
}

CollectonPage.propTypes = {
  dispatch: PropTypes.func,
  collection: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadCollection: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  collection: makeSelectCollection(),
  loading: makeSelectCollectionLoading(),
  error: makeSelectCollectionError(),
});

function mapDispatchToProps(dispatch) {
  return {
    loadCollection: (collectionType) => dispatch(actionLoadCollection(collectionType)),
  };
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'collection', reducer });
const withSaga = injectSaga({ key: 'collection', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(CollectonPage);
