/*globals angular, Jahtzee, Fireworks, bootbox*/
/*jshint asi: true, proto: true*/

/* TODO
- fix die size issue on safari
- icon
- make separate repo for 9z
- precompute markov chain for fast replacement of AI simulation strategy
- balloons instead of fireworks for jax
*/

// the main app module
  var app = angular.module('jahtzee_app', []).service('jahtzee_service', Jahtzee)

// the main controller
  app.controller('bodyController', ['$scope', 'jahtzee_service',

    function($scope, jahtzee_service) {

      var timeout_id = 0  

      // first a utility function to refresh Angular views while avoiding reentrancy
        function safeApply(fn) { 
            var phase = $scope.$root.$$phase
            if(phase !== '$apply' && phase !== '$digest') $scope.$apply(fn) }

      // expose ability to create a new game to the view etc

        $scope.confirmNewGame = function() { 
          bootbox.confirm('Sure you want to start over?', function(bool){ if(bool) $scope.newGame() }) /**/}

        $scope.toggleDie = function(die) {
          if ($scope.g.toggleDie(die) === false)
            bootbox.alert('No cheating!') }

        $scope.keydown = function(e,p) {
          var charCode = e.which || e.keyCode
          var charStr = String.fromCharCode(charCode)
          var valid = (p == $scope.g.player && ('1234567890'.indexOf(charStr) > -1 || charCode == 8 || charCode == 46 || charCode == 13))
          if (!valid) e.preventDefault()
        }

        $scope.keyup = function(e,box) {
          var el = e.target
          var txt = el.value
          var answer = box.calcVal($scope.g.dice)
          clearInterval(window.iid1||0); clearInterval(window.iid2||0)
          window.iid1 = setInterval(function(){el.value = box.proposeVal($scope.g.dice)},5000) // hint at the answer...
          window.iid2 = setInterval(function(){el.value = box.unproposeVal($scope.g.dice)},5100) // briefly (with progressively longer hints)
          if (txt === answer.toString() ) {
            box.proposeVal($scope.g.dice)
            box.lockVal($scope.g.dice)
            clearInterval(window.iid1); clearInterval(window.iid2)
            document.getElementById('lock-sound').play()
            e.target.blur()
          }
        }

        $scope.newGame = function() {

          // the very important game object
            $scope.g = new jahtzee_service.Game() 

          // add player
            $scope.g.newPlayer('Player')
      
          // modify the standard roll function with implementation-specific animation 
            if($scope.g.base_delay > 100) { // don't bother if there's not enough animation time
              var origRollSelected = $scope.g.dice.rollSelected
              $scope.g.dice.rollSelected = function () {
                var shakes = 5, i = shakes
                ;(function repeatedRollSelected() {
                  if (i--) {
                    safeApply(origRollSelected.call($scope.g.dice))
                    var delay = ($scope.g.base_delay - 100) / shakes
                    window.setTimeout(repeatedRollSelected, delay) 
                  }
                })() } }

          // add sound around the nextRoll function
            var origNextRoll = $scope.g.nextRoll
            $scope.g.nextRoll = function() {
              if($scope.g.roll_count < $scope.g.max_rolls && $scope.g.dice.selectedCount() > 0) 
                document.getElementById('roll-sound').play()
              origNextRoll.apply($scope.g, arguments) 
            }

          // add sound + effects to the nextRound function
            var origNextRound = $scope.g.nextRound
            $scope.g.nextRound = function() {
              origNextRound.call($scope.g, arguments)
              if($scope.g.round > $scope.g.max_rounds) {
                if ($scope.g.winner.AI===false && $scope.g.players.length > 1) {
                  document.getElementById('fireworks-sound').play()
                  Fireworks.stopAfterMinutes(0.33)
                  Fireworks.start() } } }

          // this cycle loop lets us animate the view via model manipulation, which Angular otherwise avoids
            window.clearTimeout(timeout_id) // first end any queued function loops from previous games
            ;(function cycle() {
                $scope.g.player.nextAction()
                safeApply()
                timeout_id = window.setTimeout(cycle, $scope.g.next_delay)
            })()

        }

      // kick off the initial game
        $scope.newGame()

    }
  ])