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

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { makeSelectQuery, makeSelectResults } from './selectors';
import { makeSelectLoading, makeSelectError } from 'containers/App/selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';
import { actionLoadSearchResults } from './actions';

export class SearchPage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  search() {

  }

   componentWillMount() {

     const { query, results, error, loadResults } = this.props;

     if (results === false && error === false) {
         loadResults();
     }
   }

  render() {
     const { query, results, error, loadResults } = this.props;
     console.log(results);

    return (
      <div>
          <div className="input-group">
              <input type="text" className="form-control" placeholder="Search for..." />
              <span className="input-group-btn">
                  <button className="btn btn-default" type="button">Go!</button>
              </span>
          </div>
              <div>
              <h3>Results:</h3>
              <p>
              </p>
              </div>
      </div>
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
  loading: makeSelectLoading(),
  error: makeSelectError(),
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
