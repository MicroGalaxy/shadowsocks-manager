const app = angular.module('app');

app.controller('AdminController', ['$scope', '$mdMedia', '$mdSidenav', '$state', '$http', '$document', '$interval', '$timeout', '$localStorage', 'configManager',
  ($scope, $mdMedia, $mdSidenav, $state, $http, $document, $interval, $timeout, $localStorage, configManager) => {
    const config = configManager.getConfig();
    if(config.status === 'normal') {
      return $state.go('user.index');
    } else if(!config.status) {
      return $state.go('home.index');
    } else {
      $scope.setMainLoading(false);
    }
    $scope.setConfig(config);
    $scope.setId(config.id);

    $scope.innerSideNav = true;
    $scope.sideNavWidth = () => {
      if($scope.innerSideNav) {
        return {
          width: '200px',
        };
      } else {
        return {
          width: '60px',
        };
      }
    };
    $scope.menus = [{
      name: '首页',
      icon: 'home',
      click: 'admin.index',
    }, {
      name: '服务器',
      icon: 'cloud',
      click: 'admin.server',
      hide: !!($scope.id !== 1),
    }, {
      name: '中转机',
      icon: 'router',
      click: 'admin.forward',
      hide: !!($scope.id !== 1),
    }, {
      name: 'DNS记录',
      icon: 'dns',
      click: 'admin.dnsRecord',
      hide: !!($scope.id !== 1),
    }, {
      name: '用户',
      icon: 'people',
      click: 'admin.user',
    }, {
      name: '账号',
      icon: 'account_circle',
      click: 'admin.account',
    }, {
      name: '订单',
      icon: 'attach_money',
      click: 'admin.pay',
      hide: !($scope.config.paypal || $scope.config.giftcard || $scope.config.refCode || $scope.config.alipay),
    }, {
      name: '设置',
      icon: 'settings',
      click: 'admin.settings',
    }, {
      name: 'divider',
    }, {
      name: '退出',
      icon: 'exit_to_app',
      click: function() {
        $http.post('/api/home/logout').then(() => {
          $localStorage.home = {};
          $localStorage.admin = {};
          configManager.deleteConfig();
          $state.go('home.index');
        });
      },
    }];
    $scope.menuButton = function() {
      if($scope.menuButtonIcon) {
        return $scope.menuButtonClick();
      }
      if ($mdMedia('gt-sm')) {
        $scope.innerSideNav = !$scope.innerSideNav;
      } else {
        $mdSidenav('left').toggle();
      }
    };
    $scope.menuClick = (index) => {
      $mdSidenav('left').close();
      if(typeof $scope.menus[index].click === 'function') {
        $scope.menus[index].click();
      } else {
        $state.go($scope.menus[index].click);
      }
    };
    $scope.title = '';
    $scope.setTitle = str => { $scope.title = str; };
    $scope.fabButton = false;
    $scope.fabNumber = null;
    $scope.fabButtonIcon = '';
    $scope.fabButtonClick = () => {};
    $scope.setFabButton = (fn, icon = '') => {
      $scope.fabButtonIcon = icon;
      if(!fn) {
        $scope.fabButton = false;
        $scope.fabButtonClick = () => {};
        return;
      }
      $scope.fabButton = true;
      $scope.fabButtonClick = fn;
    };
    $scope.setFabNumber = number => {
      $scope.fabNumber = number;
    };
    $scope.menuButtonIcon = '';
    $scope.menuButtonClick = () => {};

    let isHistoryBackClick = false;
    let menuButtonHistoryBackState = '';
    let menuButtonHistoryBackStateParams = {};
    const menuButtonBackFn = (to, toParams = {}) => {
      if(menuButtonHistoryBackState) {
        return function () {
          isHistoryBackClick = true;
          $state.go(menuButtonHistoryBackState, menuButtonHistoryBackStateParams);
        };
      } else {
        return function () {
          isHistoryBackClick = false;
          $state.go(to, toParams);
        };
      }
    };
    $scope.setMenuButton = (icon, to, toParams = {}) => {
      $scope.menuButtonIcon = icon;
      if(typeof to === 'string') {
        $scope.menuButtonClick = menuButtonBackFn(to, toParams);
      } else {
        isHistoryBackClick = true;
        $scope.menuButtonClick = to;
      }
    };
    $scope.menuRightButtonIcon = '';
    $scope.menuRightButtonClick = () => {
      $scope.$broadcast('RightButtonClick', 'click');
    };
    $scope.setMenuRightButton = (icon) => {
      $scope.menuRightButtonIcon = icon;
    };
    $scope.menuSearchButtonIcon = '';
    $scope.menuSearch = {
      input: false,
      text: '',
    };
    $scope.menuSearchButtonClick = () => {
      $scope.menuSearch.input = true;
    };
    $scope.setMenuSearchButton = (icon) => {
      $scope.menuSearchButtonIcon = icon;
    };
    $scope.cancelSearch = () => {
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
      $scope.$broadcast('cancelSearch', 'cancel');
    };
    $scope.interval = null;
    $scope.setInterval = interval => {
      $scope.interval = interval;
    };
    $scope.$on('$stateChangeStart', function(event, toUrl, fromUrl) {
      $scope.fabButton = false;
      $scope.fabNumber = null;
      $scope.fabButtonIcon = '';
      $scope.title = '';
      $scope.menuButtonIcon = '';
      $scope.menuRightButtonIcon = '';
      $scope.menuSearchButtonIcon = '';
      $scope.menuSearch.text = '';
      $scope.menuSearch.input = false;
      $scope.interval && $interval.cancel($scope.interval);
      if(!isHistoryBackClick) {
        const str = angular.copy($state.current.name);
        const obj = angular.copy($state.params);
        menuButtonHistoryBackState = str;
        menuButtonHistoryBackStateParams = obj;
      } else {
        isHistoryBackClick = false;
        menuButtonHistoryBackState = '';
        menuButtonHistoryBackStateParams = {};
      }
    });
  }
])
.controller('AdminIndexController', ['$scope', '$state', 'adminApi', '$localStorage', '$interval', 'orderDialog',
  ($scope, $state, adminApi, $localStorage, $interval, orderDialog) => {
    // 确保 setTitle 函数存在
    if (!$scope.setTitle) {
      $scope.setTitle = str => { $scope.title = str; };
    }
    $scope.setTitle('首页');
    if($localStorage.admin.indexInfo) {
      $scope.signupUsers = $localStorage.admin.indexInfo.data.signup;
      $scope.loginUsers = $localStorage.admin.indexInfo.data.login;
      $scope.orders = $localStorage.admin.indexInfo.data.order;
      $scope.paypalOrders = $localStorage.admin.indexInfo.data.paypalOrder;
      $scope.topFlow = $localStorage.admin.indexInfo.data.topFlow;
      $scope.last5minFlow = $localStorage.admin.indexInfo.data.last5minFlow;
      $scope.sharedIpStats = $localStorage.admin.indexInfo.data.sharedIpStats;
      $scope.systemStats = $localStorage.admin.indexInfo.data.systemStats;
    }
    // 跳转到用户详情页 - 用于最近注册用户
    $scope.toUserById = userId => {
      $state.go('admin.userPage', { userId: userId });
    };
    
    // 跳转到账号详情页 - 用于账号相关的跳转
    $scope.toAccountById = accountId => {
      $state.go('admin.accountPage', { accountId: accountId });
    };
    
    // 通用跳转方法 - 兼容现有的复杂逻辑，用于即将过期账号等混合数据
    $scope.toUser = userIdOrAccount => {
      // 如果传入的是数字，说明是用户ID（最近注册用户）
      if(typeof userIdOrAccount === 'number') {
        $scope.toUserById(userIdOrAccount);
      } else {
        // 如果传入的是对象，判断是用户还是账号
        if(userIdOrAccount.mac) {
          // MAC地址存在，说明是用户，跳转到用户详情页
          $scope.toUserById(userIdOrAccount.userId);
        } else {
          // 否则是账号，跳转到账号详情页
          $scope.toAccountById(userIdOrAccount.id);
        }
      }
    };
    // 账号颜色逻辑，参考 adminAccount.js
    $scope.accountColor = account => {
      const now = Date.now();
      
      if (account.type === 1) {
        return {
          background: 'blue-50', 'border-color': 'blue-300',
        };
      } else if (account.data && account.data.expire <= now) {
        return {
          background: 'red-50', 'border-color': 'red-300',
        };
      } else if (account.data && account.data.expire > now) {
        const sevenDaysEnd = new Date(new Date().setHours(23, 59, 59, 999) + 7 * 24 * 60 * 60 * 1000).getTime();
        if (account.data.expire <= sevenDaysEnd) {
          return {
            background: 'yellow-50', 'border-color': 'yellow-300',
          };
        }
      } else if (account.autoRemove) {
        return {
          background: 'lime-50', 'border-color': 'lime-300',
        };
      }
      return {};
    };
    $scope.copyRenewTopic = (account) => {
      adminApi.copyRenewTopic(account, $scope.toast);
    };
    $scope.copyRenewTopic = (account) => {
      adminApi.copyRenewTopic(account, $scope.toast);
    };
    $scope.toRecentSignup = () => {
      $state.go('admin.recentSignup');
    };
    $scope.toExpiringSoon = () => {
      $state.go('admin.expiringSoon');
    };
    $scope.toTopFlow = () => {
      $state.go('admin.topFlow');
    };
    $scope.toLast5MinFlow = () => {
      $state.go('admin.last5MinFlow');
    };
    $scope.toAccountByPort = port => {
      // 通过端口查找账号ID并跳转
      adminApi.getAccountByPort(port).then(account => {
        if(account && account.id) {
          $state.go('admin.accountPage', { accountId: account.id });
        }
      }).catch(() => {
        $scope.toast('未找到该账号');
      });
    };
    $scope.toPay = type => {
      $state.go('admin.pay', { myPayType: type });
    };
    const updateIndexInfo = () => {
      adminApi.getIndexInfo().then(success => {
        $localStorage.admin.indexInfo = {
          time: Date.now(),
          data: success,
        };
        $scope.signupUsers = success.signup;
        $scope.loginUsers = success.login;
        $scope.orders = success.order;
        $scope.paypalOrders = success.paypalOrder;
        $scope.topFlow = success.topFlow;
        $scope.last5minFlow = success.last5minFlow;
        $scope.sharedIpStats = success.sharedIpStats;
        $scope.systemStats = success.systemStats;
      });
    };
    updateIndexInfo();
    $scope.$on('visibilitychange', (event, status) => {
      if(status === 'visible') {
        if($localStorage.admin.indexInfo && Date.now() - $localStorage.admin.indexInfo.time >= 15 * 1000) {
          updateIndexInfo();
        }
      }
    });
    $scope.setInterval($interval(() => {
      if($localStorage.admin.indexInfo && Date.now() - $localStorage.admin.indexInfo.time >= 90 * 1000) {
        updateIndexInfo();
      }
    }, 15 * 1000));
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
    $scope.toTopUser = top => {
      if(top.email) {
        $state.go('admin.userPage', { userId: top.userId });
      } else {
        $state.go('admin.accountPage', { accountId: top.accountId });
      }
    };
    $scope.toSharedIpStats = () => {
      $state.go('admin.sharedIpStats');
    };
    $scope.toSharedIp = (port) => {
      console.log('toSharedIp called with port:', port);
      $state.go('admin.sharedIp', { port: port });
    };
  }
])
.controller('AdminRecentSignupController', ['$scope', '$http', '$state', ($scope, $http, $state) => {
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
  $scope.setTitle('最新注册用户');
  $scope.setMenuButton('arrow_back', 'admin.index');
  $scope.recentUsers = null;
  $http.get('/api/admin/user/recentSignup?number=100').then(success => {
    $scope.recentUsers = success.data;
  });
  $scope.toUser = id => {
    $state.go('admin.userPage', { userId: id });
  };
}])
.controller('AdminExpiringSoonController', ['$scope', '$http', '$state', 'adminApi', ($scope, $http, $state, adminApi) => {
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
  if (!$scope.toast) {
    $scope.toast = (message) => {
      // 简单的toast实现，实际应该使用$mdToast
      console.log('Toast:', message);
    };
  }
  $scope.setTitle('即将过期账号');
  $scope.setMenuButton('arrow_back', 'admin.index');
  $scope.recentUsers = null;
  $http.get('/api/admin/account/expiringSoon?number=1000').then(success => {
    $scope.recentUsers = success.data;
  });
  $scope.toUser = account => {
    if(account.mac) {
      $state.go('admin.userPage', { userId: account.userId });
    } else {
      $state.go('admin.accountPage', { accountId: account.id });
    }
  };
  // 账号颜色逻辑，参考 adminAccount.js
  $scope.accountColor = account => {
    const now = Date.now();
    
    if (account.type === 1) {
      return {
        background: 'blue-50', 'border-color': 'blue-300',
      };
    } else if (account.data && account.data.expire <= now) {
      return {
        background: 'red-50', 'border-color': 'red-300',
      };
    } else if (account.data && account.data.expire > now) {
      const sevenDaysEnd = new Date(new Date().setHours(23, 59, 59, 999) + 7 * 24 * 60 * 60 * 1000).getTime();
      if (account.data.expire <= sevenDaysEnd) {
        return {
          background: 'yellow-50', 'border-color': 'yellow-300',
        };
      }
    } else if (account.autoRemove) {
      return {
        background: 'lime-50', 'border-color': 'lime-300',
      };
    }
    return {};
  };
  $scope.copyRenewTopic = (account) => {
    let date = new Date(account.data.expire);
    let year = date.getFullYear();
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let day = ('0' + date.getDate()).slice(-2);
    let dateString = `${year}-${month}-${day}`;
    let price = 90;
    let flowInMultiply = account.data.flow / 50000000000;
  
    // 默认半年付
    let orderName = '半年';
    let orderDays = 180;
    let orderInMultiply = 1;
  
    // 年付
    if (account.orderId == 9) {
      orderName = '一年';
      orderDays = 360;
      orderInMultiply = 2;
    }
  
    let totalPrice = price * flowInMultiply * orderInMultiply;
    let renewTopic = `账号${account.port}，即将在${dateString}到期，续费是${totalPrice}元${orderName}（${orderDays}天，每月${(account.data.flow / 1000000000).toFixed(0)}G），续费的话转给我就可以了，我收到后给你续上`;
  
    // 复制 renewTopic 到剪贴板
    navigator.clipboard.writeText(renewTopic).then(() => {
      $scope.toast('续费话术已复制到剪贴板');
    });
  };
}])
.controller('AdminTopFlowController', ['$scope', '$http', '$state', ($scope, $http, $state) => {
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
  $scope.setTitle('今日流量排行');
  $scope.setMenuButton('arrow_back', 'admin.index');
  $scope.topUsers = null;
  $scope.allFlow = 0;
  $http.get('/api/admin/flow/top?number=150').then(success => {
    $scope.topUsers = success.data;
    $scope.allFlow = success.data.reduce((a, b) => ({
      sumFlow: a.sumFlow + b.sumFlow,
    }), { sumFlow: 0 }).sumFlow;
  });
  $scope.toUser = user => {
    if(user.email) {
      $state.go('admin.userPage', { userId: user.userId });
    } else {
      $state.go('admin.accountPage', { accountId: user.accountId });
    }
  };
}])
.controller('AdminLast5MinFlowController', ['$scope', '$http', '$state', 'adminApi', function($scope, $http, $state, adminApi) {
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
  $scope.setTitle('最近5分钟流量');
  $scope.setMenuButton('arrow_back', 'admin.index');
  
  $scope.last5MinFlowList = [];
  $scope.isLoading = true;
  $scope.currentPage = 1;
  $scope.pageSize = 20;
  $scope.totalCount = 0;
  $scope.totalPages = 0;
  $scope.last5minFlowAllFlow = 0;
  $scope.last5minFlowAccountCount = 0;

  // 获取流量数据
  $scope.loadStats = function() {
    $scope.isLoading = true;
    
    // 确保 $http 和 $http.get 方法存在
    if (!$http || typeof $http.get !== 'function') {
        console.error('$http or $http.get is not available. Cannot make HTTP request.');
        $scope.isLoading = false;
        $scope.toast('系统错误：无法进行网络请求。');
        return;
    }

    const httpRequest = $http.get(`/api/admin/flow/last5min?page=${$scope.currentPage}&pageSize=${$scope.pageSize}`);

    if (!httpRequest || typeof httpRequest.then !== 'function') {
        console.error('HTTP request did not return a valid Promise. Cannot call .then().');
        $scope.isLoading = false;
        $scope.toast('系统错误：网络请求异常。');
        return;
    }

    httpRequest.then(function(response) {
        if (!response.data || !response.data.data) {
            console.warn('API response data is null or malformed:', response);
            $scope.last5MinFlowList = [];
            $scope.totalCount = 0;
            $scope.totalPages = 0;
            $scope.last5minFlowAccountCount = 0;
            $scope.last5minFlowAllFlow = 0;
            $scope.isLoading = false;
            return; // 提前退出
        }

        $scope.last5MinFlowList = response.data.data;
        $scope.totalCount = response.data.totalCount;
        $scope.totalPages = response.data.totalPages;
        
        // 计算总流量和账号数量
        $scope.last5minFlowAccountCount = response.data.totalCount;
        // 使用后端返回的总流量数据，而不是基于当前页数据计算
        $scope.last5minFlowAllFlow = (response.data.totalFlow || 0) * 1000 * 1000;

        $scope.isLoading = false;
    })
    .catch(function(err) {
        console.error('Failed to fetch last 5 min flow stats', err, err.stack);
        $scope.isLoading = false;
        $scope.toast('无法加载流量数据。');
    });
  };

  // 初始加载
  $scope.loadStats();

  // 下一页
  $scope.nextPage = function() {
    if ($scope.currentPage < $scope.totalPages) {
        $scope.currentPage++;
        $scope.loadStats();
    }
  };

  // 上一页
  $scope.previousPage = function() {
    if ($scope.currentPage > 1) {
        $scope.currentPage--;
        $scope.loadStats();
    }
  };

  // 获取排名 (如果需要，可以添加)
  $scope.getRank = function(index) {
      return ($scope.currentPage - 1) * $scope.pageSize + index + 1;
  };

  $scope.toUserById = userId => {
    // 通过用户ID直接跳转
    $state.go('admin.userPage', { userId: userId });
  };
  $scope.toAccountByPort = port => {
    // 通过端口查找账号ID并跳转
    adminApi.getAccountByPort(port).then(account => {
      if(account && account.id) {
        $state.go('admin.accountPage', { accountId: account.id });
      }
    }).catch(() => {
      $scope.toast('未找到该账号');
    });
  };
}])
.controller('AdminPayController', ['$scope', 'adminApi', 'orderDialog', '$mdMedia', '$localStorage', 'orderFilterDialog', '$timeout', '$state', '$stateParams',
  ($scope, adminApi, orderDialog, $mdMedia, $localStorage, orderFilterDialog, $timeout, $state, $stateParams) => {
    $scope.setTitle('订单');
    $scope.setMenuSearchButton('search');
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
    $scope.myPayType = '';
    let tabSwitchTime = 0;
    $scope.payTypes = [];
    if($scope.config.alipay) { $scope.payTypes.push({ name: '支付宝' }); }
    if($scope.config.paypal) { $scope.payTypes.push({ name: 'Paypal' }); }
    if($scope.config.giftcard) { $scope.payTypes.push({ name: '充值码' }); }
    if($scope.config.refCode) { $scope.payTypes.push({ name: '邀请码' }); }
    if($scope.payTypes.length) {
      $scope.myPayType = $stateParams.myPayType || $scope.payTypes[0].name;
      $scope.defaultTabIndex = 0;
      for(const pt of $scope.payTypes) {
        if(pt.name === $scope.myPayType) {
          break;
        }
        $scope.defaultTabIndex += 1;
      }
    }
    
    $scope.selectPayType = type => {
      tabSwitchTime = Date.now();
      $scope.myPayType = type;
      $scope.orders = [];
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.getOrders();
    };
    if(!$localStorage.admin.orderFilterSettings) {
      $localStorage.admin.orderFilterSettings = {
        filter: {
          CREATE: true,
          WAIT_BUYER_PAY: true,
          TRADE_SUCCESS: true,
          FINISH: true,
          TRADE_CLOSED: true,
        },
        group: -1,
      };
    }
    $scope.orderFilter = $localStorage.admin.orderFilterSettings;
    $scope.currentPage = 1;
    $scope.isOrderLoading = false;
    $scope.isOrderPageFinish = false;
    $scope.orders = [];
    const getPageSize = () => {
      if($mdMedia('xs')) { return 30; }
      if($mdMedia('sm')) { return 30; }
      if($mdMedia('md')) { return 40; }
      if($mdMedia('gt-md')) { return 50; }
    };
    $scope.getOrders = search => {
      if(!$scope.payTypes.length) { return; }
      const oldTabSwitchTime = tabSwitchTime;
      $scope.isOrderLoading = true;
      adminApi.getOrder($scope.myPayType, {
        start: $scope.orderFilter.start,
        end: $scope.orderFilter.end,
        page: $scope.currentPage,
        pageSize: getPageSize(),
        search,
        // sort: $scope.userSort.sort,
        group: $scope.orderFilter.group,
        filter: Object.keys($scope.orderFilter.filter).filter(f => $scope.orderFilter.filter[f]),
      }).then(success => {
        if($state.current.name !== 'admin.pay') { return; }
        $scope.setFabNumber(success.total);
        if(oldTabSwitchTime !== tabSwitchTime) { return; }
        if(!search && $scope.menuSearch.text) { return; }
        if(search && search !== $scope.menuSearch.text) { return; }
        success.orders.forEach(f => {
          $scope.orders.push(f);
        });
        if(success.maxPage > $scope.currentPage) {
          $scope.currentPage++;
        } else {
          $scope.isOrderPageFinish = true;
        }
        $scope.isOrderLoading = false;
      }).catch(() => {
        if($state.current.name !== 'admin.pay') { return; }
        $timeout(() => {
          $scope.getOrders(search);
        }, 5000);
      });
    };
    $scope.$on('cancelSearch', () => {
      $scope.orders = [];
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.getOrders();
    });
    let timeoutPromise;
    const orderFilter = () => {
      $scope.orders = [];
      $scope.currentPage = 1;
      $scope.isOrderPageFinish = false;
      $scope.getOrders($scope.menuSearch.text);
    };
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.text) { return; }
      timeoutPromise && $timeout.cancel(timeoutPromise);
      timeoutPromise = $timeout(() => {
        orderFilter();
      }, 500);
    });
    $scope.view = (inview) => {
      if(!inview || $scope.isOrderLoading || $scope.isOrderPageFinish) { return; }
      $scope.getOrders();
    };
    $scope.setMenuRightButton('sort_by_alpha');
    $scope.orderFilterDialog = () => {
      orderFilterDialog.show($scope.id).then(() => {
        $scope.orders = [];
        $scope.currentPage = 1;
        $scope.isOrderPageFinish = false;
        $scope.getOrders();
      });
    };
    $scope.$on('RightButtonClick', () => {
      $scope.orderFilterDialog();
    });
    $scope.setFabButton(() => {
      adminApi.getCsvOrder($scope.myPayType, {
        start: $scope.orderFilter.start,
        end: $scope.orderFilter.end,
        group: $scope.orderFilter.group,
        filter: Object.keys($scope.orderFilter.filter).filter(f => $scope.orderFilter.filter[f]),
      });
    }, 'get_app');
  }
]);



