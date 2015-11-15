var fetch 		  = require('node-fetch');
var htmlparser 	  = require("htmlparser2");
var fs 			  = require('fs');
var watson 		  = require('watson-developer-cloud');
var ogg           = require('ogg');
var opus 		  = require('node-opus');
var Speaker       = require('speaker');
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

	var text_to_speech = watson.text_to_speech({
	  username: username,
	  password: password,
	  version: 'v1'
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
			        id: '/corpora/' + account_id  + corpus + '/documents/' + articleId,
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
	    articleId  =  ctx.instance.id
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
			{corpus: '/corpora/' + account_id  +  corpus}, function(err, res) {
			if (err){
				return console.log(err);
			}
		    var conceptArray = res.top_tags.tags;
		    //console.log(conceptArray);
		    cb(null, conceptArray);
		});
    }


    Todo.getDetails = function(concept,cb) {
    	//console.log("concept :: "  , concept);
		conceptInsights.corpora.getRelatedDocuments(
			{	ids  : [concept],
				corpus: '/corpora/' + account_id  + '/' + corpus
			
			}, function(err, res) {
			if (err){
				return console.log(err);
			}
		 	cb(null,res);

		});
    }

    Todo.playArticle = function(id,cb) {
    	console.log("id :: "  , id);

		// conceptInsights.corpora.getRelatedDocuments(
		// 	{	ids  : [concept],
		// 		corpus: '/corpora/' + account_id  + '/' + corpus
			
		// 	}, function(err, res) {
		// 	if (err){
		// 		return console.log(err);
		// 	}
		//  	cb(null,res);

		// });

		var params = {
		  text: 'Hello from IBM Watson',
		  voice: 'en-US_MichaelVoice', // Optional voice 
		  accept: 'audio/ogg; codec=opus'
		};
 
		// Pipe the synthesized text to a file 
		//text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav'));
		text_to_speech.synthesize(params)
		    .pipe(new ogg.Decoder())
		    .on('stream', function (opusStream) {
		        opusStream.pipe(new opus.Decoder())
		            .pipe(new Speaker());
		});
		cb(null,"Sucess");
    }

    Todo.remoteMethod(
        'getConcepts',
        {
          http: {path: '/getConcepts', verb: 'get'},
          returns: {arg: 'concepts', type: 'array'}
        }
    );

    Todo.remoteMethod(
        'getDetails',
        {
          accepts: {arg: 'concept', type: 'string'},
          http: {path: '/getDetails', verb: 'get'},
          returns: {arg: 'articles', type: 'object'}
        }
    );

    Todo.remoteMethod(
        'playArticle',
        {
          accepts: {arg: 'id', type: 'string'},
          http: {path: '/playArticle', verb: 'get'},
          returns: {arg: 'id', type: 'object'}
        }
    );

};
