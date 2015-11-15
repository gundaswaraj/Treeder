'use strict';

var watson = require('watson-developer-cloud');
var username = 'f931a304-67eb-4213-8d0b-eb6e77ffee8d';
var password = 'JCSkMhiF1r0u';
var account_id;
var request;
var corpus;

var conceptInsights = watson.concept_insights({
	  username: username,
	    password: password,
	      version: 'v2'
});

concept_insights.accounts.getAccountsInfo(null, function  (err,result) {
  account_id = result;
  addArticletoCorpus(corpusPath);
});

var addArticletoCorpus = function(corpusPath) {
  return function(error, response, document) {
      var newDocument = {
        id: corpus + '/documents/' + document.id,
        document: document
      };
      //console.log(newDocument);
      conceptInsights.corpora.createDocument(newDocument, function(err) {
        if (err)
          return console.log(err);
        console.log('document created:', newDocument);
      });
    });
  };
};

