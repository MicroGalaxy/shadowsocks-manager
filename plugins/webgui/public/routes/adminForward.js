const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.forward', {
      url: '/forward',
      controller: 'AdminForwardController',
      templateUrl: `${ cdn }/public/views/admin/forward.html`,
    })
    .state('admin.forwardPage', {
      url: '/forward/:forwardId',
      controller: 'AdminForwardPageController',
      templateUrl: `${ cdn }/public/views/admin/forwardPage.html`,
    })
    .state('admin.addForward', {
      url: '/addForward',
      controller: 'AdminAddForwardController',
      templateUrl: `${ cdn }/public/views/admin/addForward.html`,
    })
    .state('admin.editForward', {
      url: '/forward/:forwardId/edit',
      controller: 'AdminEditForwardController',
      templateUrl: `${ cdn }/public/views/admin/editForward.html`,
    });
  }])
;
