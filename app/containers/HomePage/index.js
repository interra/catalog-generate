/*
 * HomePage
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
import { withRouter } from 'react-router-dom'

import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import { actionLoadFacets, actionLoadHomePageIcons, actionClearResults, searchLoadIndex, actionLoadSearchResults } from 'containers/SearchPage/actions';
import { makeSelectIndex, makeSelectQuery, makeSelectResults, makeSelectHomePageIcons, makeSelectLoadingHomePageIcons } from 'containers/SearchPage/selectors';
import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import AutoCompSearchList from 'components/AutoCompSearchList';
import HomePageIconList from 'components/HomePageIconList';

import H2 from 'components/H2';
import AtPrefix from './AtPrefix';
import CenteredSection from './CenteredSection';
import Input from './Input';
import Hero from 'components/Hero';
import Section from './Section';
import messages from './messages';
import { loadRepos } from '../App/actions';
import { changeUsername } from './actions';
import { makeSelectUsername } from './selectors';
import reducer from 'containers/SearchPage/reducer';
import saga from 'containers/SearchPage/saga';

export class HomePage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  /**
   * when initial state username is not null, submit the form to load repos
   */
  componentDidMount() {
    const { index, loadIndex, results, clearResults, loadIcons, homePageIcons } = this.props;

    if (!index) {
      loadIndex();
    }
    if (results) {
      clearResults();
    }
    if (!homePageIcons) {
      loadIcons();
    }

  }

  queryEnter(e) {

    const { loadResults, clearResults } = this.props;

    if (e.target.value.length > 0) {
      loadResults(e.target.value, null)
    }
    else if (e.target.value.length == 0) {
      clearResults();
    }
  }

  letsGoToSearchOnlyIfYouPressEnter(e) {
    if (e.key === 'Enter') {
      this.props.history.push('/search');
      return;
    }
  }

  letsGoToSearch(history) {
    history.push('/search')
  }

  letsGoToSearchWithFacet(e) {
    const { loadResults } = this.props;
    const facet = [['theme', e.target.getAttribute('data-facet-name')]];
    loadResults(null, facet);
  }


  render() {
    const { query, results, homePageIcons, loadingHomePageIcons } = this.props;

    const facetClick = this.letsGoToSearchWithFacet.bind(this);

    const loading = false;
    const error = false;
    const AutoCompSearchListProps = {
      results,
      loading,
      query,
      error,
    }

    const HomePageIconListProps = {
      homePageIcons,
      loadingHomePageIcons,
      error,
      facetClick,
    }
    // TODO: I don't have to do this, can use this.props.history.push('/search');
    const Button = withRouter(({ history}) => (
      <button className="btn btn-info btn-lg"
        type='button'
        style={{"backgroundColor": "#030d17", height: "60px", width: "60px", "border": "#999"}}
        onClick={() => this.letsGoToSearch(history)}
      >
        <i className="glyphicon glyphicon-search"></i>
      </button>
    ));

    return (
      <article>
        <Helmet>
          <title>Home Page</title>
          <meta name="description" content="A React.js Boilerplate application homepage" />
        </Helmet>

        <div className="jumbotron" style={{padding: "140px 0", backgroundColor: "#1f3f5f"}}>
          <div className="input-group col-md-10" style={{margin: "0 auto", position: "relative", backgroundColor: "rgba(255, 255, 255, 0.25)", padding: "10px", borderRadius: "6px", border: "1px solid #656565"}}>
            <input type="text"
              onKeyPress={(e) => this.letsGoToSearchOnlyIfYouPressEnter(e)}
              onChange={this.queryEnter.bind(this)}
              style={{height: "60px"}}
              className="form-control input-lg"
              placeholder="Search" />
            <span className="input-group-btn">
              <Button />
            </span>
            <AutoCompSearchList {...AutoCompSearchListProps} />
          </div>
        </div>
        <HomePageIconList {...HomePageIconListProps} />
      </article>
    );
  }
}

HomePage.propTypes = {

  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  query: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  index: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  results: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  homePageIcons: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  // Dispatch.
  loadIndex: PropTypes.func,
  loadResults: PropTypes.func,
  clearResults: PropTypes.func,
  loadIcons: PropTypes.func,
  loadFacets: PropTypes.func,
};

export function mapDispatchToProps(dispatch) {
  return {
    loadIndex: () => dispatch(searchLoadIndex()),
    clearResults: () => dispatch(actionClearResults()),
    loadResults: (query, facets) => dispatch(actionLoadSearchResults(query, facets)),
    loadIcons: () => dispatch(actionLoadHomePageIcons()),
    loadFacets: () => dispatch(actionLoadFacets()),
  };
}

const mapStateToProps = createStructuredSelector({
  query: makeSelectQuery(),
  index: makeSelectIndex(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
  results: makeSelectResults(),
  homePageIcons: makeSelectHomePageIcons(),
  loadingHomePageIcons: makeSelectLoadingHomePageIcons(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

// TODO: We are using the search state so we can load the index only once and
// use the same actions to search. Would like to use search state for search
// and then home state for home actions but don't know how so am just using
// search for now.
const withReducer = injectReducer({ key: 'search', reducer });
const withSaga = injectSaga({ key: 'search', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(HomePage);
