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
import FacetList from 'components/FacetList';

import PageContainer from 'components/PageContainer';
import InputGroup from './InputGroup';
import FormGroup from './FormGroup';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { makeSelectQuery, makeSelectResults, makeSelectResultsCount, makeSelectResultsError, makeSelectSearchLoading, makeSelectSort, makeSelectFacets, makeSelectFacetsLoading, makeSelectFacetsResults, makeSelectFacetsResultsLoading } from './selectors';
import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';
import { actionLoadSearchResults, actionUpdateSort, actionLoadFacets } from './actions';
import LoadingIndicator from 'components/LoadingIndicator';

export class SearchPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  queryEnter(e) {
      const { loadResults } = this.props;

      if (e.target.value.length > 0) {
          loadResults(e.target.value)
      }
      else if (e.target.value.length == 0) {
          loadResults();
      }
  }

  relevanceUpdate(e) {
    const { setSort } = this.props;

    setSort(e.target.value);

  }

  componentWillMount() {
    console.log("mounting");

    const { query, results, error, loadResults, loadFacets } = this.props;

    if (results === false && error === false) {
      loadFacets();
      loadResults();
    }

  }

  render() {
    const { query, results, resultsCount, error, loading, facets, loadFacets, loadingFacets, facetsResults, loadingFacetsResults } = this.props;

//    const number = results.length;
    console.log(resultsCount);
    const resultmessage = query  && resultsCount  ? resultsCount + " Results for \"" + query + "\"": resultsCount + " Results";

     const searchListProps = {
         loading,
         results,
         error,
         resultmessage,
     };

     const facetListProps = {
         loadingFacets,
         facets,
         loadingFacetsResults,
         facetsResults,
     };

    return (
      <PageContainer>
        <div className="col-xs-12 col-md-3">
          <InputGroup>
              <input type="text" className="form-control" onChange={this.queryEnter.bind(this)} placeholder="Search for..." />
              <span className="input-group-btn">
                  <button className="btn btn-default" type="button">Go!</button>
              </span>
          </InputGroup>
          <FormGroup>
            <span className="col-sm-2 control-label" style={{fontSize: '.75em', padding: '5px 0'}}>Sort by:</span>
            <div className="col-sm-10">
              <select className="form-control input-sm" onChange={this.relevanceUpdate.bind(this)}>
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </FormGroup>
          <FacetList {...facetListProps} />
        </div>
        <div className="col-xs-12 col-md-9">
            <SearchList {...searchListProps} />
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
  sort: PropTypes.string,
  results: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  resultsCount: PropTypes.oneOfType([
    PropTypes.integer,
    PropTypes.bool,
  ]),
  loadingFacetsResults: PropTypes.bool,
  loadingFacets: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  facets: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  facetsResults: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadQuery: PropTypes.func,
  loadResults: PropTypes.func,
  loadFacets: PropTypes.func,
  setSort: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  query: makeSelectQuery(),
  results: makeSelectResults(),
  loading: makeSelectSearchLoading(),
  loadingFacets: makeSelectFacetsLoading(),
  facetsResults: makeSelectFacetsResults(),
  loadingFacetsResults: makeSelectFacetsResultsLoading(),
  error: makeSelectResultsError(),
  sort: makeSelectSort(),
  facets: makeSelectFacets(),
  resultsCount: makeSelectResultsCount(),
});

function mapDispatchToProps(dispatch) {
  return {
    loadResults: (query) => dispatch(actionLoadSearchResults(query)),
    loadFacets: () => dispatch(actionLoadFacets()),
    setSort: (query) => dispatch(actionUpdateSort(query)),
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
