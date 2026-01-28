const app = angular.module('app');

app.controller('AdminServerCommandController', ['$scope', '$http', '$state', '$mdDialog',
  ($scope, $http, $state, $mdDialog) => {
    $scope.setTitle('常用命令');
    $scope.setMenuButton('arrow_back', () => {
      $state.go('admin.settings');
    });
    $scope.setMenuSearchButton('search');
    $scope.commands = [];
    $scope.loading = true;

    const getCommands = () => {
      $scope.loading = true;
      $http.get('/api/admin/serverCommand').then(success => {
        $scope.commands = success.data;
        $scope.loading = false;
      }).catch(err => {
        console.log(err);
        $scope.loading = false;
      });
    };

    getCommands();

    $scope.showCommand = (name) => {
      if(!$scope.menuSearch.text) { return true; }
      return name.toLowerCase().indexOf($scope.menuSearch.text.toLowerCase()) >= 0;
    };

    $scope.addCommand = () => {
      $state.go('admin.addServerCommand');
    };

    $scope.editCommand = (id) => {
      $state.go('admin.editServerCommand', { id });
    };

    $scope.copyToClipboard = (text, fieldName, event) => {
      if (event) {
        event.stopPropagation();
      }
      if (!text) {
        $scope.toast('该字段为空');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          $scope.toast(fieldName + ' 已复制');
        }).catch(err => {
          console.error('复制失败:', err);
          $scope.toast('复制失败');
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          $scope.toast(fieldName + ' 已复制');
        } catch (err) {
          console.error('复制失败:', err);
          $scope.toast('复制失败');
        }
        document.body.removeChild(textarea);
      }
    };

    $scope.setFabButton(() => {
      $scope.addCommand();
    }, 'add');
  }
])
.controller('AdminAddServerCommandController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    $scope.setTitle('添加命令');
    $scope.setMenuButton('arrow_back', 'admin.serverCommand');
    
    $scope.command = {
      name: '',
      server_command: '',
      type: 'server'
    };

    $scope.addCommand = () => {
      if (!$scope.command.name || !$scope.command.server_command || !$scope.command.type) {
        $scope.toast('请填写完整信息');
        return;
      }

      $http.post('/api/admin/serverCommand', $scope.command).then(success => {
        $scope.toast('添加成功');
        $state.go('admin.serverCommand');
      }).catch(err => {
        console.log(err);
        $scope.toast('添加失败');
      });
    };
  }
])
.controller('AdminEditServerCommandController', ['$scope', '$http', '$state', '$stateParams', '$mdDialog',
  ($scope, $http, $state, $stateParams, $mdDialog) => {
    $scope.setTitle('编辑命令');
    $scope.setMenuButton('arrow_back', 'admin.serverCommand');
    
    $scope.command = {};
    $scope.loading = true;

    const id = $stateParams.id;

    $http.get('/api/admin/serverCommand/' + id).then(success => {
      $scope.command = success.data;
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取命令信息失败');
    });

    $scope.deleteCommand = () => {
      const confirm = $mdDialog.confirm()
        .title('删除命令')
        .textContent(`确定要删除命令 ${$scope.command.name} 吗？`)
        .ok('确定')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        $http.delete('/api/admin/serverCommand/' + id).then(() => {
          $scope.toast('删除成功');
          $state.go('admin.serverCommand');
        }).catch(err => {
          console.log(err);
          $scope.toast('删除失败');
        });
      });
    };

    $scope.editCommand = () => {
      if (!$scope.command.name || !$scope.command.server_command || !$scope.command.type) {
        $scope.toast('请填写完整信息');
        return;
      }

      $http.put('/api/admin/serverCommand/' + id, $scope.command).then(success => {
        $scope.toast('编辑成功');
        $state.go('admin.serverCommand');
      }).catch(err => {
        console.log(err);
        $scope.toast('编辑失败');
      });
    };
  }
]);
