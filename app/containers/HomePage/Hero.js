import styled from 'styled-components';

const fonts = interraConfig.fontConfig;

const heroBackColor = fonts && fonts.heroBackColor ? fonts.heroBackColor : "rgb(31, 63, 95)";
const heroPadding = fonts && fonts.heroPadding ? fonts.heroPadding : "140px 0";

const heroImageUrl = fonts && fonts.heroImageUrl ? fonts.heroImageUrl : "";

const StyledHero = styled.div`
  padding: ${heroPadding};
  background-color: ${heroBackColor};
  position: relative;
  display: block;
  &::after{
    content: "";
    background: url(${heroImageUrl});
    opacity: 0.5;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
  }
`;

export default StyledHero;
