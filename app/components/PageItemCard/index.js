import React from 'react';
import PropTypes from 'prop-types';

import Item from './Item';
import Wrapper from './Wrapper';
import LoadingIndicator from 'components/LoadingIndicator';
import { Link } from 'react-router-dom';
import { Parser } from 'html-to-react';

function PageItemCard(props) {
  const computeGrid = (numberOfItems) => {
    let number = 1;
    if (numberOfItems === 2) {
      number = 6;
    }
    else if (numberOfItems === 3) {
      number = 4;
    }
    else if (numberOfItems === 4) {
      number = 3;
    }
    else if (numberOfItems === 5 || numberOfItems == 6) {
      number = 3;
    }
    return number;
  }

  const label = props.label ? <strong>{props.labelValue}:</strong> : '';
  if (props.loading || !props.data.collection) {
    return (
      <LoadingIndicator />
    )
  } else {
    const maxPerRow = 4;
    const num = props.data.collection.length;
    const numRows = num > maxPerRow ? Math.ceil(num/maxPerRow) : 1;
    const columnWidth = computeGrid(num);
    const parser = new Parser();
    const items = props.data.collection.map(function(item, i) {
      const ref = `${props.data.collectionType}/${item.interra.id}`;
      const description = item.description ?  parser.parse(item.description) : '';
      // TODO: Maybe default image?
      const image = 'image' in item ? <img style={{top: "50%",transform: "translateY(-50%)", position:   "relative"}} alt={`image for ${item.name}`} src={item. image}/> : <div style={{height: "125px"}}className="font-icon-select-1 font-icon-select-1-account-group-1"></div>;
      item.columnWidth = columnWidth;
      return <div key={`col-${i}`} className={`col-lg-${columnWidth}`}>
        <article style={{minHeight: "365px", marginBottom: "20px"}}>
          <div style={{textAlign: "center", height: "125px"}}>
            <Link to={ref}>{image}</Link>
          </div>
          <h2 style={{fontSize: "25px", lineHeight: "35px"}}><Link to={ref}>{item.name}</Link></h2>
          <div>
            {description}
          </div>
        </article>
      </div>;
    });
    let count = 0;
    const rows = [...Array(numRows)].map((e, i) => {
      let divs = '';
      divs = [...Array(maxPerRow)].map((l, x) => {
        const item = items[count];
        count = count + 1;
        return item;
      });
      return <div key={`row-${i}`} className="row">{divs}</div>;
    });
    return (
      <div style={{margin: "10px -5px"}}>
      {label} {rows}
      </div>
    );
  }
}
/**
PageItemCard.propTypes = {
  item: PropTypes.any,
};
*/
export default PageItemCard;
