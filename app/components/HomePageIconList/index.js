import React from 'react';
import PropTypes from 'prop-types';

import List from 'components/List';
import ListItem from 'components/ListItem';
import LoadingIndicator from 'components/LoadingIndicator';
import HomePageIconListItem from 'containers/HomePageIconListItem';

function HomePageIconList({ loading, error, loadingHomePageIcons, homePageIcons}) {

  console.log(homePageIcons);
  console.log(loadingHomePageIcons);

  const computeGrid = (numberOfItems) => {
    let number = 1;
    if (numberOfItems === 2) {
      number = 6;
    }
    else if (numberOfItems === 3) {
      number = 4;
    }
    else if (numberOfItems === 4) {
      number = 3;
    }
    else if (numberOfItems === 5 || numberOfItems == 6) {
      number = 2;
    }
    return number;
  }

  const columnWidth = computeGrid(homePageIcons.length);

  if (loadingHomePageIcons) {
    return <List component={LoadingIndicator} />;
  }

  if (error !== false) {
    const ErrorComponent = () => (
      <ListItem item={'Something went wrong, please try again!'} />
    );
    return <List component={ErrorComponent} />;
  }

  // List expects a ref for key.
  if (homePageIcons !== false) {
    const items = homePageIcons.map(function(item) {
      item.ref = item.identifier;
      item.columnWidth = columnWidth;
      return item;
    });

    return <List items={items} component={HomePageIconListItem} />;
  }

  return null;
}

HomePageIconList.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.any,
  results: PropTypes.any,
};

export default HomePageIconList;
