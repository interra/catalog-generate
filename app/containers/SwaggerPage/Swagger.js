import React, {Component} from 'react';
import PropTypes from 'prop-types';

import SwaggerUi, {presets} from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';
import LoadingIndicator from 'components/LoadingIndicator';

class SwaggerUI extends Component {

    componentDidUpdate() {
      const { swagger, error, loading } = this.props;

      if (swagger) {
        SwaggerUi({
          dom_id: '#swaggerContainer',
          spec: swagger,
          presets: [presets.apis]
        });
      }

    }

    componentDidMount() {
      const { swagger, error, loading } = this.props;

      if (swagger) {
        SwaggerUi({
          dom_id: '#swaggerContainer',
          spec: swagger,
          presets: [presets.apis]
        });
      }

    }
    render() {
      const { swagger, error, loading } = this.props;

      if (loading) {
        return <LoadingIndicator />
      }
      else {

        return (

            <div id="swaggerContainer" />
        );
      }
    }
}

SwaggerUI.propTypes = {
    url: PropTypes.string,
    spec: PropTypes.object
};

SwaggerUI.defaultProps = {
    url: `/swagger.json`
};

export default SwaggerUI;
