import styled from 'styled-components';

const fonts = interraConfig.fontConfig;

const footerBackColor = fonts && fonts.footerBackColor ? fonts.footerBackColor : "#FFF";
const footerFontColor = fonts && fonts.footerFontColor ? fonts.footerFontColor : "#000";
const footerLinkColor = fonts && fonts.footerLinkColor ? fonts.footerLinkColor : "#999";

const Wrapper = styled.footer`
  display: flex;
  justify-content: space-between;
  padding: 30px 40px;
  border-top: 1px solid #666;
  color: ${footerFontColor};
  background-color: ${footerBackColor};
  & a {
    color: ${footerLinkColor}
  }
`;

export default Wrapper;
