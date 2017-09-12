import styled from 'styled-components';

const fonts = interraConfig.fontConfig;

const heroSearchOutlineColor = fonts && fonts.heroSearchOutlineColor ? fonts.heroSearchOutlineColor : "rgba(255, 255, 255, 0.25)";
const heroSearchOutlineBorderColor = fonts && fonts.heroSearchOutlineBorderColor ? fonts.heroSearchOutlineBorderColor : "#656565";

const StyledSearchContainer = styled.div`
  margin: 0 auto;
  position: relative;
  background-color: ${heroSearchOutlineColor};
  padding: 10px !important;
  border-radius: 6px;
  border: 1px solid ${heroSearchOutlineBorderColor};
`;

export default StyledSearchContainer;
