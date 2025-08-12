const app = angular.module('app');

app.controller('AdminForwardController', ['$scope', '$http', '$state', 'adminApi', '$mdDialog',
  ($scope, $http, $state, adminApi, $mdDialog) => {
    $scope.setTitle('中转机');
    $scope.setMenuSearchButton('search');
    $scope.forwards = [];
    $scope.loading = true;

    const getForwards = () => {
      $scope.loading = true;
      $http.get('/api/admin/forward').then(success => {
        $scope.forwards = success.data;
        $scope.loading = false;
      }).catch(err => {
        console.log(err);
        $scope.loading = false;
      });
    };

    getForwards();

    $scope.showForward = (name) => {
      if(!$scope.menuSearch.text) { return true; }
      return name.indexOf($scope.menuSearch.text) >= 0;
    };

    $scope.toForwardPage = (forwardId) => {
      $state.go('admin.forwardPage', { forwardId });
    };

    $scope.addForward = () => {
      $state.go('admin.addForward');
    };

    $scope.editForward = (forwardId) => {
      $state.go('admin.editForward', { forwardId });
    };

    $scope.deleteForward = (forward) => {
      const confirm = $mdDialog.confirm()
        .title('删除中转机')
        .textContent(`确定要删除中转机 ${forward.name} 吗？`)
        .ok('确定')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        $http.delete('/api/admin/forward/' + forward.id).then(() => {
          getForwards();
          $scope.toast('删除成功');
        }).catch(err => {
          console.log(err);
          $scope.toast('删除失败');
        });
      });
    };

    $scope.getStatusText = (status) => {
      return status ? '启用' : '禁用';
    };

    $scope.getStatusColor = (status) => {
      return status ? '#4CAF50' : '#f44336';
    };

    $scope.setFabButton(() => {
      $scope.addForward();
    }, 'add');
  }
])
.controller('AdminForwardPageController', ['$scope', '$http', '$state', '$stateParams',
  ($scope, $http, $state, $stateParams) => {
    $scope.setTitle('中转机详情');
    $scope.setMenuButton('arrow_back', 'admin.forward');
    $scope.forward = {};
    $scope.loading = true;

    const forwardId = $stateParams.forwardId;

    $http.get('/api/admin/forward/' + forwardId).then(success => {
      $scope.forward = success.data;
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取中转机信息失败');
    });

    $scope.editForward = () => {
      $state.go('admin.editForward', { forwardId });
    };

    $scope.getStatusText = (status) => {
      return status ? '启用' : '禁用';
    };

    $scope.setFabButton(() => {
      $scope.editForward();
    }, 'edit');
  }
])
.controller('AdminAddForwardController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    $scope.setTitle('添加中转机');
    $scope.setMenuButton('arrow_back', 'admin.forward');
    
    $scope.forward = {
      name: '',
      ipv4: '',
      ipv6: '',
      domain: '',
      ssh_user: '',
      ssh_password: '',
      ssh_port: '',
      nginx_name: '',
      nginx_path: '',
      control_port: '',
      status: true
    };

    $scope.addForward = () => {
      if (!$scope.forward.name) {
        $scope.toast('请填写中转机名称');
        return;
      }

      $http.post('/api/admin/forward', $scope.forward).then(success => {
        $scope.toast('添加成功');
        $state.go('admin.forward');
      }).catch(err => {
        console.log(err);
        $scope.toast('添加失败');
      });
    };
  }
])
.controller('AdminEditForwardController', ['$scope', '$http', '$state', '$stateParams',
  ($scope, $http, $state, $stateParams) => {
    $scope.setTitle('编辑中转机');
    $scope.setMenuButton('arrow_back', 'admin.forward');
    
    $scope.forward = {};
    $scope.loading = true;

    const forwardId = $stateParams.forwardId;

    $http.get('/api/admin/forward/' + forwardId).then(success => {
      $scope.forward = success.data;
      // 转换status为boolean
      $scope.forward.status = !!$scope.forward.status;
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取中转机信息失败');
    });

    $scope.editForward = () => {
      if (!$scope.forward.name) {
        $scope.toast('请填写中转机名称');
        return;
      }

      console.log('Editing forward:', $scope.forward);
      $http.put('/api/admin/forward/' + forwardId, $scope.forward).then(success => {
        console.log('Edit success:', success);
        $scope.toast('编辑成功');
        $state.go('admin.forward');
      }).catch(err => {
        console.error('Edit failed:', err);
        $scope.toast('编辑失败: ' + (err.data && err.data.message ? err.data.message : err.statusText));
      });
    };
  }
]);