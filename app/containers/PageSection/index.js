/**
 * RepoListItem
 *
 * Lists the name and the issue count of a repository
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ListItem from 'components/ListItem';
import Wrapper from './Wrapper';
import StyledLink from './StyledLink';
import PageItemExtentMap from 'components/PageItemExtentMap';
import PageItemFileDownload from 'components/PageItemFileDownload';
import PageItemFilePreview from 'containers/PageItemFilePreview';
import PageItemImage from 'components/PageItemImage';
import PageItemOrg from 'components/PageItemOrg';
import PageItemResource from 'components/PageItemResource';
import PageItemSchema from 'components/PageItemSchema';
import PageItemSearchPage from 'components/PageItemSearchPage';
import PageItemSocial from 'components/PageItemSocial';
import PageItemString from 'components/PageItemString';
import PageItemTag from 'components/PageItemTag';
import PageItemText from 'components/PageItemText';
import PageItemTheme from 'components/PageItemTheme';
import SectionTypeMain from 'components/SectionTypeMain';
import SectionTypeTitle from 'components/SectionTypeTitle';
import SectionTypeLeft from 'components/SectionTypeLeft';
import SectionTypeTable from 'components/SectionTypeTable';

export class PageSection extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function

  render() {

    const pageItems = {
      PageItemFileDownload,
      PageItemFilePreview,
      PageItemImage,
      PageItemOrg,
      PageItemSchema,
      PageItemString,
      PageItemText,
      PageItemTag,
      PageItemTheme,
      PageItemExtentMap,
      PageItemSearchPage,
      PageItemResource,
      PageItemSocial,
    };
    const SectionTypes = {
      SectionTypeMain,
      SectionTypeLeft,
      SectionTypeTable,
      SectionTypeTitle,
    };
    const { doc, pageSchema, schema, type } = this.props;
    const SectionComponent = SectionTypes[`SectionType${type}`];
    const fields = pageSchema ? pageSchema[type] : {};
    if (fields && doc) {
      const section = Object.keys(fields).map((field, index) => {
        const Component = pageItems[`PageItem${fields[field].type}`];
        const label = 'label' in fields[field] ? [field].label : false;
        const labelValue = field === 'widget' ? '' : schema.properties[field].title;
        const def = fields[field];
        const item = {
          data: {
            field,
            doc,
            def,
            value: doc[field],
          },
        };
        if (field in doc || field === 'widget') {
          return (<Component labelValue={labelValue} label={label} key={index} {...item} />);
        }
      },'<div></div>');
      return (
        <SectionComponent {...section} />
      );
    } else {
      return (<span></span>)
    }
  }
}

PageSection.propTypes = {
  doc: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  schema: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  type: PropTypes.string,
};

export default connect()(PageSection);
