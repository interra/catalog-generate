/*
 *
 * SearchPage actions
 *
 */

import {
  LOAD,
  LOAD_SUCCESS,
  LOAD_ERROR,
  LEAVE,
} from './constants';

export function actionLeave() {
  return {
    type: LEAVE,
  }
}

export function actionLoadFile(file) {
  return {
    type: LOAD,
    file,
  };
}

export function actionLoadSuccess(data) {
  return {
    type: LOAD_SUCCESS,
    data,
  };
}

export function actionLoadError() {
  return {
    type: LOAD_ERROR,
  };
}
