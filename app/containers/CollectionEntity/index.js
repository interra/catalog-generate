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
import { makeSelectSchema, makeSelectCollection, makeSelectBreadcrumb, makeSelectBreadcrumbLoading, makeSelectCollectionName, makeSelectCollectionError } from './selectors';

import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import H1 from 'components/H1';
import PageContainer from 'components/PageContainer';
import PageSection from 'containers/PageSection';
import Breadcrumb from 'components/Breadcrumb';
import messages from './messages';
import { loadRepos } from '../App/actions';
import { actionSetCollectionName, actionLoadCollection, actionLoadBreadcrumb, actionLoadSchema, actionLeaveCollection } from './actions';
import { makeSelectUsername } from './selectors';
import reducer from './reducer';
import saga from './saga';
import Form from "react-jsonschema-form";

export class CollectionEntity extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function

  componentWillUnmount() {
    const { leaveCollection } = this.props;
    leaveCollection();
  }

  componentWillMount() {
    const { doc, schema, loadSchema, loadBreadCrumb, loadCollection, repos, error } = this.props;

    if (doc === false && error === false) {
      const path = window.location.pathname.substr(1);
      loadCollection(path);
      loadBreadCrumb(path);
    }
    if (schema === false) {
      loadSchema();
    }
  }

  componentWillReceiveProps (nextProps) {
    const { leaveCollection, loadCollection, loadSchema, loadBreadCrumb } = this.props;
    if (nextProps.location.pathname !== this.props.location.pathname) {
      leaveCollection();
      loadSchema();
      const path = nextProps.location.pathname.substring(1);
      loadCollection(path);
      loadBreadCrumb(path);
    }
  }

  render() {
    const { schema, loading, error, repos, doc, collectionName, breadcrumbLoading, breadcrumb } = this.props;
    const reposListProps = {
      loading,
      error,
      repos,
    };

    const pageSchema = schema ? schema.pageSchema[collectionName] : false;
    const collectionSchema = schema ? schema.schema[collectionName] : false;
    let title = '';
    if (doc && schema && collectionName) {
      if (collectionName in schema.map) {
        if (Object.values(schema.map[collectionName]).indexOf('title') !== -1) {
          const titleName = Object.keys(schema.map[collectionName])[Object.values(schema.map[collectionName]).indexOf('title')];
          title = doc[titleName];
        } else {
          title = doc.title;
        }
      } else {
        title = doc.title;
      }
    }

    let left = <div></div>;
    let centerCol = 12;
    if (pageSchema && Object.keys(pageSchema).indexOf('Left') !== -1) {
      left = <div className="col-sm-3"><PageSection type="Left" pageSchema={pageSchema} schema={collectionSchema} doc={doc} /></div>;
      centerCol = 9;
    }

    return (
      <PageContainer>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <Breadcrumb loading={breadcrumbLoading} breadcrumbs={breadcrumb}/>
        <div className="row">
          {left}
          <div className={`col-sm-${centerCol}`}>
            <H1>{title}</H1>
            <PageSection type="Main" pageSchema={pageSchema} schema={collectionSchema} doc={doc} />
            <PageSection type="Table" pageSchema={pageSchema} schema={collectionSchema} doc={doc} />
          </div>
        </div>
      </PageContainer>
    );
  }
}

CollectionEntity.propTypes = {
  collectionName: PropTypes.string,
  doc: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  breadcrumb: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  breadcrumbLoading: PropTypes.bool,
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
  path: PropTypes.string,
  repos: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadCollection: PropTypes.func,
  loadSchema: PropTypes.func,
  loadBreadCrumb: PropTypes.func,
  leaveCollection: PropTypes.func,
};

export function mapDispatchToProps(dispatch) {
  return {
    loadCollection: (path) => dispatch(actionLoadCollection(path)),
    loadBreadCrumb: (path) => dispatch(actionLoadBreadcrumb(path)),
    loadSchema: () => dispatch(actionLoadSchema()),
    leaveCollection: () => dispatch(actionLeaveCollection()),
    setCollectionName: () => dispatch(actionSetCollectionName()),
  };
}

const mapStateToProps = createStructuredSelector({
  doc: makeSelectCollection(),
  collectionName: makeSelectCollectionName(),
  schema: makeSelectSchema(),
  loading: makeSelectLoading(),
  breadcrumbLoading: makeSelectBreadcrumbLoading(),
  error: makeSelectCollectionError(),
  breadcrumb: makeSelectBreadcrumb(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'collections', reducer });
const withSaga = injectSaga({ key: 'colllections', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(CollectionEntity);
