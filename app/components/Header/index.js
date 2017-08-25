import React from 'react';
import { FormattedMessage } from 'react-intl';

import A from './A';
import Img from './Img';
import NavBar from './NavBar';
import HeaderLink from './HeaderLink';
import messages from './messages';
import { Link } from 'react-router-dom';

class Header extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div>
        <Link to="/">
          <Img src="/logo.png" alt="Logo" />
        </Link>
        <NavBar>
          <HeaderLink to="/">
            <FormattedMessage {...messages.home} />
          </HeaderLink>
          <HeaderLink to="/about">
            <FormattedMessage {...messages.features} />
          </HeaderLink>
          <HeaderLink to="/search">
            Search
          </HeaderLink>
        </NavBar>
      </div>
    );
  }
}

export default Header;
