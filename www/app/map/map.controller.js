  angular.module('hhbdxMapCtrl', ['ionic'])

.controller('MapCtrl', function($scope, $ionicLoading, $compile, $ionicPopup, $state, $http, $ionicPopover,  $cordovaGeolocation, ClosePopupService) {

  $ionicLoading.show({
    content: 'Loading',
    animation: 'fade-in',
    showBackdrop: true,
    maxWidth: 200,
    showDelay: 0
  });

  var options = {
     timeout: 10000,
     enableHighAccuracy: true
   };

  $scope.data = {};
  $scope.data.distance = 2500;
  $scope.data.rating = 0;
  $scope.data.type = {
    beer: 'Beer',
    wine: 'Wine',
    cocktail: 'Cocktail'
  };

  var filter = {
    distance: $scope.data.distance,
    type: $scope.data.type,
    rating: $scope.data.rating
  };

  $http.get('../../database/database.json').success(function(response) {
    $scope.pubs = response;


    // Triggered on button click
    $scope.showPubs = function() {
      $scope.data = {};
      var dateToCompareWith = new Date(Date.now());
      var icon = "";
      $scope.dateToCompareWith = dateToCompareWith.getHours() + ":" + (dateToCompareWith.getMinutes()<10?'0':'') + dateToCompareWith.getMinutes();

      $scope.myPopup = $ionicPopup.show({
        templateUrl: "../app/popup/popup.html",
        title: 'Bars',
        cssClass: 'barsPopup',
        scope: $scope
      });

      // Add the popup to the closing service
      ClosePopupService.register($scope.myPopup);
    };

    // Triggered on button click
    $scope.filterBar = function() {
      $scope.myPopup = $ionicPopup.show({
        templateUrl: "../app/popup/filter.html",
        title: 'Filter',
        cssClass: 'filterPopup',
        scope: $scope
      });

      //On close
      $scope.myPopup.then(function(res) {
        console.log($scope.data.type);
        filter = {
          distance: $scope.data.distance,
          type: $scope.data.type,
          rating: $scope.data.rating
        };
        $scope.drawPubs(filter);
      });
      // Add the popup to the closing service
      ClosePopupService.register($scope.myPopup);
    };

     $cordovaGeolocation.getCurrentPosition(options).then(function(position) {
         var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
         var mapOptions = {
             disableDefaultUI: true,
             center: myLatlng,
             zoom: 16,
             mapTypeId: google.maps.MapTypeId.TERRAIN
         };
         $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
         $scope.markers = [];

         var myPosition = new google.maps.Marker({
             position: myLatlng,
             map: $scope.map,
             icon: "../../img/blue_dot.png"
         });
          $scope.drawPubs(filter);
          $ionicLoading.hide();
       }, function(error) {
         alert('Unable to get location: ' + error.message);
       });

       function isHappyHours(openTime, closeTime) {
         var dateToCompareWith = new Date(Date.now());
         var icon = "";
         dateToCompareWith = dateToCompareWith.getHours() + ":" + (dateToCompareWith.getMinutes()<10?'0':'') + dateToCompareWith.getMinutes();
         if(openTime < dateToCompareWith && dateToCompareWith < closeTime) {
           return icon = "../../img/happyHoursOpen.png";
         } else {
           return icon = "../../img/happyHoursClose.png";
         }
       }

       // Draw the pub markers on the map
       $scope.drawPubs = function(filter) {
           clearMarkers();
           $scope.markers = [];
           google.maps.event.addListenerOnce($scope.map, 'idle', function() {
             for (var i = 0; i < $scope.pubs.length; i++) {
               if(filter.rating <= $scope.pubs[i].rating && (filter.type.beer === $scope.pubs[i].mainDrinkType || filter.type.cocktail === $scope.pubs[i].mainDrinkType  || filter.type.wine === $scope.pubs[i].mainDrinkType) && $scope.pubs[i].distance < filter.distance) {
                 var icon = isHappyHours($scope.pubs[i].happyStart,$scope.pubs[i].happyEnd);
                 var marker = new google.maps.Marker({
                   map: $scope.map,
                   position: $scope.pubs[i].position,
                   icon: icon
                 });
                 $scope.markers.push(marker);
                 setMapOnAll($scope.map);
                 //On Click go to pub page TODO=>Pub Pages
                 google.maps.event.addListener(marker, 'click', (function(marker, i) {
                   return function() {
                     $state.go('app.bar', ({
                       "barId": $scope.pubs[i].id
                     }));
                   }
                 })(marker, i));
               }
             }
           });
       };

      // Sets the map on all markers in the array.
      function setMapOnAll(map) {
        for (var i = 0; i < $scope.markers.length; i++) {
          $scope.markers[i].setMap(map);
        }
      }

      // Removes the markers from the map, but keeps them in the array.
      function clearMarkers() {
        setMapOnAll(null);
      }

      // Shows any markers currently in the array.
      function showMarkers() {
        setMapOnAll(map);
      }

      // Deletes all markers in the array by removing references to them.
      function deleteMarkers() {
        clearMarkers();
        $scope.markers = [];
      }
      });

      // Center map on user location
      $scope.findMe = function() {
        if(!$scope.map) {
          return;
        }

        $ionicLoading.show({
          content: 'Getting current location...',
          showBackdrop: false
        });

        navigator.geolocation.getCurrentPosition(function(pos) {
          $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          $ionicLoading.hide();
        }, function(error) {
          alert('Unable to get location: ' + error.message);
        });
      };

      // Clean maps markup
      google.maps.Map.prototype.clearMarkers = function() {
        for(var i=0; i < this.markers.length; i++){
            this.markers[i].setMap(null);
        }
        this.markers = new Array();
      };
});
