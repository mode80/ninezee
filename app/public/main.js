/*  TODO
-   Undo feature
-   Fix 0 score possibility before 1st roll
-   implement AI player stub
-   implement <die> directive with dot die faces 
-   lockVal sound effects
-   disable UI while AI is playing
*/

/*globals angular, Fireworks*/
/*jshint asi: true, es5: true, proto: true*/

function Jahtzee() {

  var proto // convenience shortener when working with prototypes

  // Die 
  // ***************************************************************************

    var Die = function(val) {
        this.val = val || null
        this.selected = false
      }
    proto = Die.prototype = Object.extended() // because we like sugar
    proto.roll = function() {
      this.val = Math.ceil(Math.random() * 6)
    }
    proto.select = function() {
      this.selected = true
    }
    proto.deselect = function() {
      this.selected = false
    }
    proto.equals = function(otherDie){
      return (this.val === otherDie.val && this.selected === otherDie.selected)
    }

  // Box
  // ***************************************************************************

    var Box = function Box(player) {
        this.player = player, this.val = null, this.unfinal = true
      }
    Box.prototype = Object.extended()

  // ScoreBox 
  // ***************************************************************************

    var ScoreBox = function(player) {
        Box.apply(this, arguments)
      }
    proto = ScoreBox.prototype = Object.create(Box.prototype)
    proto.calcVal = function(dice) {
      // override this
    }
    proto.proposeVal = function(dice) {
      if(this.player.ready() && this.val === null) {
        this.val = this.calcVal(dice)
        this.player.yahtzee_bonus.proposeVal(dice)
        this.player.refreshTotals()
      }
    }
    proto.unproposeVal = function(dice) {
      if(this.player.ready() && this.unfinal) {
        this.val = null
        this.player.yahtzee_bonus.unproposeVal(dice)
        this.player.refreshTotals()
      }
    }
    proto.lockVal = function(dice) {
      if(this.player.ready() && this.unfinal) {
        this.unfinal = false
        this.val = this.calcVal(dice)
        this.player.yahtzee_bonus.lockVal(dice)
        this.player.refreshTotals()
        this.player.game.nextPlayer()
      }
    }


  // SimpleBox 
  // ***************************************************************************

    var SimpleBox = function(player, n) {
        ScoreBox.apply(this, arguments)
        this.n = n
      }
    proto = SimpleBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(dice) {
      var sum = 0
      for(var i = 0, len = dice.length; i < len; i++) {
        if(this.n === dice[i].val) sum = sum + dice[i].val
      }
      return sum
    }
    proto.expectedValue = function(dice) {
      var currentScore = this.calcVal(dice)
      var isUnhelpfulFn = function(die) { return (die.val === this.n)}
      var unhelpfulDice = dice.filter(isUnhelpfulFn)
      // TODO finish or removen
    }

  // NOfAKindBox
  // ***************************************************************************

    function NOfAKindBox(player, n) {
      ScoreBox.apply(this, arguments)
      this.n = n
    }
    proto = NOfAKindBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(dice) {
      var most_val = dice.most("val").val
      var most_count = dice.filter(function(d) {
        return d.val === most_val
      }).count()
      if(most_count >= this.n) if(this.n === 5) return 50 /*Yahtzee!*/
      ;
      else return dice.sumOfDice()
      else return 0
    }

  // ChanceBox
  // ***************************************************************************

    function ChanceBox(player) {
      ScoreBox.apply(this, arguments)
    }
    proto = ChanceBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(dice) {
      return dice.sumOfDice()
    }

  // FullHouseBox
  // ***************************************************************************

    function FullHouseBox(player) {
      ScoreBox.apply(this, arguments)
    }
    proto = FullHouseBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(dice) {
      var sorted_dice = dice.sortedCopy()
      var i = sorted_dice.length
      var count_type = 0
      var count = []
      var last_val = null
      while(i--) {
        if(sorted_dice[i].val === last_val)
          count[count_type] = count[count_type] + 1 || 2
        else
          count_type++
        last_val = sorted_dice[i].val
      }
      if(count[1] + count[2] === 5 || count[1] === 5) return 25;
      else return 0
    }

  // SequenceOfNBox
  // ***************************************************************************

    function SequenceOfNBox(player, n) {
      ScoreBox.apply(this, arguments)
      this.n = n
    }
    proto = SequenceOfNBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(dice) {
      var sorted_dice = dice.sortedCopy()
      var in_a_row = 1
      var last_val
      var point_val = 0
      var yahtzee_wildcard = false
      sorted_dice.each(function(die) {
        if(die.val === last_val + 1) in_a_row++
        else if(die.val > last_val) in_a_row = 1
        last_val = die.val
      })
      if(this.n === 4) point_val = 30;
      else if(this.n === 5) point_val = 40
      yahtzee_wildcard = 
        (dice.allSame() && 
          this.player.simple_scores[dice[0].val - 1].val !== null)
      if(in_a_row >= this.n || yahtzee_wildcard) return point_val;
      else return 0
    }

  // TotalBox
  // ***************************************************************************

    function TotalBox(player, score_box_group) {
      Box.apply(this, arguments)
      this.score_box_group = score_box_group
    }
    proto = TotalBox.prototype = Object.create(Box.prototype)
    proto.refresh = function() {
      this.unfinal = !this.score_box_group.isDone()
      this.val = this.score_box_group.sumOfVals()
    }

  // Yahtzee Bonus
  // ***************************************************************************

    function YahtzeeBonusBox(player, score_box_group) {
      Box.apply(this, arguments)
      this.unfinal = true
      this.score_box_group = score_box_group
    }
    proto = YahtzeeBonusBox.prototype = Object.create(Box.prototype)
    proto.calcVal = function(dice) {
      if(dice.allSame() && 
          this.player.yahtzee.val > 0 &&
          this.player.yahtzee.unfinal === false ) 
        return 100 
      else 
        return 0
    }
    proto.proposeVal = function(dice) {
      if(this.player.yahtzee.val > 0 && this.player.yahtzee.unfinal === false)
        this.val += this.calcVal(dice)
    }
    proto.unproposeVal = function(dice) {
      if(this.player.yahtzee.val > 0 && this.player.yahtzee.unfinal === false)
        this.val -= this.calcVal(dice)
    }
    proto.lockVal = function(dice) {
      if(this.score_box_group.isDone()) this.unfinal = false
    }

  // UpperBonusBox
  // ***************************************************************************

    function UpperBonusBox(player) {
      Box.apply(this, arguments)
    }
    proto = UpperBonusBox.prototype = Object.create(Box.prototype)
    proto.refresh = function() {
      this.unfinal = this.player.simple_total.unfinal
      if(this.player.simple_total.val >= 63) this.val = 35
      if(!this.unfinal && this.val === null) this.val = 0
    }

  // ScoreBoxGroup
  // ***************************************************************************

    function ScoreBoxGroup() {
      var _array = []
      _array.__proto__ = Object.create(ScoreBoxGroup.prototype)
      return _array
    }
    proto = ScoreBoxGroup.prototype = Object.create(Array.prototype)
    proto.isDone = function() {
        var i = this.length, box
        while(i--) { 
          box = this[i]
          if(box.unfinal) return false
        }
        return true
      }
    proto.sumOfVals = function() {
      return this.sum( function(box){ return box.val} )
    }
    proto.pushAll = function(array_of_stuff_to_push) {
      Array.prototype.push.apply(this, array_of_stuff_to_push)
      return this
    }
    proto.firstEmpty = function() {
      var len = this.length, i = 0
        do {
          if(this[i].val === null) return this[i]
        } while(i++ < len)
    }

  // Player 
  // ***************************************************************************

  function Player(name, game) {

    this.name = name || "Player"
    this.game = game
    this.winner = null

    this.aces = new SimpleBox(this, 1)
    this.twos = new SimpleBox(this, 2)
    this.threes = new SimpleBox(this, 3)
    this.fours = new SimpleBox(this, 4)
    this.fives = new SimpleBox(this, 5)
    this.sixes = new SimpleBox(this, 6)

    this.upper_bonus = new UpperBonusBox(this)

    this.three_of_a_kind = new NOfAKindBox(this, 3)
    this.four_of_a_kind = new NOfAKindBox(this, 4)
    this.full_house = new FullHouseBox(this)
    this.sm_straight = new SequenceOfNBox(this, 4)
    this.lg_straight = new SequenceOfNBox(this, 5)
    this.chance = new ChanceBox(this)
    this.yahtzee = new NOfAKindBox(this, 5)

    this.simple_scores = new ScoreBoxGroup()
    this.upper_scores = new ScoreBoxGroup()
    this.lower_scores = new ScoreBoxGroup()
    this.bonus_triggers = new ScoreBoxGroup()
    this.choosables = new ScoreBoxGroup()
    this.all_scores = new ScoreBoxGroup()

    this.simple_scores.push(
      this.aces, this.twos, this.threes, this.fours, this.fives, this.sixes)
    this.upper_scores.pushAll(this.simple_scores).push(this.upper_bonus)
    this.lower_scores.push(this.three_of_a_kind, this.four_of_a_kind,
      this.full_house, this.sm_straight, this.lg_straight, this.chance)
    this.bonus_triggers.pushAll(this.simple_scores).pushAll(this.lower_scores)
    this.yahtzee_bonus = new YahtzeeBonusBox(this, this.bonus_triggers)
    this.choosables.pushAll(this.bonus_triggers).push(this.yahtzee)
    this.lower_scores.push(this.yahtzee, this.yahtzee_bonus)
    this.all_scores.pushAll(this.upper_scores).pushAll(this.lower_scores)

    this.simple_total = new TotalBox(this, this.simple_scores)
    this.upper_total = new TotalBox(this, this.upper_scores)
    this.lower_total = new TotalBox(this, this.lower_scores)
    this.grand_total = new TotalBox(this, this.all_scores)

  }

  proto = Player.prototype = Object.extended()

  proto.refreshTotals = function() {
    this.simple_total.refresh()
    this.upper_bonus.refresh()
    this.upper_total.refresh()
    this.lower_total.refresh()
    this.grand_total.refresh()
  }

  proto.ready = function() {
    return (
      this.game.player === this &&
      this.game.roll_count > 0  
    )
  }

  proto.nextMove = function() {
    // override me for AI players
  }

  // AIPlayer
  // ***************************************************************************
    var AIPlayer = function(name, game) {
      Player.apply(this, arguments) // call super-constructor
      this.dice_to_roll = null
      this.die_index_to_compare = 0
    }
    proto = AIPlayer.prototype = Object.create(Player.prototype)
    proto.nextMove = function() {
      if (this.game.roll_count === 0) { // need to make first roll 
        this.game.nextRoll()
        this.die_index_to_compare = 0
      } else if (this.game.roll_count >= 3) { // rolling is over, choose a box 
        this.chosenBox().lockVal(this.game.dice)
      } else { // choose and select dice
        if(this.die_index_to_compare === 0) this.chooseDice()
        if(this.die_index_to_compare < 5) { // still more to select
          var i = this.die_index_to_compare
          this.game.dice[i].selected = this.dice_to_roll[i].selected
          this.die_index_to_compare++
        } else { // done selecting, time to roll
          this.die_index_to_compare = 0
          this.game.nextRoll()
        }
      }
    }

    proto.chooseDice = function() {
      this.dice_to_roll = new Dice()
    }
    proto.chosenBox = function() {
      // find the highest scoring box with just the current dice values
      var game_dice = this.game.dice
      return this.choosables.max( function(box) {
        return box.unfinal? box.calcVal(game_dice) : -1
      })
    }

  // Robot 
  // ***************************************************************************
    function Robot(name, game){ 
      AIPlayer.apply(this, arguments) // call super-constructor
    }
    proto = Robot.prototype = Object.create(AIPlayer.prototype)
    proto.chooseDice = function() {
      var fake_dice = []
      var a,b,c,d,e
      var avg_scores = []
      var selection
      var decimal_index
      var avgOfMany = function() {
        var trials = 1296 // enough rolls to get 1 yahtzees on average
        var total = 0
        var bestBoxFn = function(box) {
          return box.unfinal? box.calcVal(fake_dice) : -1 
        }
        var i = trials
        while (i--) {
          var ii = 5
          while (ii--) if (fake_dice[ii].selected) fake_dice[ii].roll()
          var score_this_trial = this.choosables.map(bestBoxFn).max()
          total += score_this_trial 
        }
        return total / trials
      }
      for (a=0; a<2; a++)
        for (b=0; b<2; b++)
          for (c=0; c<2; c++)
            for (d=0; d<2; d++)
              for (e=0; e<2; e++) {
                selection = [a,b,c,d,e]
                fake_dice = this.game.dice.clone()
                fake_dice.selectByArray(selection)
                decimal_index = a*16+b*8+c*4+d*2+e*1 // parseInt(selection.join(''),2) 
                avg_scores[decimal_index] = avgOfMany.call(this)
              }
      var binary_string = avg_scores.indexOf(avg_scores.max()).toString(2) // decimal to binary
      binary_string = ("00000" + binary_string).slice(-5) // add leading zeroes
      selection = binary_string.split('') // now to an array
      this.dice_to_roll = this.game.dice.clone()
      this.dice_to_roll.selectByArray(selection)
    }
    proto.chosenBox = function() {
      return AIPlayer.prototype.chosenBox.call(this)
    }

  // Dice
  // ***************************************************************************
    var Dice = function() {
        var dice = []
        for(var i = 1; i<=5; i++) dice.push(new Die(i))
        dice.__proto__ = Dice.prototype
        dice.selectAll()
        return dice
    }
    proto = Dice.prototype = Object.create(Array.prototype)
    proto.rollSelected = function() {
      var i = this.length
      while(i--) if(this[i].selected) this[i].roll()
    }
    proto.selectByArray = function (selection) {
      var i = 5
      while (i--) this[i].selected = (selection[i]? true: false)
    }
    proto.selectAll = function() {
      var i = this.length
      while(i--) this[i].selected = true
    }
    proto.selectNone = function() {
      var i = this.length
      while(i--) this[i].selected = false
    }
    proto.selectInverse = function() {
      var i = this.length
      while (i--) this[i].selected = !this[i].selected
    }
    proto.sumOfDice = function() {
      return this.reduce(function(sum, die) {return sum + die.val}, 0)
    }
    proto.sortedCopy = function() {
      return this.slice().sort(function(a, b) {return(a.val - b.val)})
    }
    proto.allSame = function() {
      var die_val_fn = function(die) {return die.val}
      if(this[0].val === null) return false
      return(this.max(die_val_fn) === this.min(die_val_fn))
    }
    proto.reset = function() {
      this.each(function(die) {die.val = null})
    }
    proto.equals = function(otherDice) {
      var unequal = false
      if(this.length !== otherDice.length) return false
      this.each(function(die,i){
        if(!die.equals(otherDice[i])) unequal = true ; else return
      })
      if(!unequal) return true
    }
    proto.clone = function() {
      var retval = new Dice()
      var i = 5
      while (i--) {
        retval[i].val = this[i].val
        retval[i].selected = this[i].selected
      }
      return retval
    }

  // Game
  // ***************************************************************************
    this.Game = function() {
      this.dice = new Dice()          // the array-like set of 5 game dice
      this.players = []               // all players
      this.player = this.newPlayer()  // current player
      this.player_index = 0           // index of current player in players[]
      this.round = 1                  // a game has 13 rounds to score all boxes
      this.roll_count = 0             // each players gets 3 rolls
      this.started = false            // true onece a new game has started
      this.think_delay = 1000         // how long the AI thinks between moves
    }
    proto = this.Game.prototype = Object.extended()
    proto.newPlayer = function(playerTypeString) {
      if(this.started) return
      var PlayerConstructor = eval(playerTypeString) || Player // TODO remove use of eval
      var player_name = playerTypeString ? 
        playerTypeString + (Math.floor(Math.random() * 90) + 10) : 
        "Player " + (this.players.length + 1)
      var p = new PlayerConstructor(player_name, this)
      this.players.push(p)
      return p
    }
    proto.nextPlayer = function() {
      this.started = true
      this.player_index++
      this.roll_count = 0
      this.player_index %= this.players.length
      if(this.player_index === 0) this.nextRound()
      this.player = this.players[this.player_index]
      this.dice.selectAll()
    }
    proto.nextRound = function() {
      this.round++
      if(this.round > 13) // determine winner(s)
      this.players.max(function(p) {
        return p.grand_total.val
      }, true).each(function(p) {
        p.winner = true
      })
    }
    proto.nextRoll = function() {
      if(this.roll_count >= 3) return false
      this.roll_count++
      this.dice.rollSelected()
    }
}

  // ***************************************************************************


// the main app module
  var app = angular.module("jahtzee_app", []).service("jahtzee_service", Jahtzee)

// the main controller
  app.controller('bodyController', ["$scope", "jahtzee_service",

    function($scope, jahtzee_service) {


      // first a utility function to refresh Angular views while avoiding reentrancy
        function safeApply(fn) { 
            var phase = $scope.$root.$$phase
            if(phase !== '$apply' && phase !== '$digest') $scope.$apply(fn)
        }

      // expose ability to create a new game to the view
        $scope.newGame = function() {

          $scope.g = new jahtzee_service.Game()
      
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
            if($scope.g.roll_count < 3) document.getElementById('roll-sound').play()
            origNextRoll.apply($scope.g, arguments)
          }


          // add sound around the lockVal function
          $scope.g.player.aces.__proto__.__proto__.origLockVal = $scope.g.player.aces.__proto__.__proto__.lockVal
          $scope.g.player.aces.__proto__.__proto__.lockVal = function() {
            document.getElementById('lock-sound').play()
            $scope.g.player.aces.__proto__.__proto__.origLockVal.apply(this, arguments)
          }


          // add sound + effects to the nextRound function
          var origNextRound = $scope.g.nextRound
          $scope.g.nextRound = function() {
            origNextRound()
            if($scope.g.round > 13) {
              //TODO make happen only on human player win
              document.getElementById('fireworks-sound').play()
              Fireworks.stop_after_minutes = 0.33
              Fireworks.start()
            }
          }

        }

      // kick off the initial game
        $scope.newGame()


      // cycle loop lets us animate the view via model manipulation, which Angular otherwise avoids
        ;(function cycle() {
            $scope.g.player.nextMove()
            safeApply()
            window.setTimeout(cycle, $scope.g.think_delay)
        })()


    }
  ])