/*
 *
 * SearchPage actions
 *
 */

import {
  LOAD_SWAGGER,
  LOAD_SWAGGER_SUCCESS,
  LOAD_SWAGGER_ERROR,
} from './constants';


export function actionLoadSwagger() {
  return {
    type: LOAD_SWAGGER,
  };
}

export function actionLoadSwaggerSuccess(swagger) {
  return {
    type: LOAD_SWAGGER_SUCCESS,
    swagger
  };
}

export function actionLoadSwaggerError() {
  return {
    type: LOAD_SWAGGER_ERROR,
  };
}
