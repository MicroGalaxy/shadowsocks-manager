const app = angular.module('app');

app.controller('AdminForwardController', ['$scope', '$http', '$state', 'adminApi', '$mdDialog', '$mdMedia',
  ($scope, $http, $state, adminApi, $mdDialog, $mdMedia) => {
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

    $scope.getStatusText = (status) => {
      return status ? '启用' : '禁用';
    };

    $scope.getStatusColor = (status) => {
      return status ? '#4CAF50' : '#f44336';
    };

    $scope.setFabButton(() => {
      $scope.addForward();
    }, 'add');

    // Batch Operations Logic
    $scope.checkingPortAll = false;
    $scope.checkPortAll = () => {
        if ($scope.checkingPortAll) return;
        $scope.checkingPortAll = true;
        
        $http.post(`/config/check/all?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
        .then(success => {
            const res = success.data;
            if (res.result) {
                $scope.toast('批量检查成功: ' + res.message);
            } else {
                $scope.toast('批量检查失败: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            $scope.toast('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText));
        })
        .finally(() => {
            $scope.checkingPortAll = false;
        });
    };

    $scope.reloadingConfigAll = false;
    $scope.reloadConfigAll = () => {
        if ($scope.reloadingConfigAll) return;
        $scope.reloadingConfigAll = true;
        
        $http.post(`/config/reload/all?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
        .then(success => {
            const res = success.data;
            if (res.result) {
                $scope.toast('批量重载成功: ' + res.message);
            } else {
                $scope.toast('批量重载失败: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            $scope.toast('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText));
        })
        .finally(() => {
            $scope.reloadingConfigAll = false;
        });
    };

    $scope.checkingServerAll = false;
    $scope.checkServerAll = () => {
        if ($scope.checkingServerAll) return;
        $scope.checkingServerAll = true;
        
        $http.get(`/config/server/check/all?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
        .then(success => {
            const res = success.data;
            if (res.result) {
                $scope.toast('批量Server检查成功: ' + res.message);
            } else {
                $scope.toast('批量Server检查失败: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            $scope.toast('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText));
        })
        .finally(() => {
            $scope.checkingServerAll = false;
        });
    };

    $scope.targetServers = [];
    $scope.loadingTargetServers = false;
    
    // Lazy load target servers for the dialog
    const loadTargetServers = () => {
        if ($scope.targetServers.length > 0 || $scope.loadingTargetServers) return Promise.resolve();
        $scope.loadingTargetServers = true;
        return $http.get('/api/admin/forward/targetServers').then(success => {
            $scope.targetServers = success.data;
            $scope.loadingTargetServers = false;
        }).catch(() => {
            $scope.loadingTargetServers = false;
        });
    };

    $scope.openReselectRegionDialogAll = (ev) => {
        const cdn = window.cdn || '';
        loadTargetServers().then(() => {
            $mdDialog.show({
                controller: 'ReselectRegionDialogController',
                templateUrl: `${cdn}/public/views/admin/dialogs/reselectRegion.html`,
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: $mdMedia('xs') || false,
                locals: {
                    forwardId: 'all',
                    targetServers: $scope.targetServers
                }
            });
        });
    };

    $scope.openBatchExecuteCommandDialog = (ev) => {
      const cdn = window.cdn || '';
      $mdDialog.show({
          controller: 'ForwardExecuteCommandDialogController',
          templateUrl: `${cdn}/public/views/admin/dialogs/executeCommand.html`,
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          fullscreen: $mdMedia('xs'),
          locals: {
              forwardId: 'all'
          }
      });
    };
  }
])
.controller('AdminForwardPageController', ['$scope', '$http', '$state', '$stateParams', '$mdDialog', '$mdMedia',
  ($scope, $http, $state, $stateParams, $mdDialog, $mdMedia) => {
    $scope.$mdMedia = $mdMedia;
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

    $scope.checkingPort = false;
    $scope.checkPort = () => {
        if ($scope.checkingPort) return;
        $scope.checkingPort = true;
        
        // Use POST as requested, keeping params in URL
        $http.post(`/config/check/${forwardId}?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
        .then(success => {
            const res = success.data;
            if (res.result) {
                // If message is just "Success", maybe just show "检查成功"
                $scope.toast('检查成功: ' + res.message);
            } else {
                $scope.toast('检查失败: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            $scope.toast('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText));
        })
        .finally(() => {
            $scope.checkingPort = false;
        });
    };

    $scope.reloadingConfig = false;
    $scope.reloadConfig = () => {
        if ($scope.reloadingConfig) return;
        $scope.reloadingConfig = true;
        
        $http.post(`/config/reload/${forwardId}?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
        .then(success => {
            const res = success.data;
            if (res.result) {
                $scope.toast('重载成功: ' + res.message);
            } else {
                $scope.toast('重载失败: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            $scope.toast('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText));
        })
        .finally(() => {
            $scope.reloadingConfig = false;
        });
    };

    $scope.checkingServer = false;
    $scope.checkServer = () => {
        if ($scope.checkingServer) return;
        $scope.checkingServer = true;
        
        $http.get(`/config/server/check/${forwardId}?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
        .then(success => {
            const res = success.data;
            if (res.result) {
                $scope.toast('Server检查成功: ' + res.message);
            } else {
                $scope.toast('Server检查失败: ' + res.message);
            }
        })
        .catch(err => {
            console.error(err);
            $scope.toast('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText));
        })
        .finally(() => {
            $scope.checkingServer = false;
        });
    };

    $scope.openExecuteCommandDialog = (ev) => {
      const cdn = window.cdn || '';
      $mdDialog.show({
          controller: 'ForwardExecuteCommandDialogController',
          templateUrl: `${cdn}/public/views/admin/dialogs/executeCommand.html`,
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          fullscreen: $mdMedia('xs'),
          locals: {
              forwardId: forwardId
          }
      });
    };

    $scope.openReselectRegionDialog = (ev) => {
        const cdn = window.cdn || '';
        $mdDialog.show({
            controller: 'ReselectRegionDialogController',
            templateUrl: `${cdn}/public/views/admin/dialogs/reselectRegion.html`,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: $mdMedia('xs'),
            locals: {
                forwardId: forwardId,
                targetServers: $scope.targetServers
            }
        });
    };

    // Forward Port Module Logic
    $scope.ports = [];
    $scope.total = 0;
    $scope.loadingPorts = true;
    $scope.query = {
        page: 1,
        pageSize: 10
    };
    $scope.search = {
        port: '',
        address: '',
        serverId: ''
    };
    $scope.targetServers = [];

    // Load all available servers for filter (no port param = all servers)
    $http.get('/api/admin/forward/targetServers').then(success => {
        $scope.targetServers = success.data;
    });

    $scope.loadPorts = () => {
        $scope.loadingPorts = true;
        // Ensure page is valid
        if ($scope.query.page < 1) $scope.query.page = 1;
        
        const params = {
            page: $scope.query.page,
            pageSize: $scope.query.pageSize,
            searchPort: $scope.search.port,
            searchAddress: $scope.search.address,
            searchServerId: $scope.search.serverId
        };
        
        $http.get(`/api/admin/forward/${forwardId}/ports`, { params }).then(success => {
            $scope.ports = success.data.data;
            $scope.total = success.data.total;
            $scope.loadingPorts = false;
        }).catch(err => {
            console.error(err);
            $scope.loadingPorts = false;
        });
    };
    
    $scope.prevPage = () => {
        if ($scope.query.page > 1) {
            $scope.query.page--;
            $scope.loadPorts();
        }
    };

    $scope.nextPage = () => {
        if ($scope.query.page * $scope.query.pageSize < $scope.total) {
            $scope.query.page++;
            $scope.loadPorts();
        }
    };
    
    // Initial load
    $scope.loadPorts();

    $scope.openPortDialog = (ev, portItem) => {
        const cdn = window.cdn || '';
        $mdDialog.show({
            controller: 'ForwardPortDialogController',
            templateUrl: `${cdn}/public/views/admin/dialogs/forwardPort.html`,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: $mdMedia('xs'),
            locals: {
                forwardId: forwardId,
                portItem: portItem || null
            }
        }).then(() => {
            $scope.loadPorts();
        });
    };

    $scope.openBatchEditDialog = (ev) => {
        const cdn = window.cdn || '';
        $mdDialog.show({
            controller: 'BatchEditForwardPortDialogController',
            templateUrl: `${cdn}/public/views/admin/dialogs/batchEditForwardPort.html`,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: $mdMedia('xs'),
            locals: {
                forwardId: forwardId,
                targetServers: $scope.targetServers
            }
        }).then(() => {
            $scope.loadPorts();
        });
    };
  }
])
.controller('BatchEditForwardPortDialogController', ['$scope', '$http', '$mdDialog', 'forwardId', 'targetServers', '$mdToast', '$mdMedia',
    function($scope, $http, $mdDialog, forwardId, targetServers, $mdToast, $mdMedia) {
        $scope.$mdMedia = $mdMedia;
        $scope.servers = targetServers;
        
        $scope.form = {
            sourceHost: '',
            targetHost: ''
        };

        $scope.source = {
            selectedServer: null,
            ipMode: 'ipv4'
        };

        $scope.target = {
            selectedServer: null,
            ipMode: 'ipv4'
        };

        // Helper to determine IP mode based on server capability
        const determineIpMode = (server) => {
            if (server.ipMode === 16 && server.ipv6.length > 0) return 'ipv6';
            if (server.ipMode === 6 && server.ipv6.length > 0) return 'ipv6';
            if (server.ipv4.length > 0) return 'ipv4';
            return 'ipv6';
        };

        $scope.onSourceServerChange = () => {
            $scope.form.sourceHost = ''; // Reset host
            if ($scope.source.selectedServer) {
                $scope.source.ipMode = determineIpMode($scope.source.selectedServer);
                // Auto select first IP
                const ips = $scope.getSourceAvailableIps();
                if (ips.length > 0) $scope.form.sourceHost = ips[0];
            }
        };

        $scope.onTargetServerChange = () => {
            $scope.form.targetHost = ''; // Reset host
            if ($scope.target.selectedServer) {
                $scope.target.ipMode = determineIpMode($scope.target.selectedServer);
                // Auto select first IP
                const ips = $scope.getTargetAvailableIps();
                if (ips.length > 0) $scope.form.targetHost = ips[0];
            }
        };

        $scope.getSourceAvailableIps = () => {
            if (!$scope.source.selectedServer) return [];
            return $scope.source.ipMode === 'ipv4' ? $scope.source.selectedServer.ipv4 : $scope.source.selectedServer.ipv6;
        };

        $scope.getTargetAvailableIps = () => {
            if (!$scope.target.selectedServer) return [];
            return $scope.target.ipMode === 'ipv4' ? $scope.target.selectedServer.ipv4 : $scope.target.selectedServer.ipv6;
        };

        $scope.cancel = () => {
            $mdDialog.cancel();
        };

        $scope.save = () => {
            const confirm = $mdDialog.confirm()
                .title('确认批量修改')
                .textContent(`确定要将所有地址为 ${$scope.form.sourceHost} 的端口转发修改为 ${$scope.form.targetHost} 吗？`)
                .ok('确定')
                .cancel('取消');

            $mdDialog.show(confirm).then(() => {
                $http.post(`/api/admin/forward/${forwardId}/ports/batchEdit`, $scope.form).then(() => {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('批量修改成功')
                            .position('top right')
                            .hideDelay(3000)
                    );
                    $mdDialog.hide();
                }).catch(err => {
                    console.error(err);
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('错误: ' + (err.data || err.statusText))
                            .position('top right')
                            .hideDelay(3000)
                    );
                });
            });
        };
    }
])
.controller('ForwardPortDialogController', ['$scope', '$http', '$mdDialog', 'forwardId', 'portItem', '$timeout', '$mdToast',
    function($scope, $http, $mdDialog, forwardId, portItem, $timeout, $mdToast) {
        $scope.servers = [];
        $scope.isEdit = !!portItem;
        $scope.isLoadingServers = false;
        
        $scope.form = {
            port: portItem ? portItem.port : '',
            host: portItem ? portItem.host : '',
            selectedServer: null,
            ipMode: 'ipv4' // Default
        };
        
        // Function to fetch servers based on port
        const fetchServers = (port) => {
             if (!port) {
                 $scope.servers = [];
                 return;
             }
             $scope.isLoadingServers = true;
             $http.get('/api/admin/forward/targetServers', { params: { port: port } }).then(success => {
                 $scope.servers = success.data;
                 $scope.isLoadingServers = false;
                 
                 // If editing, try to match the existing host to a server
                 if ($scope.isEdit && $scope.servers.length > 0 && !$scope.form.selectedServer) {
                    for (const s of $scope.servers) {
                        if ((s.ipv4 && s.ipv4.includes($scope.form.host)) || (s.ipv6 && s.ipv6.includes($scope.form.host))) {
                            $scope.form.selectedServer = s;
                            // Determine IP mode
                            if (s.ipv4 && s.ipv4.includes($scope.form.host)) {
                                $scope.form.ipMode = 'ipv4';
                            } else {
                                $scope.form.ipMode = 'ipv6';
                            }
                            break;
                        }
                    }
                 }
             }).catch(err => {
                 console.error('Failed to load servers', err);
                 $scope.isLoadingServers = false;
             });
        };

        // If editing, load servers immediately for the existing port
        if ($scope.isEdit && $scope.form.port) {
            fetchServers($scope.form.port);
        }

        let portTimeout;
        $scope.onPortChange = () => {
             if (portTimeout) $timeout.cancel(portTimeout);
             portTimeout = $timeout(() => {
                 if ($scope.form.port) {
                     // Reset selection when port changes
                     $scope.form.selectedServer = null;
                     $scope.form.host = '';
                     fetchServers($scope.form.port);
                 } else {
                     $scope.servers = [];
                 }
             }, 500); // Debounce
        };

        $scope.cancel = () => {
            $mdDialog.cancel();
        };

        $scope.onServerChange = () => {
            // Reset host when server changes
            $scope.form.host = '';
            
            if ($scope.form.selectedServer) {
                const s = $scope.form.selectedServer;
                const ipMode = s.ipMode;
                const hasV4 = s.ipv4 && s.ipv4.length > 0;
                const hasV6 = s.ipv6 && s.ipv6.length > 0;

                // Smart selection logic based on ipMode
                if (ipMode === 16 && hasV6) { // IPV6Prefer
                    $scope.form.ipMode = 'ipv6';
                } else if (ipMode === 6 && hasV6) { // IPV6Only
                    $scope.form.ipMode = 'ipv6';
                } else if (hasV4) { // Default to V4 if available
                    $scope.form.ipMode = 'ipv4';
                } else if (hasV6) { // Fallback to V6
                    $scope.form.ipMode = 'ipv6';
                }

                // Auto select first available IP address
                const availableIps = $scope.getAvailableIps();
                if (availableIps.length > 0) {
                    $scope.form.host = availableIps[0];
                }
            }
        };

        $scope.getAvailableIps = () => {
            if (!$scope.form.selectedServer) return [];
            return $scope.form.ipMode === 'ipv4' ? $scope.form.selectedServer.ipv4 : $scope.form.selectedServer.ipv6;
        };

        $scope.save = () => {
            const data = {
                port: $scope.form.port,
                host: $scope.form.host
            };

            if ($scope.isEdit) {
                $http.put(`/api/admin/forward/${forwardId}/ports/${portItem.port}`, data).then(() => {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('修改成功')
                            .position('top right')
                            .hideDelay(3000)
                    );
                    $mdDialog.hide();
                }).catch(err => {
                    console.error(err);
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('错误: ' + (err.data || err.statusText))
                            .position('top right')
                            .hideDelay(3000)
                    );
                });
            } else {
                $http.post(`/api/admin/forward/${forwardId}/ports`, data).then(() => {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('添加成功')
                            .position('top right')
                            .hideDelay(3000)
                    );
                    $mdDialog.hide();
                }).catch(err => {
                    console.error(err);
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('错误: ' + (err.data || err.statusText))
                            .position('top right')
                            .hideDelay(3000)
                    );
                });
            }
        };
    }
])
.controller('ForwardExecuteCommandDialogController', ['$scope', '$http', '$mdDialog', 'forwardId',
  ($scope, $http, $mdDialog, forwardId) => {
    $scope.form = {};
    $scope.commands = [];
    $scope.loading = true;
    $scope.executing = false;
    $scope.result = '';
    
    $http.get('/api/admin/serverCommand', { params: { type: 'forward' } }).then(success => {
      $scope.commands = success.data;
      $scope.loading = false;
    });

    $scope.cancel = () => {
      $mdDialog.cancel();
    };

    $scope.execute = () => {
      if (!$scope.form.selectedCommand) return;
      
      $scope.executing = true;
      $http.post(`/api/admin/forward/${forwardId}/execute`, {
        commandId: $scope.form.selectedCommand.id
      }).then(success => {
        $scope.executing = false;
        $scope.result = success.data.output || 'Command executed successfully with no output.';
      }).catch(err => {
        $scope.executing = false;
        $scope.result = 'Error: ' + (err.data || err.statusText);
      });
    };
  }
])
.controller('AdminAddForwardController', ['$scope', '$http', '$state',
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
.controller('AdminEditForwardController', ['$scope', '$http', '$state', '$stateParams', '$mdDialog',
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

    $scope.deleteForward = () => {
      const confirm = $mdDialog.confirm()
        .title('删除中转机')
        .textContent(`确定要删除中转机 ${$scope.forward.name} 吗？`)
        .ok('确定')
        .cancel('取消');
      $mdDialog.show(confirm).then(() => {
        $http.delete('/api/admin/forward/' + forwardId).then(() => {
          $scope.toast('删除成功');
          $state.go('admin.forward');
        }).catch(err => {
          console.log(err);
          $scope.toast('删除失败');
        });
      });
    };

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
])
.controller('ReselectRegionDialogController', ['$scope', '$http', '$mdDialog', 'forwardId', 'targetServers', '$mdToast', '$mdMedia',
    function($scope, $http, $mdDialog, forwardId, targetServers, $mdToast, $mdMedia) {
        $scope.$mdMedia = $mdMedia;
        $scope.submitting = false;
        $scope.selectedRegion = 'all';
        $scope.regions = [];

        // Extract unique regions
        const regionSet = new Set();
        if (targetServers && Array.isArray(targetServers)) {
            targetServers.forEach(s => {
                if (s.region) {
                    regionSet.add(s.region);
                }
            });
        }
        $scope.regions = Array.from(regionSet).sort();

        $scope.cancel = () => {
            $mdDialog.cancel();
        };

        $scope.confirm = () => {
            $scope.submitting = true;
            $http.get(`/config/reselect/${forwardId}/${$scope.selectedRegion}?email=chockleen@gmail.com&password=5ed570e4b68d230e4556411abd687b11`)
            .then(success => {
                const res = success.data;
                 if (res.result) {
                    $mdToast.show($mdToast.simple().textContent('重配成功: ' + res.message).position('top right').hideDelay(3000));
                    $mdDialog.hide();
                } else {
                    $mdToast.show($mdToast.simple().textContent('重配失败: ' + res.message).position('top right').hideDelay(3000));
                }
                $scope.submitting = false;
            })
            .catch(err => {
                console.error(err);
                $mdToast.show($mdToast.simple().textContent('请求错误: ' + (err.data && err.data.message ? err.data.message : err.statusText)).position('top right').hideDelay(3000));
                $scope.submitting = false;
            });
        };
    }
]);
