const app = angular.module('app');

app.controller('AdminSharedIpController', ['$scope', '$state', '$stateParams', '$http', '$mdDialog', '$mdToast', function($scope, $state, $stateParams, $http, $mdDialog, $mdToast) {
    $scope.port = $stateParams.port;
    $scope.setTitle(`共享IP列表 [${$scope.port}]`);
    $scope.setMenuButton('arrow_back', 'admin.account');
    
    $scope.allRecords = [];
    $scope.paginatedRecords = [];
    $scope.isLoading = true;
    $scope.currentPage = 1;
    $scope.pageSize = 20; // 默认每页20条

    $http.get(`/api/admin/shared-ip/${$scope.port}`)
        .then(function(response) {
            $scope.allRecords = response.data;
            $scope.updatePaginatedRecords();
            $scope.isLoading = false;
        })
        .catch(function(err) {
            console.error('Failed to fetch shared IP records', err);
            $scope.isLoading = false;
            $scope.error = '无法加载记录。';
        });

    $scope.updatePaginatedRecords = function() {
        const start = ($scope.currentPage - 1) * $scope.pageSize;
        const end = start + $scope.pageSize;
        $scope.paginatedRecords = $scope.allRecords.slice(start, end);
    };

    $scope.getTotalPages = function() {
        return Math.ceil($scope.allRecords.length / $scope.pageSize);
    };

    $scope.nextPage = function() {
        if ($scope.currentPage < $scope.getTotalPages()) {
            $scope.currentPage++;
            $scope.updatePaginatedRecords();
        }
    };

    $scope.previousPage = function() {
        if ($scope.currentPage > 1) {
            $scope.currentPage--;
            $scope.updatePaginatedRecords();
        }
    };

    $scope.deleteRecords = function(ev) {
        const confirm = $mdDialog.confirm()
            .title('确认删除')
            .textContent('您确定要删除该端口的所有共享IP记录吗？此操作无法撤销。')
            .ariaLabel('Delete records')
            .targetEvent(ev)
            .ok('确认')
            .cancel('取消');

        $mdDialog.show(confirm).then(function() {
            $http.delete(`/api/admin/shared-ip/${$scope.port}`)
                .then(function(response) {
                    $scope.allRecords = [];
                    $scope.updatePaginatedRecords();
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('删除成功')
                            .position('top right')
                            .hideDelay(3000)
                    );
                })
                .catch(function(err) {
                    console.error('Failed to delete records', err);
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('删除失败')
                            .position('top right')
                            .hideDelay(3000)
                    );
                });
        });
    };
}]);