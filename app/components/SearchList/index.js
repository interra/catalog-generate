import React from 'react';
import PropTypes from 'prop-types';

import List from 'components/List';
import ListItem from 'components/ListItem';
import LoadingIndicator from 'components/LoadingIndicator';
import SearchListItem from 'containers/SearchListItem';
import H3 from './H3';

function SearchList({ loading, error, results, resultmessage }) {
  if (loading) {
    return <List component={LoadingIndicator} />;
  }

  if (error !== false) {
    const ErrorComponent = () => (
      <ListItem item={'Something went wrong, please try again!'} />
    );
    return <List component={ErrorComponent} />;
  }

  if (results.length === 0) {
    return <span><H3>{resultmessage}</H3><div>No records found, try another search term.</div></span>;
  }

  if (results !== false) {
    return <span><H3>{resultmessage}</H3><List items={results} component={SearchListItem} /></span>;
  }


  return null;
}

SearchList.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.any,
  results: PropTypes.any,
};

export default SearchList;
