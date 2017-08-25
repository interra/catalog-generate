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
import { actionClearResults, searchLoadIndex, actionLoadSearchResults } from 'containers/SearchPage/actions';
import { makeSelectIndex, makeSelectQuery, makeSelectResults } from 'containers/SearchPage/selectors';
import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import AutoCompSearchList from 'components/AutoCompSearchList';

import H2 from 'components/H2';
import ReposList from 'components/ReposList';
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
    const { index, loadIndex, results, clearResults } = this.props;

    if (!index) {
      loadIndex();
    }
    if (results) {
      clearResults();
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

  render() {
    const { query, results } = this.props;

    const loading = false;
    const error = false;
    const AutoCompSearchListProps = {
      results,
      loading,
      query,
      error,
    }

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

        <div>
          <CenteredSection>
            <H2>
              <FormattedMessage {...messages.startProjectHeader} />
            </H2>
            <p>
              <FormattedMessage {...messages.startProjectMessage} />
            </p>
          </CenteredSection>
          <Section>
            <H2>
              <FormattedMessage {...messages.trymeHeader} />
            </H2>
          </Section>
            <i className="glyphicon glyphicon-search"></i>
        </div>
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
  // Dispatch.
  loadIndex: PropTypes.func,
  loadResults: PropTypes.func,
  clearResults: PropTypes.func,
};

export function mapDispatchToProps(dispatch) {
  return {
    loadIndex: () => dispatch(searchLoadIndex()),
    clearResults: () => dispatch(actionClearResults()),
    loadResults: (query) => dispatch(actionLoadSearchResults(query)),
  };
}

const mapStateToProps = createStructuredSelector({
  query: makeSelectQuery(),
  index: makeSelectIndex(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
  results: makeSelectResults(),
});

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'search', reducer });
const withSaga = injectSaga({ key: 'search', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(HomePage);
