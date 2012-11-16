/*jshint asi: true, es5: true, proto: true*/

function bodyController ($scope) {

  var proto

  // Die 
  // ***********************************************************************************************
    var Die = function(val) {
        this.val = val || 1
        this.selected = false
    }
    Die.prototype = Object.extended({}) // because we like sugar
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
    Box.prototype = Object.extended({})

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
      if (this.val === null) {
        this.val=this.calcVal(die_array)
        if (this !== this.player.yahtzee) this.player.yahtzee_bonus.proposeVal(die_array)
        this.player.refreshTotals() 
      }
    }
    proto.unproposeVal = function(die_array) {
      if (this.is_temp) {
        this.val=null
        if (this !== this.player.yahtzee) this.player.yahtzee_bonus.unproposeVal(die_array)
        this.player.refreshTotals()
      }
    }
    proto.lockVal = function(die_array) {
      if (this.val !== null && this.is_temp === true) {
        this.is_temp = false
        this.val = this.calcVal(die_array)
        if (this !== this.player.yahtzee) this.player.yahtzee_bonus.lockVal(die_array)
        this.player.refreshTotals()
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
      var sorted_dice = dice.sortedCopy()
      var last_val = null
      var same_count = 1
      var retval = 0
      var i = sorted_dice.length
      while (i--) { 
        if (last_val === sorted_dice[i].val) same_count++
        last_val = sorted_dice[i].val 
      }
      if (same_count >= this.n) {
        if (this.n === 5) // Yahtzee!
          retval = 50
        else
          retval = die_array.sumOfDice()
      }
      return retval
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
        last_val = die.val
      })
      if (this.n === 4) point_val=30; else if (this.n === 5) point_val=40
      yahtzee_wildcard = (die_array.allSame() 
                          && this.player.simple_scores[die_array[0].val-1].val !== null  )
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

      return _array

    }

  // Player 
  // ***********************************************************************************************
    function Player(name) {

      this.name = name || "Player"
      
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
      this.all_scores       = new ScoreBoxGroup()
      with (this) { 
        simple_scores.push(aces,twos,threes,fours,fives,sixes)
        upper_scores.applyPush(simple_scores).push(upper_bonus)
        lower_scores.push(three_of_a_kind, four_of_a_kind, full_house, sm_straight, lg_straight)
        bonus_triggers.applyPush(simple_scores).applyPush(lower_scores)
        this.yahtzee_bonus  = new YahtzeeBonusBox(this, this.bonus_triggers)
        lower_scores.push(yahtzee, yahtzee_bonus)
        all_scores.applyPush(upper_scores).applyPush(lower_scores)
      }

      this.simple_total = new TotalBox(this, this.simple_scores) 
      this.upper_total  = new TotalBox(this, this.upper_scores)
      this.lower_total  = new TotalBox(this, this.lower_scores)
      this.grand_total  = new TotalBox(this, this.all_scores)

    }

    Player.prototype.refreshTotals = function() {
      this.simple_total.refresh()
      this.upper_bonus.refresh()
      this.upper_total.refresh()          
      this.lower_total.refresh()          
      this.grand_total.refresh()          
    }
  // ***********************************************************************************************

  // Dice
  // ***********************************************************************************************
    var dice = []
    for (var i=1; i<=5; i++) dice.push(new Die(i))

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

    dice.sumOfDice = function() {
      return this.reduce( function(sum, die) {return sum + die.val }, 0 )
    }

    dice.sortedCopy = function() {
      return this.slice().sort(function(a,b) {return (a.val > b.val) } )
    }

    dice.allSame = function() {
      die_val_fn = function(die){return die.val}
      return (this.max(die_val_fn) === this.min(die_val_fn) )
    }
// *************************************************************************************************

// Game
// ***********************************************************************************************
  var Game = function() {
    this.dice = dice
    this.players = []
    this.current_player = this.newPlayer()
    this.round = 0
  }
  proto = Game.prototype = Object.extended({})
  proto.newPlayer = function() {
    this.players.push(new Player("Player " + (this.players.length+1) ) )
    return this.players[this.players.length-1]
  }

// Expose model objects
// ***********************************************************************************************
  $scope.g = new Game()
  $scope.__defineGetter__("p1", function() {return $scope.g.players[0]} )
  $scope.newGame = function() {$scope.g = new Game()}
}
