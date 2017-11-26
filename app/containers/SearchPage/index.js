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
import { makeSelectIndex, makeSelectQuery, makeSelectResults, makeSelectResultsCount, makeSelectResultsError, makeSelectSearchLoading, makeSelectSort, makeSelectFacets, makeSelectSelectedFacets, makeSelectFacetsLoading, makeSelectFacetsResults, makeSelectFacetsResultsLoading } from './selectors';
import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';
import { actionClearResults, actionLoadSearchResults, actionUpdateSort, actionLoadFacets, actionUpdateFacets } from './actions';
import LoadingIndicator from 'components/LoadingIndicator';

export class SearchPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  queryEnter(e) {
      const { loadResults, selectedFacets } = this.props;

      if (e.target.value.length > 0) {
        loadResults(e.target.value, selectedFacets)
      } else if (e.target.value.length == 0) {
        loadResults(null, selectedFacets);
      }
  }

  relevanceUpdate(e) {
    const { setSort } = this.props;

    if (e) {
      setSort(e.target.value);
    }
  }

  facetUpdate(e) {
    const { loadResults, query, selectedFacets } = this.props;

    if (e) {
      var text = e.target.textContent;
      // Remove "(N)" if there.
      text = text.substring(0,text.indexOf(' (')) ?  text.substring(0,text.indexOf(' (')) : text;
      const facetType = e.target.getAttribute('data-facet-type');
      var facets = [];
      // Active clicked so we are removing.
      if (e.target.classList.contains('active')) {
        selectedFacets.forEach(function(facet,i) {
          if (facet[0].trim() === facetType && facet[1].trim() === text.trim()) {
          }
          else {
            facets[i] = facet;
          }
        });
      }
      else {
        facets = selectedFacets ? selectedFacets.concat([[facetType, text]]) : [[facetType, text]];
      }
      facets = facets.length ? facets : false;
      loadResults(query, facets);
    }
  }

  componentWillUnmount() {
    const { clearResults } = this.props;
    clearResults();
  }

  componentWillMount() {

    const { query, results, error, facets, loadResults, selectedFacets, loadFacets, updateFacets, facetsResults } = this.props;
    if (results === false && error === false && selectedFacets === false) {
      loadResults(null, false);
    }
    if (results && facetsResults === false) {
      updateFacets();
    }
    if (results === false & error == false && selectedFacets) {
      loadResults(null, selectedFacets);
    }


  }

  render() {
    const { query, results, resultsCount, error, loading, facets, loadFacets, loadingFacets, selectedFacets, facetsResults, loadingFacetsResults } = this.props;

    const resultmessage = query  && resultsCount  ? resultsCount + " Results for \"" + query + "\"": resultsCount + " Results";

    const searchListProps = {
       loading,
       results,
       error,
       resultmessage,
     };

    // TODO: remove from render.
    const facetClick = this.facetUpdate.bind(this);

    const facetListProps = {
         loadingFacets,
         facets,
         loadingFacetsResults,
         facetsResults,
         facetClick,
         selectedFacets,
     };

    return (
      <PageContainer>
        <Helmet>
          <title>Search</title>
        </Helmet>
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
    PropTypes.object,
    PropTypes.bool,
  ]),
  index: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  facetsResults: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  selectedFacets: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadQuery: PropTypes.func,
  loadResults: PropTypes.func,
  loadFacets: PropTypes.func,
  setSort: PropTypes.func,
  clearResults: PropTypes.func,
  updateFacets: PropTypes.func,
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
  selectedFacets: makeSelectSelectedFacets(),
  index: makeSelectIndex(),
});

function mapDispatchToProps(dispatch) {
  return {
    loadResults: (query, selectedFacets) => dispatch(actionLoadSearchResults(query, selectedFacets)),
    loadFacets: () => dispatch(actionLoadFacets()),
    clearResults: () => dispatch(actionClearResults()),
    setSort: (query) => dispatch(actionUpdateSort(query)),
    updateFacets: () => dispatch(actionUpdateFacets()),
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
