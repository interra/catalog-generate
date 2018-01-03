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
import Breadcrumb from 'components/Breadcrumb';
import PageContainer from 'components/PageContainer';

export default class FeaturePage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  // Since state and props are static,
  // there's no need to re-render this component
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const breadcrumbs = [{
      title: 'Home',
      loc: '/',
      icon: 'home'
    },{
      title: 'About',
      loc: '/about'
    }];

    return (
      <PageContainer>
        <Helmet>
          <title>About</title>
          <meta name="description" content="About" />
        </Helmet>
        <Breadcrumb breadcrumbs={breadcrumbs} />
      <div style={{lineHeight: "2.5em", maxWidth: "700px"}}>

        <H1>
          <FormattedMessage {...messages.header} />
        </H1>
        <FormattedMessage {...messages.esplain} />
      </div>
      </PageContainer>
    );
  }
}
