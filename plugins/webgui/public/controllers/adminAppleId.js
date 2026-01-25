const app = angular.module('app');

app.controller('AdminAppleIdController', ['$scope', '$http', '$state', '$mdDialog',
  ($scope, $http, $state, $mdDialog) => {
    $scope.setTitle('Apple ID');
    $scope.setMenuSearchButton('search');
    $scope.records = [];
    $scope.loading = true;

    const getAppleIds = () => {
      $scope.loading = true;
      $http.get('/api/admin/appleid').then(success => {
        $scope.records = success.data;
        $scope.loading = false;
      }).catch(err => {
        console.log(err);
        $scope.loading = false;
      });
    };

    getAppleIds();

    $scope.showRecord = (appleId) => {
      if(!$scope.menuSearch.text) { return true; }
      return appleId.toLowerCase().indexOf($scope.menuSearch.text.toLowerCase()) >= 0;
    };

    $scope.toRecordPage = (recordId) => {
      $state.go('admin.appleIdPage', { recordId });
    };

    $scope.addRecord = () => {
      $state.go('admin.addAppleId');
    };

    $scope.editRecord = (recordId) => {
      $state.go('admin.editAppleId', { recordId });
    };

    $scope.formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    $scope.copyToClipboard = (text, fieldName, event, isDate) => {
      if (event) {
        event.stopPropagation();
      }
      if (!text) {
        $scope.toast('该字段为空');
        return;
      }
      const copyText = isDate ? $scope.formatDate(text) : text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
          $scope.toast(fieldName + ' 已复制');
        }).catch(err => {
          console.error('复制失败:', err);
          $scope.toast('复制失败');
        });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = copyText;
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

    $scope.getStatusText = (status) => {
      return status ? '正常' : '异常';
    };

    $scope.getStatusColor = (status) => {
      return status ? '#4CAF50' : '#f44336';
    };

    $scope.getUsingText = (using) => {
      return using ? '使用中' : '空闲';
    };

    $scope.getUsingColor = (using) => {
      return using ? '#FF9800' : '#2196F3';
    };

    $scope.setFabButton(() => {
      $scope.addRecord();
    }, 'add');
  }
])
.controller('AdminAppleIdPageController', ['$scope', '$http', '$state', '$stateParams',
  ($scope, $http, $state, $stateParams) => {
    $scope.setTitle('Apple ID详情');
    $scope.setMenuButton('arrow_back', 'admin.appleId');
    $scope.record = {};
    $scope.loading = true;

    const recordId = $stateParams.recordId;

    $http.get('/api/admin/appleid/' + recordId).then(success => {
      $scope.record = success.data;
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取Apple ID信息失败');
    });

    $scope.editRecord = () => {
      $state.go('admin.editAppleId', { recordId });
    };

    $scope.formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    $scope.copyToClipboard = (text, fieldName, isDate) => {
      if (!text) {
        $scope.toast('该字段为空');
        return;
      }
      const copyText = isDate ? $scope.formatDate(text) : text;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
          $scope.toast(fieldName + ' 已复制');
        }).catch(err => {
          console.error('复制失败:', err);
          $scope.toast('复制失败');
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = copyText;
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

    $scope.getStatusText = (status) => {
      return status ? '正常' : '异常';
    };

    $scope.getUsingText = (using) => {
      return using ? '使用中' : '空闲';
    };

    $scope.getBooleanText = (value) => {
      return value ? '是' : '否';
    };

    $scope.setFabButton(() => {
      $scope.editRecord();
    }, 'edit');
  }
])
.controller('AdminAddAppleIdController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    $scope.setTitle('添加Apple ID');
    $scope.setMenuButton('arrow_back', 'admin.appleId');
    
    $scope.record = {
      apple_id: '',
      password: '',
      question_friend: '',
      question_work: '',
      question_parent: '',
      birthday: null,
      status: true,
      using: false,
      shadowrocket: false,
      icloud_photo_status: false
    };

    $scope.addRecord = () => {
      if (!$scope.record.apple_id || !$scope.record.password) {
        $scope.toast('请填写Apple ID和密码');
        return;
      }

      const data = Object.assign({}, $scope.record);
      if (data.birthday) {
        data.birthday = new Date(data.birthday).toISOString().split('T')[0];
      }

      $http.post('/api/admin/appleid', data).then(success => {
        $scope.toast('添加成功');
        $state.go('admin.appleId');
      }).catch(err => {
        console.log(err);
        $scope.toast('添加失败');
      });
    };
  }
])
.controller('AdminEditAppleIdController', ['$scope', '$http', '$state', '$stateParams', '$mdDialog',
  ($scope, $http, $state, $stateParams, $mdDialog) => {
    $scope.setTitle('编辑Apple ID');
    $scope.setMenuButton('arrow_back', 'admin.appleId');
    
    $scope.record = {};
    $scope.loading = true;

    const recordId = $stateParams.recordId;

    $http.get('/api/admin/appleid/' + recordId).then(success => {
      $scope.record = success.data;
      if ($scope.record.birthday) {
        $scope.record.birthday = new Date($scope.record.birthday);
      }
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取Apple ID信息失败');
    });

    $scope.deleteRecord = () => {
      const confirm = $mdDialog.confirm()
        .title('删除Apple ID')
        .textContent(`确定要删除Apple ID ${$scope.record.apple_id} 吗？`)
        .ok('确定')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        $http.delete('/api/admin/appleid/' + recordId).then(() => {
          $scope.toast('删除成功');
          $state.go('admin.appleId');
        }).catch(err => {
          console.log(err);
          $scope.toast('删除失败');
        });
      });
    };

    $scope.editRecord = () => {
      if (!$scope.record.apple_id || !$scope.record.password) {
        $scope.toast('请填写Apple ID和密码');
        return;
      }

      const data = Object.assign({}, $scope.record);
      if (data.birthday) {
        data.birthday = new Date(data.birthday).toISOString().split('T')[0];
      }

      $http.put('/api/admin/appleid/' + recordId, data).then(success => {
        $scope.toast('编辑成功');
        $state.go('admin.appleId');
      }).catch(err => {
        console.log(err);
        $scope.toast('编辑失败');
      });
    };
  }
]);
