const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin', {
      url: '/admin',
      abstract: true,
      templateUrl: `${ cdn }/public/views/admin/admin.html`,
      resolve: {
        myConfig: ['$http', 'configManager', ($http, configManager) => {
          if(configManager.getConfig().version) { return; }
          return $http.get('/api/home/login').then(success => {
            configManager.setConfig(success.data);
          });
        }]
      },
    })
    .state('admin.index', {
      url: '/index',
      controller: 'AdminIndexController',
      templateUrl: `${ cdn }/public/views/admin/index.html`,
    })
    .state('admin.pay', {
      url: '/pay',
      controller: 'AdminPayController',
      templateUrl: `${ cdn }/public/views/admin/pay.html`,
      params: {
        myPayType: null,
      },
    })
    .state('admin.recentSignup', {
      url: '/recentSignup',
      controller: 'AdminRecentSignupController',
      templateUrl: `${ cdn }/public/views/admin/recentSignup.html`,
    })
    .state('admin.expiringSoon', {
      url: '/expiringSoon',
      controller: 'AdminExpiringSoonController',
      templateUrl: `${ cdn }/public/views/admin/expiringSoon.html`,
    })
    .state('admin.topFlow', {
      url: '/topFlow',
      controller: 'AdminTopFlowController',
      templateUrl: `${ cdn }/public/views/admin/topFlow.html`,
    })
    .state('admin.last5MinFlow', {
      url: '/last5MinFlow',
      controller: 'AdminLast5MinFlowController',
      templateUrl: `${ cdn }/public/views/admin/last5MinFlow.html`,
    })
    .state('admin.unfinished', {
      url: '/unfinished',
      templateUrl: `${ cdn }/public/views/admin/unfinished.html`,
    })
    .state('admin.sharedIp', {
      url: '/shared-ip/:port',
      templateUrl: `${ cdn }/public/views/admin/sharedIp.html`,
      controller: 'AdminSharedIpController',
    });
  }
]);
