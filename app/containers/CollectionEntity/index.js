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
import { makeSelectSchema, makeSelectCollection, makeSelectCollectionName } from './selectors';

import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import H2 from 'components/H2';
import ReposList from 'components/ReposList';
import messages from './messages';
import { loadRepos } from '../App/actions';
import { actionLoadCollection, actionLoadSchema } from './actions';
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

   componentWillMount() {

     const { collection, schema, loadSchema, loadCollection, repos, error } = this.props;

     if (collection === false && error === false) {
         loadCollection('dataset/httpsdatamedicaregovapiviewst6ug-wt53');
     }
     if (schema === false) {
        loadSchema();
     }
   }



  render() {
      console.log(this);
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
      <article>
          <H2>{this.props.collection.title}</H2>
          {this.props.collectionName}

{button}

          This is not the end.
      </article>
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
  loadCollection: PropTypes.func,
  loadSchema: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  repos: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
};

export function mapDispatchToProps(dispatch) {
  return {
    loadCollection: (collectionName) => dispatch(actionLoadCollection(collectionName)),
    loadSchema: () => dispatch(actionLoadSchema()),
  };
}

const mapStateToProps = createStructuredSelector({
  collection: makeSelectCollection(),
  collectionName: makeSelectCollectionName(),
  schema: makeSelectSchema(),
  //repos: makeSelectRepos(),
//  username: makeSelectUsername(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'collections', reducer });
const withSaga = injectSaga({ key: 'colllections', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(CollectionEntity);
