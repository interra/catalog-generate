import { call, put, select, takeLatest, fetch } from 'redux-saga/effects';
import request from 'utils/request';
import elasticlunr from 'elasticlunr';
import elasticsearch from 'elasticsearch';

class Search {
  *init() {
    return {};
  }

  *resultCount() {}

  *query() {}
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

  *resultCount(results) {
    return results.length;
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

  *resultCount(results) {
    return results.length;
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


  *init() {
    const index = elasticsearch.Client({
      host: 'https://search-interra-hakxd4cqlxcaapxlc7hzatsani.us-west-2.es.amazonaws.com/hhs',
    });
    return index;
  }

  *query(query, index) {
    const docs = yield this.esSearch(query, index);
  }

  *getAll(index) {
    const that = this;
    const docs = yield this.esSearch("*", index);
    return docs;
  }

  esSearch(query, index) {
    const body = {
  "query": {
    "match": {
      "title": "*MRSA*"
    }
  }
};
    const that = this;
    return index.search({
      body: body
    }).then(function (docs) {
      that.count = docs.hits.total;
      const items = docs.hits.hits.map((index) => {
      const item = {
        doc: index._source,
        score: index._score,
        ref: index._source.interra.id,
      }
      return item;
    });
      return items;
    }, function (error) {
      console.trace(error.message);
    });
  }

  *resultCount(results) {
    return this.count;
  }

}


const search = {
  elasticSearch,
  simpleSearch,
  elasticLunr,
};

export default search;
