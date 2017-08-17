/*
 * CollectionEntity
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import { makeSelectSchema, makeSelectCollection, makeSelectCollectionName, makeSelectCollectionError } from './selectors';

import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import H1 from 'components/H1';
import PageContainer from 'components/PageContainer';
import ReposList from 'components/ReposList';
import messages from './messages';
import { loadRepos } from '../App/actions';
import { actionLoadCollection, actionLoadSchema, actionLeaveCollection } from './actions';
import { makeSelectUsername } from './selectors';
import reducer from './reducer';
import saga from './saga';
import Form from "react-jsonschema-form";

export class CollectionEntity extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  /**
   * when initial state username is not null, submit the form to load repos
   */
  componentDidMount() {

  }
  componentWillUnmount() {

      const { leaveCollection } = this.props;

      leaveCollection();
  }

   componentWillMount() {

     const { collection, schema, loadSchema, loadCollection, repos, error } = this.props;

     if (collection === false && error === false) {
         // TODO: get from router.
         loadCollection(window.location.pathname.substr(1));
     }
     if (schema === false) {
        loadSchema();
     }
   }



  render() {
    const { loading, error, repos, collection } = this.props;
    const reposListProps = {
      loading,
      error,
      repos,
    };
    let formData = this.props.collection ? this.props.collection : null;
    let schema = this.props.schema ? this.props.schema.schema.dataset : null;
    let button = null;
    if (schema && formData) {

      button = <Form schema={schema}
            formData={formData} />;
    } else {
      button = "";
    }


    return (
      <PageContainer>
          <H1>{this.props.collection.title}</H1>
          {this.props.collectionName}

          {button}

          This is not the end.
      </PageContainer>
    );
  }
}

CollectionEntity.propTypes = {
  collectionName: PropTypes.string,
  collection: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  formData: PropTypes.object,
  schema: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  repos: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadCollection: PropTypes.func,
  loadSchema: PropTypes.func,
  leaveCollection: PropTypes.func,
};

export function mapDispatchToProps(dispatch) {
  return {
    loadCollection: (collectionName) => dispatch(actionLoadCollection(collectionName)),
    loadSchema: () => dispatch(actionLoadSchema()),
    leaveCollection: () => dispatch(actionLeaveCollection()),
  };
}

const mapStateToProps = createStructuredSelector({
  collection: makeSelectCollection(),
  collectionName: makeSelectCollectionName(),
  schema: makeSelectSchema(),
  loading: makeSelectLoading(),
  error: makeSelectCollectionError(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'collections', reducer });
const withSaga = injectSaga({ key: 'colllections', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(CollectionEntity);
