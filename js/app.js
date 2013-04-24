var blog = angular.module('blog', ['ui']);
blog.config(['$routeProvider', function($routeProvider) {
  //setup routes
  $routeProvider.when('/', {templateUrl: '/html/idea.html'});
  $routeProvider.when('/code', {templateUrl: '/html/code.html'});
  $routeProvider.when('/profile', {templateUrl: '/html/profile.html'});
  $routeProvider.otherwise({redirectTo: '/'});
}]);

angular.bootstrap(document, ['blog']);

// Navigation
var NavCtrl = function($scope, $location) {
  $scope.location = $location; 
  $scope.$watch('location.path()', function(path) {
    $scope.path = path;
  });
};
