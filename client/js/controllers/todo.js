angular
  .module('app')
  .controller('TodoController', ['$scope', '$state', 'Todo', function($scope,
      $state, Todo) {
    $scope.todos = [];
    $scope.articles = [];
    
    function getTodos() {
      Todo
        .find()
        .$promise
        .then(function(results) {
          $scope.todos = results;
          //alert(" Result " + JSON.stringify(results));
        });
    }
    //getTodos();

    getConcepts();

    $scope.playArticle = function(item) {
      Todo
        .playArticle(item)
        .$promise
        .then(function(results) {
          //$scope.articles = results.articles.results;
          alert(" Result " + JSON.stringify(results.articles.results));
          
      });
    }
    
    $scope.getDetails = function(item) {
      //alert(" Input " + JSON.stringify(item));
      Todo
        .getDetails(item)
        .$promise
        .then(function(results) {
          $scope.articles = results.articles.results;
          //alert(" Result " + JSON.stringify(results.articles.results));
      });
    };
    function getConcepts() {

       Todo
        .getConcepts()
        .$promise
        .then(function(results) {
          $scope.todos = results.concepts;
          //alert(" Result " + JSON.stringify(results));
        });
    }

    $scope.addTodo = function() {
      Todo
        .create($scope.newTodo)
        .$promise
        .then(function(todo) {
          $scope.newTodo = '';
          $scope.todoForm.content.$setPristine();
          $('.focus').focus();
          //getTodos();
          getConcepts();
        });
    };

    $scope.removeTodo = function(item) {
      Todo
        .deleteById(item)
        .$promise
        .then(function() {
          //getTodos();
          getConcepts();
        });
    };
  }]);
