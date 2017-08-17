/**
 *
 * SearchPage
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';
import elasticlunr from 'elasticlunr';
import SearchList from 'components/SearchList';
import PageContainer from 'components/PageContainer';
import H3 from './H3';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { makeSelectQuery, makeSelectResults, makeSelectResultsError, makeSelectSearchLoading } from './selectors';
import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';
import { actionLoadSearchResults } from './actions';
import LoadingIndicator from 'components/LoadingIndicator';

export class SearchPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  queryEnter(e) {
      const { query, results, error, loadResults } = this.props;

      if (e.target.value.length > 0) {
          loadResults(e.target.value)
      }
      else if (e.target.value.length == 0) {
          loadResults();
      }
  }

  componentWillMount() {

    const { query, results, error, loadResults } = this.props;

    if (results === false && error === false) {
      loadResults();
    }
  }

  render() {
     const { query, results, error, loading, searchLoading } = this.props;

     const searchListProps = {
         loading,
         results,
         error,
     };

    const number = results.length;
    const message = query ? number + " Results for \"" + query + "\"": number + " Results";

    return (
      <PageContainer>

          <div className="col-xs-12 col-md-3">
          <div className="input-group">
              <input type="text" className="form-control" onChange={this.queryEnter.bind(this)} placeholder="Search for..." />
              <span className="input-group-btn">
                  <button className="btn btn-default" type="button">Go!</button>
              </span>
          </div>
          </div>
          <div className="col-xs-12 col-md-9">
              { loading ? ( <LoadingIndicator /> ) : ( <span><H3>{message}</H3> <SearchList {...searchListProps} /> </span>) }
          </div>
      </PageContainer>
    );
  }
}

SearchPage.propTypes = {
  dispatch: PropTypes.func,
  query: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  results: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  searchLoading: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadQuery: PropTypes.func,
  loadResults: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  query: makeSelectQuery(),
  results: makeSelectResults(),
  loading: makeSelectSearchLoading(),
  error: makeSelectResultsError(),
});

function mapDispatchToProps(dispatch) {
  return {
    loadResults: (query) => dispatch(actionLoadSearchResults(query)),
  };
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'search', reducer });
const withSaga = injectSaga({ key: 'search', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(SearchPage);
