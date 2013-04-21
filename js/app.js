var blog = angular.module('blog', ['ui']);
blog.config(['$routeProvider', function($routeProvider) {
  //setup routes
  $routeProvider.when('/', {templateUrl: '/html/article.html'});
  $routeProvider.when('/profile', {templateUrl: '/html/profile.html'});
  $routeProvider.otherwise({redirectTo: '/'});
}]);
