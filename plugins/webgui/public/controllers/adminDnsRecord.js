const app = angular.module('app');

app.controller('AdminDnsRecordController', ['$scope', '$http', '$state', 'adminApi', '$mdDialog',
  ($scope, $http, $state, adminApi, $mdDialog) => {
    // 确保 setTitle 和 setMenuButton 函数存在
    if (!$scope.setTitle) {
        $scope.setTitle = str => { $scope.title = str; };
    }
    if (!$scope.setMenuButton) {
        $scope.setMenuButton = (icon, state, params) => {
            $scope.menuButtonIcon = icon;
            if (state) {
                $scope.menuButton = () => { 
                    if (params) {
                        $state.go(state, params);
                    } else {
                        $state.go(state);
                    }
                };
            }
        };
    }
    $scope.setTitle('DNS记录');
    $scope.setMenuSearchButton('search');
    $scope.records = [];
    $scope.loading = true;

    const getDnsRecords = () => {
      $scope.loading = true;
      $http.get('/api/admin/dns').then(success => {
        $scope.records = success.data;
        $scope.loading = false;
      }).catch(err => {
        console.log(err);
        $scope.loading = false;
      });
    };

    getDnsRecords();

    $scope.showRecord = (name) => {
      if(!$scope.menuSearch.text) { return true; }
      return name.toLowerCase().indexOf($scope.menuSearch.text.toLowerCase()) >= 0;
    };

    $scope.toRecordPage = (recordId) => {
      $state.go('admin.dnsRecordPage', { recordId });
    };

    $scope.addRecord = () => {
      $state.go('admin.addDnsRecord');
    };

    $scope.editRecord = (recordId) => {
      $state.go('admin.editDnsRecord', { recordId });
    };

    // 从CloudFlare同步
    $scope.syncFromCloudFlare = () => {
      const prompt = $mdDialog.prompt()
        .title('从CloudFlare同步')
        .textContent('请输入Zone ID:')
        .placeholder('Zone ID')
        .ok('同步')
        .cancel('取消');

      $mdDialog.show(prompt).then((zoneId) => {
        if (zoneId) {
          $scope.loading = true;
          $http.post('/api/admin/dns/sync', { zone_id: zoneId }).then(success => {
            $scope.toast(success.data.message);
            getDnsRecords();
          }).catch(err => {
            console.error('Sync failed:', err);
            $scope.toast('同步失败: ' + (err.data && err.data.error ? err.data.error : err.statusText));
            $scope.loading = false;
          });
        }
      });
    };

    $scope.getStatusText = (active) => {
      return active ? '激活' : '未激活';
    };

    $scope.getStatusColor = (active) => {
      return active ? '#4CAF50' : '#f44336';
    };

    $scope.getProxyText = (proxy) => {
      return proxy ? '代理' : '仅DNS';
    };

    $scope.getProxyColor = (proxy) => {
      return proxy ? '#FF9800' : '#2196F3';
    };

    $scope.setFabButton(() => {
      $scope.addRecord();
    }, 'add');

    $scope.setMenuRightButton('cloud_download');
    $scope.$on('RightButtonClick', () => {
      $scope.syncFromCloudFlare();
    });
  }
])
.controller('AdminDnsRecordPageController', ['$scope', '$http', '$state', '$stateParams',
  ($scope, $http, $state, $stateParams) => {
    // 确保 setTitle 和 setMenuButton 函数存在
    if (!$scope.setTitle) {
        $scope.setTitle = str => { $scope.title = str; };
    }
    if (!$scope.setMenuButton) {
        $scope.setMenuButton = (icon, state, params) => {
            $scope.menuButtonIcon = icon;
            if (state) {
                $scope.menuButton = () => { 
                    if (params) {
                        $state.go(state, params);
                    } else {
                        $state.go(state);
                    }
                };
            }
        };
    }
    $scope.setTitle('DNS记录详情');
    $scope.setMenuButton('arrow_back', 'admin.dnsRecord');
    $scope.record = {};
    $scope.loading = true;

    const recordId = $stateParams.recordId;

    $http.get('/api/admin/dns/' + recordId).then(success => {
      $scope.record = success.data;
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取DNS记录信息失败');
    });

    $scope.editRecord = () => {
      $state.go('admin.editDnsRecord', { recordId });
    };

    $scope.getStatusText = (active) => {
      return active ? '激活' : '未激活';
    };

    $scope.getProxyText = (proxy) => {
      return proxy ? '代理' : '仅DNS';
    };

    $scope.setFabButton(() => {
      $scope.editRecord();
    }, 'edit');
  }
])
.controller('AdminAddDnsRecordController', ['$scope', '$http', '$state',
  ($scope, $http, $state) => {
    // 确保 setTitle 和 setMenuButton 函数存在
    if (!$scope.setTitle) {
        $scope.setTitle = str => { $scope.title = str; };
    }
    if (!$scope.setMenuButton) {
        $scope.setMenuButton = (icon, state, params) => {
            $scope.menuButtonIcon = icon;
            if (state) {
                $scope.menuButton = () => { 
                    if (params) {
                        $state.go(state, params);
                    } else {
                        $state.go(state);
                    }
                };
            }
        };
    }
    $scope.setTitle('添加DNS记录');
    $scope.setMenuButton('arrow_back', 'admin.dnsRecord');
    
    $scope.record = {
      record_id: '',
      zone_id: '',
      name: '',
      content: '',
      comment: '',
      type: 'A',
      ttl: 300,
      proxy: false,
      active: true
    };

    $scope.recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'PTR', 'NS'];
    $scope.forwardDomains = [];

    // 获取激活的中转机域名
    $http.get('/api/admin/dns/forwards').then(success => {
      $scope.forwardDomains = success.data;
    }).catch(err => {
      console.log('Failed to load forward domains:', err);
    });

    $scope.addRecord = () => {
      if (!$scope.record.record_id || !$scope.record.zone_id || !$scope.record.name || !$scope.record.content) {
        $scope.toast('请填写必填字段');
        return;
      }

      console.log('Adding DNS record:', $scope.record);
      $http.post('/api/admin/dns', $scope.record).then(success => {
        $scope.toast('添加成功');
        $state.go('admin.dnsRecord');
      }).catch(err => {
        console.log(err);
        $scope.toast('添加失败: ' + (err.data && err.data.error ? err.data.error : err.statusText));
      });
    };
  }
])
.controller('AdminEditDnsRecordController', ['$scope', '$http', '$state', '$stateParams', '$mdDialog',
  ($scope, $http, $state, $stateParams, $mdDialog) => {
    // 确保 setTitle 和 setMenuButton 函数存在
    if (!$scope.setTitle) {
        $scope.setTitle = str => { $scope.title = str; };
    }
    if (!$scope.setMenuButton) {
        $scope.setMenuButton = (icon, state, params) => {
            $scope.menuButtonIcon = icon;
            if (state) {
                $scope.menuButton = () => { 
                    if (params) {
                        $state.go(state, params);
                    } else {
                        $state.go(state);
                    }
                };
            }
        };
    }
    $scope.setTitle('编辑DNS记录');
    $scope.setMenuButton('arrow_back', 'admin.dnsRecord');
    
    $scope.record = {};
    $scope.loading = true;
    $scope.recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'PTR', 'NS'];
    $scope.forwardDomains = [];

    const recordId = $stateParams.recordId;

    // 获取激活的中转机域名
    $http.get('/api/admin/dns/forwards').then(success => {
      $scope.forwardDomains = success.data;
    }).catch(err => {
      console.log('Failed to load forward domains:', err);
    });

    // 获取DNS记录详情
    $http.get('/api/admin/dns/' + recordId).then(success => {
      $scope.record = success.data;
      $scope.loading = false;
    }).catch(err => {
      console.log(err);
      $scope.loading = false;
      $scope.toast('获取DNS记录信息失败');
    });

    $scope.deleteRecord = () => {
      const confirm = $mdDialog.confirm()
        .title('删除DNS记录')
        .textContent(`确定要删除DNS记录 ${$scope.record.name} 吗？`)
        .ok('确定')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        $http.delete('/api/admin/dns/' + recordId).then(() => {
          $scope.toast('删除成功');
          $state.go('admin.dnsRecord');
        }).catch(err => {
          console.log(err);
          $scope.toast('删除失败: ' + (err.data && err.data.error ? err.data.error : err.statusText));
        });
      });
    };

    $scope.editRecord = () => {
      if (!$scope.record.record_id || !$scope.record.zone_id || !$scope.record.name || !$scope.record.content) {
        $scope.toast('请填写必填字段');
        return;
      }

      console.log('Editing DNS record:', $scope.record);
      $http.put('/api/admin/dns/' + recordId, $scope.record).then(success => {
        console.log('Edit success:', success);
        $scope.toast('编辑成功');
        $state.go('admin.dnsRecord');
      }).catch(err => {
        console.error('Edit failed:', err);
        $scope.toast('编辑失败: ' + (err.data && err.data.error ? err.data.error : err.statusText));
      });
    };
  }
]);
