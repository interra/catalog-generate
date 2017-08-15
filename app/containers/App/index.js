/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { Switch, Route } from 'react-router-dom';

import HomePage from 'containers/HomePage/Loadable';
import FeaturePage from 'containers/FeaturePage/Loadable';
import BasicListPage from 'containers/BasicListPage/Loadable';
import CollectionEntity from 'containers/CollectionEntity/Loadable';
import SearchPage from 'containers/SearchPage/Loadable';

import NotFoundPage from 'containers/NotFoundPage/Loadable';
import Header from 'components/Header';
import Footer from 'components/Footer';
import Bootstrap from 'bootstrap/dist/css/bootstrap.css';


const AppWrapper = styled.div`
  margin: 0 auto;
  display: flex;
  min-height: 100%;
  padding: 0 16px;
  flex-direction: column;
`;

export default function App() {
  return (
    <AppWrapper>
      <Helmet
        titleTemplate="%s - React.js Boilerplate"
        defaultTitle="Open data catalog exp"
      >
        <meta name="description" content="A React.js Boilerplate application" />
      </Helmet>
      <Header />
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/about" component={FeaturePage} />
        <Route path="/list" component={BasicListPage} />
        <Route path="/search" component={SearchPage} />

        <Route path="" component={CollectionEntity} />
      </Switch>
      <Footer />
    </AppWrapper>
  );
}
