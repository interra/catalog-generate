import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import { Link } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';


function PageItemSocial(props) {
  const url = window.location;
  return (
    <div style={{borderRadius: "5px",
    border: "1px solid #ddd",
    marginBottom: "20px",
    padding: "0"}}>

    <h3 style={{padding: "20px 20px 15px", margin: "0", borderBottom: "1px solid #999"}}>Social</h3>
    <div className="item-list">
      <ul className="nav nav-simple social-links">
        <li>
          <a href={`https://twitter.com/share?url=${url}`} target="_blank"><i style={{verticalAlign: "-5%"}} className="fa fa-lg fa-twitter-square"></i> Twitter</a>
        </li>
        <li>
          <a href={`https://www.linkedin.com/shareArticle?url=${url}`} target="_blank"><i style={{verticalAlign: "-5%"}} className="fa fa-lg fa-linkedin-square"></i> LinkedIn</a>
        </li>
        <li>
          <a href={`http://www.reddit.com/submit?url=${url}`} target="_blank"><i style={{verticalAlign: "-5%"}} className="fa fa-lg fa-reddit-square"></i> Reddit</a>
        </li>
        <li>
          <a href={`https://plus.google.com/share?url=${url}`} target="_blank"><i style={{verticalAlign: "-5%"}} className="fa fa-lg fa-google-plus-square"></i> Google+</a>
        </li>
        <li>
          <a href={`https://www.facebook.com/sharer.php?u=${url}`} target="_blank"><i style={{verticalAlign: "-5%"}} className="fa fa-lg fa-facebook-square"></i> Facebook</a>
        </li>
      </ul>
    </div>
    </div>
  );
}

PageItemSocial.propTypes = {
  item: PropTypes.any,
  field: PropTypes.any,
};

export default PageItemSocial;
