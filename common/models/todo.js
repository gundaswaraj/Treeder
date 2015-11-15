var fetch 		  = require('node-fetch');
var htmlparser 	  = require("htmlparser2");
var watson 		  = require('watson-developer-cloud');
var username 	  = 'f931a304-67eb-4213-8d0b-eb6e77ffee8d';
var password 	  = 'JCSkMhiF1r0u';
var account_id 	  = 'au9pieloc9sen0';
var corpus        = '/articles';
// corpus path /corpora/{account_id}/{corpus_name}
//var corpusPath = '/corpora/au9pieloc9sen0/articles';

module.exports = function(Todo) {

	var isText = false;
	var articleObj = {};
	var isArticleHeader = false;
	var isArticleSubHeader = false;
	var isEndOfDoc = false;
	var parts = [];
	var part  = {};
	var data  = "";

	var conceptInsights = watson.concept_insights({
	    username: username,
	    password: password,
	    version: 'v2'
	});

	var parser = new htmlparser.Parser({
	    onopentag: function(name, attribs){

	    	if(name === "h1"){
	    		console.log("header Beign");
	    		isArticleHeader = true;
	    	}
	    	if(name === "h2" ){
	    		if(part.name){
	    			parts.push(part);
	    		}
	    		part  = {};
	    		console.log("header2 Beign");
	    		isArticleSubHeader = true;
	    	}
	        if(name === "p"){
	            isText = true;
	        }

	    },
	    ontext: function(text){

	    	if(isArticleHeader === true){
	    		articleObj.label = text;
	    		part.name = text;
	    	}
	    	if(isArticleSubHeader === true){
	    		if(text === "\t" || text === "Featured Stories" || text === " Startups" || text === "Latest From"){
	    			isArticleSubHeader = false;
	    			parts[parts.length - 1].data =  parts[parts.length - 1].data + text;
	    		}else{
	    			part.name = text;
	    			part["content-type"] = "text/plain";
	    			console.log("header2 text :: " , text);
	    		}
	    	}
	    	if(isText === true){
	    		if(!part.data){
	    			part.data = "";
	    		}
	    		part.data = part.data + text;
	    	}

	    },
	    onclosetag: function(tagname){

	    	if(tagname === "h1"){
	    		isArticleHeader = false;
	    	}
	    	if(tagname === "h2"){
	    		isArticleSubHeader = false;

	    	}
	        if(tagname === "p"){
	            isText = false;
	        }
	        if(tagname === "html"){
	        	articleObj.parts = parts;
	        	//console.log(" End Obj : ",  JSON.stringify(articleObj));
	        	var newDocument = {
			        id: '/corpora/' + account_id  + corpus + '/documents/' + articleObj.label,
			        document: articleObj
			      };
			      //var corpusPath = '/corpora/au9pieloc9sen0/articles';
	        	conceptInsights.corpora.createDocument(newDocument, function(err) {
		       		if (err){
		         		return console.log(err);
		         	}
		      		console.log('document created:', newDocument);
		      	});

		      //
		      //
		      // conceptInsights.accounts.getAccountsInfo(null, function  (err,result) {
        //       	console.log(result);
        //   	   });

        //     conceptInsights.corpora.listCorpora(null, function  (err,result) {
        //       console.log(result);
        //     });




          }
	    }
	}, {decodeEntities: true});

	Todo.observe('after save', function updateTimestamp(ctx, next) {
	  if (ctx.instance) {
	    articleURL =  ctx.instance.content;

	    fetch(articleURL)
		    .then(function(res) {
		    	//console.log(res.text());
		        return res.text();
		    }).then(function(body) {
		    	//console.log(body);
		    	parser.write(body);
		    	parser.end();
		       	//console.log(body);

		});
	  }
	  next();
	});

	Todo.getConcepts = function(cb) {
		conceptInsights.corpora.getCorpusStats(
			{corpus: '/corpora/' + account_id  + '/' + corpus}, function(err, res) {
			if (err){
				return console.log(err);
			}
		    var conceptArray = res.top_tags.tags;
		    console.log(conceptArray);
		    cb(null, conceptArray);
		});
    }

    Todo.remoteMethod(
        'getConcepts',
        {
          http: {path: '/getConcepts', verb: 'get'},
          returns: {arg: 'concepts', type: 'array'}
        }
    );

};
