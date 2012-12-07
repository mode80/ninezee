/*globals angular, Jahtzee, Fireworks*/
/*jshint asi: true, es5: true, proto: true*/


// the main app module
  var app = angular.module("jahtzee_app", []).service("jahtzee_service", Jahtzee)

// the main controller
  app.controller('bodyController', ["$scope", "jahtzee_service",

    function($scope, jahtzee_service) {

      var timeout_id = 0  

      // first a utility function to refresh Angular views while avoiding reentrancy
        function safeApply(fn) { 
            var phase = $scope.$root.$$phase
            if(phase !== '$apply' && phase !== '$digest') $scope.$apply(fn)
        }

      // expose ability to create a new game to the view
        $scope.newGame = function() {

          // the very important game object
          $scope.g = new jahtzee_service.Game()

          // add player
          $scope.g.player = $scope.g.newPlayer("Player")
      
          // modify the standard roll function with implementation-specific animation 
          var origRollSelected = $scope.g.dice.rollSelected
          $scope.g.dice.rollSelected = function () {
            var shakes = 5
            ;(function repeatedRollSelected() {
              if (shakes--) {
                safeApply(origRollSelected.call($scope.g.dice))
                window.setTimeout(repeatedRollSelected, 80)
              }
            })()
          }

          // add sound around the nextRoll function
          var origNextRoll = $scope.g.nextRoll
          $scope.g.nextRoll = function() {
            if($scope.g.roll_count < 3 && $scope.g.dice.selectedCount() > 0) 
              document.getElementById('roll-sound').play()
            origNextRoll.apply($scope.g, arguments)
          }

          // add sound around the lockVal function
          //if ($scope.g.player.aces.__proto__.__proto__.origLockVal === undefined) {
          //  $scope.g.player.aces.__proto__.__proto__.origLockVal = $scope.g.player.aces.__proto__.__proto__.lockVal
          //  $scope.g.player.aces.__proto__.__proto__.lockVal = function() {
          //    document.getElementById('lock-sound').play()
          //    $scope.g.player.aces.__proto__.__proto__.origLockVal.apply(this, arguments)
          //  }
          //}

          // add sound + effects to the nextRound function
          var origNextRound = $scope.g.nextRound
          $scope.g.nextRound = function() {
            origNextRound.call($scope.g, arguments)
            if($scope.g.round > 13) {
              //TODO make happen only on human player win
              document.getElementById('fireworks-sound').play()
              Fireworks.stopAfterMinutes(0.33)
              Fireworks.start()
            }
          }

          // cycle loop lets us animate the view via model manipulation, which Angular otherwise avoids
          window.clearTimeout(timeout_id) // first end any queued function loops from previous games
          ;(function cycle() {
              $scope.g.player.nextMove()
              safeApply()
              timeout_id = window.setTimeout(cycle, $scope.g.next_delay)
          })()
          // document.getElementsByTagName("body")[0].ondblclick = function() {$scope.g.player.nextMove()}

        }

      // kick off the initial game
        $scope.newGame()

    }
  ])