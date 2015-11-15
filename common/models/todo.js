var fetch = require('node-fetch');
var htmlparser = require("htmlparser2");

module.exports = function(Todo) {

	var isText = false;
	var articleObj = {};
	var isArticleHeader = false;
	var isArticleSubHeader = false;
	var isEndOfDoc = false;
	var parts = [];
	var part  = {};
	var data  = "";

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
	        	console.log(" End Obj : ",  JSON.stringify(articleObj));
	        }
	    }
	}, {decodeEntities: true});
	
	Todo.observe('after save', function updateTimestamp(ctx, next) {
	  if (ctx.instance) {
	    var articleURL =  ctx.instance.content;

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

		var concept  =  {"content":"paris","id":38,"count":14};
		var concept2 =  {"content":"paris2","id":38,"count":14};
	 	var conceptArray = [concept, concept2];
      	cb(null, conceptArray);
    }
     
    Todo.remoteMethod(
        'getConcepts', 
        {
          http: {path: '/getConcepts', verb: 'get'},
          returns: {arg: 'concepts', type: 'array'}
        }
    ); 

};
