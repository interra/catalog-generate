import { call, put, select, takeLatest, fetch } from 'redux-saga/effects';
import request from 'utils/request';
import elasticlunr from 'elasticlunr';

class Search {
  *init() {
    return {};
  }

  query() {}
}

export class elasticLunr extends Search {
  *init() {
    const url = window.location.origin + '/api/v1/search-index.json';
    console.time("Loading index.");
    const searchIndex = yield call(request, url);
    const index = elasticlunr.Index.load(searchIndex);
    console.timeEnd("Index Loaded");
    return index;
  }

  *query(query, index) {
    const items = index.search(query, {expand: true});
    return items;
  }

  *getAll(index) {
    const docs = index.documentStore.docs;
    const items = Object.keys(docs).map(function(index) {
      var item = {
        doc: docs[index],
        ref: index,
        score: 1
      }
      return item;
    });
    return items;
  }

}

export class simpleSearch extends Search {
  *init() {
    const url = window.location.origin + '/api/v1/search-index.json';
    console.time("Loading index.");
    const index = yield call(request, url);
    console.timeEnd("Index Loaded");
    return {index};
  }

  *getAll(index) {
    return index.index;
  }

  *query(query, index) {
    return index.index.reduce((acc, doc) => {
      const haystack = JSON.stringify(doc.doc);
      const needleRegExp = new RegExp(query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
      const result = needleRegExp.test(haystack);
      if (result) {
        acc.push(doc);
      }
      return acc;
    }, []);
  }
}

export class elasticSearch extends Search {
  *query(query, index) {
    const docs = yield call(request, interraConfig.search.endpoint + "?q=" +  query + "*");
    const items = docs.hits.hits.map((index) => {
      const item = {
        doc: index._source,
        score: index._score,
        ref: index._source.interra.id,
      }
      return item;
    });
    return items;

    return result;
  }
  *getAll(index) {
    const docs = yield call(request, interraConfig.search.endpoint);
    const items = docs.hits.hits.map((index) => {
      const item = {
        doc: index._source,
        score: index._score,
        ref: index._source.interra.id,
      }
      return item;
    });
    return items;
  }

}

const search = {
  elasticSearch,
  simpleSearch,
  elasticLunr,
};

export default search;
