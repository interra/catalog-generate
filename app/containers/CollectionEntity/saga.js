/**
 * Gets the repositories of the user from Github
 */

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { LOAD_REPOS } from 'containers/App/constants';

import { LOAD_COLLECTION, LOAD_BREADCRUMB, LOAD_SITEMAP_SUCCESS, LOAD_SCHEMA, LOAD_COLLECTION_SUCCESS } from './constants';
import { actionSetCollectionName, siteMapLoaded, collectionLoaded, schemaLoaded, breadcrumbLoaded, breadcrumbLoadedError } from './actions';

import { reposLoaded, repoLoadingError } from 'containers/App/actions';

import request from 'utils/request';
import {makeSelectCollectionName, makeSelectCollection, makeSelectSiteMap } from 'containers/CollectionEntity/selectors';

export function* getSchema() {

  // This breaks staic compilation. Lets fix that later :).
  //const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const url = interraConfig.devUrl;
  const requestURL = url + '/api/v1/schema.json';
  console.log(requestURL);
  try {
    // Call our request helper (see 'utils/request')
    const currentSchema = yield call(request, requestURL);
    console.log(currentSchema);
    yield put(schemaLoaded(currentSchema));
  } catch (err) {
    console.log("error?", err);
    yield put(repoLoadingError(err));
  }
}

const siteMapTree = function(struct, cmp) {
  if (struct.loc === cmp) {
    // `cmp` is found at current `struct`.
    return [];
  } else if (struct.children) {
    for (var i = 0; i < struct.children.length; i++) {
      var path = siteMapTree(struct.children[i], cmp);
      if (path !== null) {
        // `cmp` is found at `path` in `struct.children[i]`,
        // so prefix `i` to `path` to get the path in `struct`.
        path.unshift(i);
      return path;
      }
    }
  }
  // `cmp` not found in this branch of the tree.
  return null;
};


export function* getBreadCrumb(action) {
  let siteMap = yield select(makeSelectSiteMap());
  if (!siteMap) {
    siteMap = yield getSiteMap();
    yield put(siteMapLoaded(siteMap));
  }
  let breadcrumb = [{
    'title': 'Home',
    'loc': '/',
    'icon': 'home'
  }];
  const location = siteMapTree(siteMap[0], `/${action.path}`);
  if (location) {
  location.reduce((acc, n) => {
    acc = acc.children[n];
    const item = {
      title: acc.title,
      loc: acc.loc
    };
    breadcrumb.push(item);
    return acc;
  }, siteMap[0]);
  }
  yield put(breadcrumbLoaded(breadcrumb));
}


export function* getSiteMap() {
  // This breaks staic compilation. Lets fix that later :).
  //const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2];
  const url = interraConfig.devUrl;
  const requestURL = url + '/api/v1/sitemap.json';
  try {
    // Call our request helper (see 'utils/request')
    const siteMap = yield call(request, requestURL);
    return siteMap;
  } catch (err) {
    return null;
    yield put(breadcrumbLoadedError(err));
  }
}

export function* getDoc(items) {
  const path = items.path;
  const collectionName = path.split('/')[0];
  yield put(actionSetCollectionName(collectionName));
  //const url = window.location.origin;
  const url = interraConfig.devUrl;
  const requestURL = url + '/api/v1/collections/' + path + '.json';
  try {
    const doc = yield call(request, requestURL);
    yield put(collectionLoaded(doc));
  } catch (err) {
    console.log("error?", err);
    yield put(repoLoadingError(err));
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* githubData() {
  // Watches for LOAD_REPOS actions and calls getRepos when one comes in.
  // By using `takeLatest` only the result of the latest API call is applied.
  // It returns task descriptor (just like fork) so we can continue execution
  // It will be cancelled automatically on component unmount
  yield takeLatest(LOAD_BREADCRUMB, getBreadCrumb);
  yield takeLatest(LOAD_COLLECTION, getDoc);
  yield takeLatest(LOAD_SCHEMA, getSchema);

}
