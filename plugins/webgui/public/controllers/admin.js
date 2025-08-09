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
    $scope.setTitle('首页');
    if($localStorage.admin.indexInfo) {
      $scope.signupUsers = $localStorage.admin.indexInfo.data.signup;
      $scope.loginUsers = $localStorage.admin.indexInfo.data.login;
      $scope.orders = $localStorage.admin.indexInfo.data.order;
      $scope.paypalOrders = $localStorage.admin.indexInfo.data.paypalOrder;
      $scope.topFlow = $localStorage.admin.indexInfo.data.topFlow;
      $scope.last5minFlow = $localStorage.admin.indexInfo.data.last5minFlow;
    }
    $scope.toUser = userIdOrAccount => {
      // 如果传入的是数字，说明是用户ID（最近注册用户）
      if(typeof userIdOrAccount === 'number') {
        $state.go('admin.userPage', { userId: userIdOrAccount });
      } else {
        // 如果传入的是对象，说明是账号对象（即将过期账号等）
        if(userIdOrAccount.mac) {
          $state.go('admin.userPage', { userId: userIdOrAccount.userId });
        } else {
          $state.go('admin.accountPage', { accountId: userIdOrAccount.id });
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
  }
])
.controller('AdminRecentSignupController', ['$scope', '$http', '$state', ($scope, $http, $state) => {
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
.controller('AdminLast5MinFlowController', ['$scope', '$http', '$state', 'adminApi', ($scope, $http, $state, adminApi) => {
  $scope.setTitle('最近5分钟流量');
  $scope.setMenuButton('arrow_back', 'admin.index');
  $scope.last5MinFlowList = null;
  $http.get('/api/admin/flow/last5min?number=100').then(success => {
    $scope.last5MinFlowList = success.data;
  });
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



