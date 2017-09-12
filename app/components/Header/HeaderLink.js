import { Link } from 'react-router-dom';
import styled from 'styled-components';

const fonts = interraConfig.fontConfig;

const navBarLink = fonts && fonts.navBarLink ? fonts.navBarLink : "#eaeaea";
const navBarLinkHover = fonts && fonts.navBarLinkHover ? fonts.navBarLinkHover : "#FFF";
const navBarLinkHoverBack = fonts && fonts.navBarLinkHoverBack ? fonts.navBarLinkHoverBack : "#3a71af";
const navBarLinkActive = fonts && fonts.navBarLinkActive ? fonts.navBarLinkActive : "#FFF";
const navBarLinkActiveBack = fonts && fonts.navBarLinkActiveBack ? fonts.navBarLinkActiveBack : "#305e92";
const navBarLinkActiveHoverBack = fonts && fonts.navBarLinkActiveHoverBack ? fonts.navBarLinkActiveHoverBack : "#3a71af";
const navBarLinkActiveHover = fonts && fonts.navBarLinkActiveBack ? fonts.navBarLinkActiveBack : "#FFF";

export default styled(Link)`
  display: inline-flex;
  padding: .9em 1.2em;
  text-decoration: none;
  -webkit-font-smoothing: antialiased;
  -webkit-touch-callout: none;
  user-select: none;
  cursor: pointer;
  outline: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  color: ${navBarLink};

  &:hover.active {
    background-color: ${navBarLinkActiveHoverBack};
    color: ${navBarLinkActiveHover};
  }
  &:hover {
    color: ${navBarLinkHover};
    text-decoration: none;
    background-color: ${navBarLinkHoverBack};
  }
  &.active {
    background-color: ${navBarLinkActiveBack};
    color: ${navBarLinkActive};
    text-decoration: none;
  }
`;
