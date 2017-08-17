import React from 'react';
import PropTypes from 'prop-types';

import List from 'components/List';
import ListItem from 'components/ListItem';
import LoadingIndicator from 'components/LoadingIndicator';
import SearchListItem from 'containers/SearchListItem';

function SearchList({ loading, error, results }) {
  if (loading) {
    return <List component={LoadingIndicator} />;
  }

  if (error !== false) {
    const ErrorComponent = () => (
      <ListItem item={'Something went wrong, please try again!'} />
    );
    return <List component={ErrorComponent} />;
  }

  if (results !== false) {
    return <List items={results} component={SearchListItem} />;
  }

  return null;
}

SearchList.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.any,
  results: PropTypes.any,
};

export default SearchList;
