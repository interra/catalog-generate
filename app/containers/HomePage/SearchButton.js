import styled from 'styled-components';

const fonts = interraConfig.fontConfig;

const heroSearchIconBackColor = fonts && fonts.heroSearchIconBackColor ? fonts.heroSearchIconBackColor : "#030d17";
const heroSearchIconBorderColor = fonts && fonts.heroSearchIconBorderColor ? fonts.heroSearchIconBorderColor : "#999";

const StyledSearchButton = styled.button`
  background-color: ${heroSearchIconBackColor};
  height: 60px;
  width: 60px;
  border: ${heroSearchIconBorderColor};
`;

export default StyledSearchButton;
