import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { parse } from 'wellknown';
import LeafletCSS from './leaflet.css';

class PageItemExtentMap extends React.Component {
  componentDidMount() {
    const data = this.props.data.value;
    if (data) {
      const geoJsonData = parse(data);
      const map = L.map('map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a>'
      }).addTo(map);
      const geojson = L.geoJson(geoJsonData).addTo(map);
      map.fitBounds(geojson.getBounds());
    }

  }
render() {
  return (
    <div style={{
      borderRadius: "5px",
      border: "1px solid #ddd",
      marginBottom: "20px",
      padding: "0px"}}>
      <h3 style={{padding: "20px 20px 15px", margin: "0", borderBottom: "1px solid #999"}}>Data Extent</h3>
      <div id="map" style={{height: "275px"}}></div>
    </div>
  );
}
}

PageItemExtentMap.propTypes = {
  item: PropTypes.any,
  field: PropTypes.any,
};

export default PageItemExtentMap;
