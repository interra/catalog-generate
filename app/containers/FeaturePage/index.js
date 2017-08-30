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

export default class FeaturePage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  // Since state and props are static,
  // there's no need to re-render this component
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div style={{padding: "20px 50px", lineHeight: "2.5em", maxWidth: "700px", fontSize: "1.1em"}}>
        <Helmet>
          <title>About</title>
          <meta name="description" content="About Interra Data" />
        </Helmet>
        <H1 style={{paddingBottom: "20px"}}>
          <FormattedMessage {...messages.header} />
        </H1>
        <FormattedMessage {...messages.esplain} />
      </div>
    );
  }
}
