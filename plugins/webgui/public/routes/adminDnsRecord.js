const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.dnsRecord', {
      url: '/dns',
      controller: 'AdminDnsRecordController',
      templateUrl: `${ cdn }/public/views/admin/dnsRecord.html`,
    })
    .state('admin.dnsRecordPage', {
      url: '/dns/:recordId',
      controller: 'AdminDnsRecordPageController',
      templateUrl: `${ cdn }/public/views/admin/dnsRecordPage.html`,
    })
    .state('admin.addDnsRecord', {
      url: '/addDnsRecord',
      controller: 'AdminAddDnsRecordController',
      templateUrl: `${ cdn }/public/views/admin/addDnsRecord.html`,
    })
    .state('admin.editDnsRecord', {
      url: '/dns/:recordId/edit',
      controller: 'AdminEditDnsRecordController',
      templateUrl: `${ cdn }/public/views/admin/editDnsRecord.html`,
    });
  }])
;