const app = angular.module('app');
const cdn = window.cdn || '';

app.factory('setAccountServerDialog' , [ '$mdDialog', $mdDialog => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/setAccountServer.html`,
    escapeToClose: true,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', '$mdMedia', function($scope, bind, $mdMedia) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs')) {
          return { 'min-width': '85vw' };
        } else if($mdMedia('sm')) {
          return { 'min-width': '70vw' };
        }
        return { 'min-width': '405px' };
      };
      $scope.$watch('publicInfo.selectedRegion', function (newRegion, oldRegion) {
        if (newRegion) {
          // 清空所有选中的状态
          Object.keys($scope.publicInfo.account.accountServerObj).forEach(function (key) {
            $scope.publicInfo.account.accountServerObj[key] = false;
          });

          // 根据选中的地区更新对应服务器的选中状态
          $scope.publicInfo.servers.forEach(function (server) {
            let region = JSON.parse(server.comment).region; // 解析 server.comment 获取 region
            if (region === newRegion) {
              $scope.publicInfo.account.accountServerObj[server.id] = true;
            }
          });
        }
      }, true);
    }],
    clickOutsideToClose: true,
  };
  const show = (account, servers) => {
    publicInfo.account = account;
    publicInfo.servers = servers;
    publicInfo.regions = [...new Set(servers.map(element => JSON.parse(element.comment).region))]; // 去重地区列表
    publicInfo.selectedRegion = '';
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);
