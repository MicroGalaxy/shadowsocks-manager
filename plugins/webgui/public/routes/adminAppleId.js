const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.appleId', {
      url: '/appleid',
      controller: 'AdminAppleIdController',
      templateUrl: `${ cdn }/public/views/admin/appleId.html`,
    })
    .state('admin.appleIdPage', {
      url: '/appleid/:recordId',
      controller: 'AdminAppleIdPageController',
      templateUrl: `${ cdn }/public/views/admin/appleIdPage.html`,
    })
    .state('admin.addAppleId', {
      url: '/addAppleId',
      controller: 'AdminAddAppleIdController',
      templateUrl: `${ cdn }/public/views/admin/addAppleId.html`,
    })
    .state('admin.editAppleId', {
      url: '/appleid/:recordId/edit',
      controller: 'AdminEditAppleIdController',
      templateUrl: `${ cdn }/public/views/admin/editAppleId.html`,
    });
  }])
;
