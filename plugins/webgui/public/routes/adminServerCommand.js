const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.serverCommand', {
      url: '/serverCommand',
      controller: 'AdminServerCommandController',
      templateUrl: `${ cdn }/public/views/admin/serverCommand.html`,
    })
    .state('admin.addServerCommand', {
      url: '/addServerCommand',
      controller: 'AdminAddServerCommandController',
      templateUrl: `${ cdn }/public/views/admin/addServerCommand.html`,
    })
    .state('admin.editServerCommand', {
      url: '/serverCommand/:id/edit',
      controller: 'AdminEditServerCommandController',
      templateUrl: `${ cdn }/public/views/admin/editServerCommand.html`,
    });
  }])
;
