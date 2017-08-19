import styled from 'styled-components';

const StyledA = styled.a`
  list-style-type: none;
  width: 100%;
  padding: 5px 5px 5px 10px;
  position: relative;
  display: block;
  &:hover {
    border-left: 2px solid gray;
    text-decoration: none;
    padding-left: 8px;
    background-color: #f3f3f3;
  }
  &:hover:after {
      content: "\\2795";
      color: gray;
      position: absolute;
      top: 3px;
      right: 6px;
      text-decoration: none;
   }
`;

export default StyledA;
