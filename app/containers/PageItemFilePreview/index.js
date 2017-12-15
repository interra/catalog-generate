/*
 * FilePreviewWidget
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
import { makeSelectFile, makeSelectLoading, makeSelectError } from './selectors';
import { actionLoadFile, actionLeave } from './actions';
import PageContainer from 'components/PageContainer';
import Breadcrumb from 'components/Breadcrumb';
import PageItemCard from 'components/PageItemCard';
import ReactTable from 'react-table';
import reducer from './reducer';
import saga from './saga';
import './index.css';
import 'react-table/react-table.css';
import LoadingIndicator from 'components/LoadingIndicator';

import H1 from 'components/H1';

export class PageItemFilePreview extends React.Component { // eslint-disable-line react/prefer-stateless-function

  componentWillUnmount() {
    const { leave } = this.props;
    leave();
  }

  getFieldvalues(fields, doc) {
    return fields.reduce((acc, field) => {
      if (field in doc) {
        acc = doc[field];
        return acc;
      } else {
        return acc;
      }
    }, null);
  }

  componentWillMount() {
    const { fileData, data, error, loading, loadFile } = this.props;
    const file = this.getFieldvalues(data.def.fields, data.doc);
    if (fileData === false && error === false && loading === false) {
      loadFile(file);
    }
  }

  render() {
    const { fileData, error, loading, load, file } = this.props;
    let content = <div></div>;
    if (loading) {
      content = <LoadingIndicator />;
    } else if (error || !fileData) {
      content = <div className="alert alert-info">File preview could not be displayed</div>;
    } else {
      console.log(fileData);
      const cols = Object.keys(fileData[0]).map((key) => {
        key = key ? key : ' ';
        return {
          Header: key,
          accessor: key,
        }
      });
      const num = fileData.length < 10 ? fileData.length : 10;
      content =  <ReactTable
        data={fileData}
        defaultPageSize={num}
        columns={cols} />;
    }
    return (
      <div style={{margin: "30px 0 30px 0"}}>
        <h3 style={{paddingBottom: "10px"}}>Data Preview</h3>
        {content}
      </div>
    );

  }
}

PageItemFilePreview.propTypes = {
  dispatch: PropTypes.func,
  file: PropTypes.string,
  fileData: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadFile: PropTypes.func,
  leave: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  fileData: makeSelectFile(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
});

function mapDispatchToProps(dispatch) {
  return {
    loadFile: (file) => dispatch(actionLoadFile(file)),
    leave: () => dispatch(actionLeave()),
  };
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'fileData', reducer });
const withSaga = injectSaga({ key: 'fileData', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(PageItemFilePreview);
