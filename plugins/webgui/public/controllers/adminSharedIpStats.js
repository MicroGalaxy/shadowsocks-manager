const app = angular.module('app');

app.controller('AdminSharedIpStatsController', ['$scope', '$state', '$http', function($scope, $state, $http) {
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
    $scope.setTitle('共享IP热点统计');
    $scope.setMenuButton('arrow_back', 'admin.index');
    
    $scope.stats = [];
    $scope.isLoading = true;
    $scope.currentPage = 1;
    $scope.pageSize = 20;
    $scope.totalCount = 0;
    $scope.totalPages = 0;

    // 获取共享IP统计数据
    $scope.loadStats = function() {
        $scope.isLoading = true;
        
        $http.get('/api/admin/sharedip/stats', {
            params: {
                page: $scope.currentPage,
                pageSize: $scope.pageSize
            }
        })
        .then(function(response) {
            $scope.stats = response.data.data;
            $scope.totalCount = response.data.totalCount;
            $scope.totalPages = response.data.totalPages;
            $scope.isLoading = false;
        })
        .catch(function(err) {
            console.error('Failed to fetch shared IP stats', err);
            $scope.isLoading = false;
            $scope.error = '无法加载统计数据。';
        });
    };

    // 初始加载
    $scope.loadStats();

    // 获取总页数
    $scope.getTotalPages = function() {
        return $scope.totalPages;
    };

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

    // 获取排名
    $scope.getRank = function(index) {
        return ($scope.currentPage - 1) * $scope.pageSize + index + 1;
    };

    // 跳转到账号详情页
    $scope.toAccountById = function(accountId) {
        $state.go('admin.accountPage', { accountId: accountId });
    };

    // 跳转到共享IP详情页
    $scope.toSharedIp = function(port) {
        console.log('toSharedIp called with port:', port);
        $state.go('admin.sharedIp', { port: port });
    };
}]);
