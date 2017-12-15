/*
 * FeaturePage
 *
 * List all the features
 */
import React from 'react';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';

import H1 from 'components/H1';
import messages from './messages';
import List from './List';
import ListItem from './ListItem';
import ListItemTitle from './ListItemTitle';
import SearchPage from 'containers/SearchPage';
import PageContainer from 'components/PageContainer';
import Breadcrumb from 'components/Breadcrumb';

export default class SearchPageWrapper extends React.Component { // eslint-disable-line react/prefer-stateless-function

  render() {
    const breadcrumbs = [{
      title: 'Home',
      loc: '/',
      icon: 'home'
    },{
      title: 'Search',
      loc: '/search'
    }];

    return (
        <PageContainer>
          <Helmet>
            <title>Search</title>
          </Helmet>
          <Breadcrumb breadcrumbs={breadcrumbs} />
          <SearchPage />
        </PageContainer>
    );
  }
}
