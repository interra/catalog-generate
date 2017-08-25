import styled from 'styled-components';
import { Link } from 'react-router-dom';

const StyledLink = styled(Link)`
  padding: 15px;
  width: 100%;
  display: block;

  &:hover {
    text-decoration: none;
    background-color: #f7f7f7;
  }
`;

export default StyledLink;
