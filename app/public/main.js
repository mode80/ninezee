/*  TODO
-   Fix 0 score possibility before 1st roll
-   Undo feature
-   implement AI player stub
-   implement <die> directive with dot die faces
*/

/*globals angular*/
/*jshint asi: true, es5: true, proto: true*/

function Jahtzee() { 

  var proto // convenience shortener when working with prototypes

  // Die 
  // ***********************************************************************************************
    var Die = function(val) {
        this.val = val || null
        this.selected = false
    }
    Die.prototype = Object.extended() // because we like sugar
    Die.prototype.roll = function() {
      this.val = Math.ceil(Math.random() * 6)
    }

  // Box
  // ***********************************************************************************************
    var Box = function Box (player) {
      this.player = player,
      this.val = null,
      this.is_temp = true
    }
    Box.prototype = Object.extended()

  // ScoreBox 
  // ***********************************************************************************************
    var ScoreBox = function(player) {
      Box.apply(this, arguments)
    }
    proto = ScoreBox.prototype = Object.create(Box.prototype)
    proto.calcVal = function (die_array) {
      // override this
    }
    proto.proposeVal = function(die_array) {
      if (this.player.game.player !== this.player) return
      if (this.val === null) {
        this.val=this.calcVal(die_array)
        if (this !== this.player.yahtzee) this.player.yahtzee_bonus.proposeVal(die_array)
        this.player.refreshTotals() 
      }
    }
    proto.unproposeVal = function(die_array) {
      if (this.player.game.player !== this.player) return
      if (this.is_temp) {
        this.val=null
        if (this !== this.player.yahtzee) this.player.yahtzee_bonus.unproposeVal(die_array)
        this.player.refreshTotals()
      }
    }
    proto.lockVal = function(die_array) {
      if (this.player.game.player !== this.player) return
      if (this.is_temp) {
        this.is_temp = false
        this.val = this.calcVal(die_array)
        if (this !== this.player.yahtzee) this.player.yahtzee_bonus.lockVal(die_array)
        this.player.refreshTotals()
        this.player.game.started = true
        this.player.game.nextTurn()
      }
    }

  // SimpleBox 
  // ***********************************************************************************************
    var SimpleBox = function(player, n) {
      ScoreBox.apply(this,arguments) 
      this.n = n
    }
    proto = SimpleBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function (die_array) {
      var sum = 0
      for (var i= 0, len=die_array.length; i < len; i++) {
        if (this.n === die_array[i].val) 
          sum = sum + die_array[i].val
      }
      return sum
    }

  // NOfAKindBox
  // ***********************************************************************************************
    function NOfAKindBox(player, n) {
      ScoreBox.apply(this,arguments)
      this.n = n
    }
    proto = NOfAKindBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(die_array) {
      var most_val = die_array.most("val").val      
      var most_count = die_array.filter(function(d){return d.val===most_val}).count()
      if (most_count >= this.n) 
        if (this.n === 5) return 50 /*Yahtzee!*/; else return die_array.sumOfDice()
      else 
        return 0
    }

  // ChanceBox
  // ***********************************************************************************************
    function ChanceBox(player) {
      ScoreBox.apply(this,arguments)
    }
    proto = ChanceBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(die_array) {
      return die_array.sumOfDice()
    }

  // FullHouseBox
  // ***********************************************************************************************
    function FullHouseBox(player) {
      ScoreBox.apply(this,arguments)
    }
    proto = FullHouseBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(die_array) {
      var sorted_dice = die_array.sortedCopy()
      var i = sorted_dice.length
      var count_type = 0
      var count = []
      var last_val = null
      while (i--) {
        if (sorted_dice[i].val === last_val) 
          count[count_type] = count[count_type] + 1 || 2
        else
          count_type++
        last_val = sorted_dice[i].val
      }
      if (count[1] + count[2] === 5 || count[1] === 5) return 25; else return 0
    }

  // SequenceOfNBox
  // ***********************************************************************************************
    function SequenceOfNBox(player, n) {
      ScoreBox.apply(this,arguments)
      this.n = n
    }
    proto = SequenceOfNBox.prototype = Object.create(ScoreBox.prototype)
    proto.calcVal = function(die_array) {
      var sorted_dice = die_array.sortedCopy()
      var in_a_row = 1
      var last_val
      var point_val = 0
      var yahtzee_wildcard = false
      sorted_dice.each(function(die) {
        if (die.val === last_val + 1) in_a_row++
        else if (die.val > last_val) in_a_row = 1
        last_val = die.val
      })
      if (this.n === 4) point_val=30; else if (this.n === 5) point_val=40
      yahtzee_wildcard = (die_array.allSame() && 
                          this.player.simple_scores[die_array[0].val-1].val !== null  )
      if (in_a_row >= this.n || yahtzee_wildcard) return point_val; else return 0
    }

  // TotalBox
  // ***********************************************************************************************
    function TotalBox(player, score_box_group) {
      Box.apply(this,arguments)
      this.score_box_group = score_box_group
    }
    proto = TotalBox.prototype = Object.create(Box.prototype)
    proto.refresh = function() {
      this.is_temp = ! this.score_box_group.isDone()
      this.val = this.score_box_group.sumOfVals()
    }

  // Yahtzee Bonus
  // ***********************************************************************************************
    function YahtzeeBonusBox(player, score_box_group) {
      Box.apply(this,arguments)
      this.is_temp = true
      this.score_box_group = score_box_group
    }
    proto = YahtzeeBonusBox.prototype = Object.create(Box.prototype)
    proto.calcVal = function(die_array) {
      if (die_array.allSame() && this.player.yahtzee.val > 0 ) return 100; else return 0
    }
    proto.proposeVal = function(die_array) {
      this.val += this.calcVal(die_array)
    }
    proto.unproposeVal = function(die_array) {
      this.val -= this.calcVal(die_array)
    }
    proto.lockVal = function(die_array) {
      if ( this.score_box_group.isDone() ) this.is_temp = false
    }

  // UpperBonusBox
  // ***********************************************************************************************
    function UpperBonusBox(player) {
      Box.apply(this,arguments) 
    }  
    proto = UpperBonusBox.prototype = Object.create(Box.prototype)
    proto.refresh = function() {
      this.is_temp = this.player.simple_total.is_temp
      if (this.player.simple_total.val >= 63) this.val = 35
      if (!this.is_temp && this.val === null) this.val = 0
    }

  // ScoreBoxGroup
  // ***********************************************************************************************
    function ScoreBoxGroup () {

      var _array = []

      _array.isDone = function() {
        var i = this.length, box
        while (i--) {
          box = this[i]
          if (box.is_temp ) return false
        }
        return true
      }

      _array.sumOfVals = function() {
        var i = this.length, sum = 0
        while (i--) {
          sum = sum + this[i].val
        } 
        return sum
        //return this.sum( function(box){ return box.val} )
      }

      _array.applyPush = function(array_of_stuff_to_push) {
        Array.prototype.push.apply(this, array_of_stuff_to_push)
        return this
      }

      _array.firstEmpty = function() {
        var len = _array.length, i = 0
        do 
          if (_array[i].val === null) return _array[i]
        while (i++ < len)
      }

      return _array

    }

  // Player 
  // ***********************************************************************************************
    function Player(name, game) {

      this.name = name || "Player"
      this.game = game
      this.winner = null
      
      this.aces    =  new SimpleBox(this, 1)
      this.twos    =  new SimpleBox(this, 2)
      this.threes  =  new SimpleBox(this, 3)
      this.fours   =  new SimpleBox(this, 4)
      this.fives   =  new SimpleBox(this, 5)
      this.sixes   =  new SimpleBox(this, 6)

      this.upper_bonus  = new UpperBonusBox(this)

      this.three_of_a_kind  = new NOfAKindBox(this,3)
      this.four_of_a_kind   = new NOfAKindBox(this,4)
      this.full_house       = new FullHouseBox(this)
      this.sm_straight      = new SequenceOfNBox(this,4)
      this.lg_straight      = new SequenceOfNBox(this,5)
      this.chance           = new ChanceBox(this)
      this.yahtzee          = new NOfAKindBox(this,5)

      this.simple_scores    = new ScoreBoxGroup()
      this.upper_scores     = new ScoreBoxGroup()
      this.lower_scores     = new ScoreBoxGroup()
      this.bonus_triggers   = new ScoreBoxGroup()
      this.choosables       = new ScoreBoxGroup()
      this.all_scores       = new ScoreBoxGroup()

      this.simple_scores.push(
        this.aces,this.twos,this.threes,this.fours,this.fives,this.sixes)
      this.upper_scores.applyPush(this.simple_scores).push(this.upper_bonus)
      this.lower_scores.push(this.three_of_a_kind, this.four_of_a_kind, this.full_house, 
        this.sm_straight, this.lg_straight, this.chance)
      this.bonus_triggers.applyPush(this.simple_scores).applyPush(this.lower_scores)
      this.yahtzee_bonus  = new YahtzeeBonusBox(this, this.bonus_triggers)
      this.choosables.applyPush(this.bonus_triggers).push(this.yahtzee)
      this.lower_scores.push(this.yahtzee, this.yahtzee_bonus)
      this.all_scores.applyPush(this.upper_scores).applyPush(this.lower_scores)

      this.simple_total = new TotalBox(this, this.simple_scores) 
      this.upper_total  = new TotalBox(this, this.upper_scores)
      this.lower_total  = new TotalBox(this, this.lower_scores)
      this.grand_total  = new TotalBox(this, this.all_scores)

    }

    proto = Player.prototype = Object.extended()
    
    proto.refreshTotals = function() {
      this.simple_total.refresh()
      this.upper_bonus.refresh()
      this.upper_total.refresh()          
      this.lower_total.refresh()          
      this.grand_total.refresh()          
    }

    proto.playTurn = function() {
      // override me for AI players
    }

  // ***********************************************************************************************


  // AIPlayer
  // ***********************************************************************************************

    var AIPlayer = function(name, game) {
      Player.apply(this, arguments) // call super-constructor
    }

    proto = AIPlayer.prototype = Object.create(Player.prototype)

    proto.playTurn = function() {
      var i = 3
      while (i--) {
        this.game.dice.rollSelected()
        this.chooseDice()
      }
      this.chooseBox()
    } 

    proto.chooseDice = function() {
      this.game.dice.selectAll()
    }

    proto.chooseBox = function() {
      this.choosables.firstEmpty().lockVal(this.game.dice)
    }


  // Dice
  // ***********************************************************************************************
    var Dice = function() {

      if (dice) return dice // singleton
      var dice = []

      for (var i=5; i--;) dice.push( new Die() )

      dice.rollSelected = function() {
        var selectedDice = this.filter(function(die) { return die.selected; })
        selectedDice.each( function(die) { die.roll() } )
      }

      dice.selectAll = function() {
        dice.each( function(die) {die.selected=true})
      }

      dice.selectNone = function() {
        dice.each( function(die) {die.selected=false})
      }

      dice.selectInverse = function() {
        dice.each( function(die){die.selected = ! die.selected})
      }

      dice.sumOfDice = function() {
        return this.reduce( function(sum, die) {return sum + die.val }, 0 )
      }

      dice.sortedCopy = function() {
        return this.slice().sort(function(a,b) {return (a.val - b.val) } )
      }

      dice.allSame = function() {
        var die_val_fn = function(die){return die.val}
        if (this[0].val === null) return false
        return (this.max(die_val_fn) === this.min(die_val_fn) )
      }

      dice.reset = function() {
        dice.each(function(die){die.val = null})
      }

      dice.selectAll()
      return dice
    }
  // *************************************************************************************************

  // Game
  // ***********************************************************************************************
    this.Game = function() {
      this.dice = new Dice()
      this.players = []
      this.player = this.newPlayer() // current player
      this.player_index = 0
      this.round = 1
      this.roll_count = 0
      this.started = false
    }
    proto = this.Game.prototype = Object.extended()
    proto.newPlayer = function(playerTypeString) {
      if (this.started) return
      var PlayerConstructor = eval(playerTypeString) || Player // TODO remove use of eval
      var player_name = playerTypeString ? 
        playerTypeString + (Math.floor(Math.random() * 900)+100) : 
        "Player "+(this.players.length+1)
      var p = new PlayerConstructor(player_name, this)
      this.players.push(p)
      return p
    }
    proto.nextTurn = function() {
      this.player_index++
      this.roll_count = 0
      this.player_index %= this.players.length 
      if (this.player_index === 0) this.nextRound()
      this.player = this.players[this.player_index]
      this.player.playTurn()
      this.dice.selectAll()
      this.dice.reset()
    }
    proto.nextRound = function() {
      this.round++
      if (this.round > 13) // determine winner(s)
        this.players.max(function(p){return p.grand_total.val},true).each(function(p){p.winner=true})
    }
    proto.nextRoll = function() {
      if (this.roll_count >=3) return false
      this.dice.rollSelected()
      this.roll_count++
    }

}

// the main app module
var app = angular.module("jahtzee_app", []).
  service("jahtzee_service", Jahtzee)

// the main controller
app.controller('bodyController', ["$scope", "jahtzee_service",

  function ($scope, jahtzee_service) {

    // kick off a jahtzee game object
      $scope.newGame = function() {

        $scope.g = new jahtzee_service.Game() 

        /**
        var origRollSelected = $scope.g.dice.rollSelected
        $scope.g.dice.rollSelected = function () {
          var shakes = 5
          function repeatedRollSelected() {
            if (shakes--) {
              origRollSelected.call($scope.g.dice)
              var phase = $scope.$root.$$phase
              if(phase !== '$apply' && phase !== '$digest') //avoid angular re-entrant $apply issue
                $scope.$apply()
              window.setTimeout(repeatedRollSelected, 80)
            }
          }
          repeatedRollSelected()
        }
        **/

        // modify the standard roll function with implemntation-specific animation 
        var origRollSelected = $scope.g.dice.rollSelected
        $scope.g.dice.rollSelected = function () {
          sleep = function(delay) {
            var start = new Date().getTime();
            while (new Date().getTime() < start + delay);
          }
          var shakes = 5
          while (shakes--) {           
            origRollSelected.call($scope.g.dice)
            sleep(800)
          }

        }

        // wrap sound around the standard nextRoll function
        $scope.g.rollClick = function(){
            if ($scope.g.roll_count < 3) document.getElementById('sound').play()
            $scope.g.nextRoll(); 
        }

      }

      $scope.newGame() 


  }
  
])
