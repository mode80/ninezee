/*  TODO
-   disable UI while AI is playing
-   Undo feature
-   Improve AI
    . continue profiling, remove (apprently slow) sugarjs calls
    . "never goes for Yahtzee!" (e.g. 55554 will go in 4-of-a-kind even with 1 roll left)
-   implement <die> directive with dot die faces 
-   other sound effects
*/

/*globals angular*/
/*jshint asi: true, es5: true, proto: true, bitwise:false*/

function Jahtzee() {

  // Die 
  // ***************************************************************************

    function Die(val) {
        this.val = val || null
        this.selected = true
    }
    var Die_ = Die.prototype = {} // Object.extended() // because we like sugar
    Die_.roll = function() {
      this.val = Math.ceil(Math.random() * 6)
    }
    Die_.select = function() {
      this.selected = true
    }
    Die_.deselect = function() {
      this.selected = false
    }
    Die_.equals = function(otherDie){
      return (this.val === otherDie.val && this.selected === otherDie.selected)
    }

  // Dice
  // ***************************************************************************
    function Dice() {
        var dice = []
        for(var i = 1; i<=5; i++) dice.push(new Die(i))
        dice.__proto__ = Dice.prototype
        return dice
    }
    Dice.sortFn = function(a, b) {return(a.val - b.val)} // static fn for sorting
    var Dice_ = Dice.prototype = Object.create(Array.prototype)
    Dice_.rollSelected = function() {
      var i = 5
      while(i--) if(this[i].selected) this[i].roll()
    }
    Dice_.selectByArray = function (selection) {
      var i = 5
      while (i--) this[i].selected = (selection[i]? true: false)
    }
    Dice_.selectByBitArray = function (bit_array_integer) {
      var bits = bit_array_integer
      for (var i = 0; i < 5; i+=1) 
        this[i].selected = ((bits >> i & 1)? true: false)
    }
    Dice_.selectAll = function() {
      var i = 5
      while(i--) this[i].selected = true
    }
    Dice_.selectNone = function() {
      var i = 5
      while(i--) this[i].selected = false
    }
    Dice_.selectInverse = function() {
      var i = 5
      while (i--) this[i].selected = !this[i].selected
    }
    Dice_.selectedCount = function() {
      var i = 5, retval = 0
      while (i--) if (this[i].selected) retval++
      return retval
    }
    Dice_.sum = function() {
      var i = 5, sum = 0
      while (i--) sum += this[i].val
      return sum
    }
    Dice_.sortedCopy = function() {
      return this.slice().sort(Dice.sortFn)
    }
    Dice_.allSame = function() {
      var lastval = this[5]
      if(lastval===null) return false
      var i = 4
      while (i--) { 
        if (lastval !== this[i]) return false
        lastval = this[i]
      }
      return true
    }
    Dice_.reset = function() {
      this.each(function(die) {die.val = null})
    }
    Dice_.equals = function(otherDice) {
      var unequal = false
      if(this.length !== otherDice.length) return false
      this.each(function(die,i){
        if(!die.equals(otherDice[i])) unequal = true ; else return
      })
      if(!unequal) return true
    }
    Dice_.clone = function() {
      var retval = new Dice()
      var i = 5
      while (i--) {
        retval[i].val = this[i].val
        retval[i].selected = this[i].selected
      }
      return retval
    }

  // ***************************************************************************
  // Box
  // ***************************************************************************

    function Box(player) {
        this.player = player, this.val = null, this.unfinal = true
      }
    var Box_ = Box.prototype = {} //Object.extended()

  // ScoreBox 
  // ***************************************************************************

    function ScoreBox(player) {
        Box.apply(this, arguments)
      }
    var ScoreBox_ = ScoreBox.prototype = Object.create(Box.prototype)
    ScoreBox_.calcVal = function(dice) {
      // what this box would score with the given dice
      // override this for specific box types
    }
    ScoreBox_.easyVal = function() {
      // a smart human's average score when targeting this box with 3 rolls
      // overrride this for specific box types
    }
    ScoreBox_.proposeVal = function(dice) {
      if(this.player.ready() && this.val === null) {
        this.val = this.calcVal(dice)
        this.player.yahtzee_bonus.proposeVal(dice)
        this.player.refreshTotals()
      }
    }
    ScoreBox_.unproposeVal = function(dice) {
      if(this.player.ready() && this.unfinal) {
        this.val = null
        this.player.yahtzee_bonus.unproposeVal(dice)
        this.player.refreshTotals()
      }
    }
    ScoreBox_.lockVal = function(dice) {
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

    function SimpleBox(player, n) {
        ScoreBox.apply(this, arguments)
        this.n = n
        this.typical_val = 3*n
      }
    var SimpleBox_ = SimpleBox.prototype = Object.create(ScoreBox.prototype)
    SimpleBox_.calcVal = function(dice) {
      var sum = 0, i = 5
      while (i--) if(dice[i].val === this.n) sum += dice[i].val
      return sum
    }
    SimpleBox_.easyVal = function() { 
      return this.n * 1.634 // derived from statistical sampling
    }

  // NOfAKindBox
  // ***************************************************************************

    function NOfAKindBox(player, n) {
      ScoreBox.apply(this, arguments)
      this.n = n
    }
    var NOfAKindBox_ = NOfAKindBox.prototype = Object.create(ScoreBox.prototype)
    NOfAKindBox_.calcVal = function(dice) {
      var i = 5, ii = 6
      var val_counts = [0,0,0,0,0,0]
      while (i--) val_counts[dice[i].val-1]++
      var most_val = 0, most_count = 0
      while (ii--) 
        if(val_counts[ii] > most_count) most_count = val_counts[ii]
      if(most_count < this.n) return 0
      if(this.n === 5) return 50 /*Yahtzee!*/ 
      return dice.sum()
    }
    NOfAKindBox_.easyVal = function() { 
      if(this.n===3) return 11.710 
      if(this.n===4) return 4.865
      if(this.n===5) return 1.233
    }


  // ChanceBox
  // ***************************************************************************

    function ChanceBox(player) {
      ScoreBox.apply(this, arguments)
    }
    var ChanceBox_ = ChanceBox.prototype = Object.create(ScoreBox.prototype)
    ChanceBox_.calcVal = function(dice) {
      return dice.sum()
    }
    ChanceBox_.easyVal = function() { 
      return 22.325
    }

  // FullHouseBox
  // ***************************************************************************

    function FullHouseBox(player) {
      ScoreBox.apply(this, arguments)
    }
    var FullHouseBox_ = FullHouseBox.prototype = Object.create(ScoreBox.prototype)
    FullHouseBox_.calcVal = function(dice) {
      var i = 5, val_counts = [], different_vals = 0
      while (i--) {
          var die_val = dice[i].val
          if (val_counts[die_val] === 0) different_vals++
          val_counts[die_val]++
      }
      if (different_vals===2 || different_vals===1) 
          return 25
      else 
          return 0
    }
    FullHouseBox_.easyVal = function() { 
      return 6.583
    }

  // SequenceOfNBox
  // ***************************************************************************

    function SequenceOfNBox(player, n) {
      ScoreBox.apply(this, arguments)
      this.n = n
    }
    var SequenceOfNBox_ = SequenceOfNBox.prototype = Object.create(ScoreBox.prototype)
    SequenceOfNBox_.calcVal = function(dice) {
      var sorted_dice = dice.sortedCopy()
      var in_a_row = 1
      var last_val = 0
      var point_val = 0
      var yahtzee_wildcard = false
      var i = 5    
      while (i--) {
        var die_val = dice[i].val
        if(die_val === last_val - 1) in_a_row++
        else if(die_val < last_val) in_a_row = 1
        last_val = die_val      
      }
      if(this.n === 4) point_val = 30;
      else if(this.n === 5) point_val = 40
      yahtzee_wildcard = 
        (dice.allSame() && 
          this.player.simple_scores[dice[0].val - 1].val !== null)
      if(in_a_row >= this.n || yahtzee_wildcard) return point_val;
      else return 0
    }
    SequenceOfNBox_.easyVal = function() { 
      if (this.n===4) return 3.820
      if (this.n===5) return 0.480  // TODO: lower than yahtzee? bug?      
    }

  // TotalBox
  // ***************************************************************************

    function TotalBox(player, score_box_group) {
      Box.apply(this, arguments)
      this.score_box_group = score_box_group
    }
    var TotalBox_ = TotalBox.prototype = Object.create(Box.prototype)
    TotalBox_.refresh = function() {
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
    var YahtzeeBonusBox_ = YahtzeeBonusBox.prototype = Object.create(Box.prototype)
    YahtzeeBonusBox_.calcVal = function(dice) {
      if(dice.allSame() && 
          this.player.yahtzee.val > 0 &&
          this.player.yahtzee.unfinal === false ) 
        return 100 
      else 
        return 0
    }
    YahtzeeBonusBox_.proposeVal = function(dice) {
      if(this.player.yahtzee.val > 0 && this.player.yahtzee.unfinal === false)
        this.val += this.calcVal(dice)
    }
    YahtzeeBonusBox_.unproposeVal = function(dice) {
      if(this.player.yahtzee.val > 0 && this.player.yahtzee.unfinal === false)
        this.val -= this.calcVal(dice)
    }
    YahtzeeBonusBox_.lockVal = function(dice) {
      if(this.score_box_group.isDone()) this.unfinal = false
    }

  // UpperBonusBox
  // ***************************************************************************

    function UpperBonusBox(player) {
      Box.apply(this, arguments)
    }
    var UpperBonusBox_ = UpperBonusBox.prototype = Object.create(Box.prototype)
    UpperBonusBox_.refresh = function() {
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
    var ScoreBoxGroup_ = ScoreBoxGroup.prototype = Object.create(Array.prototype)
    ScoreBoxGroup_.isDone = function() {
      var i = this.cached_length, box
      while(i--) { 
        box = this[i]
        if(box.unfinal) return false
      }
      return true
    }
    ScoreBoxGroup_.sumOfVals = function() {
      var i = this.cached_length, retval = 0
      while (i--) retval += this[i].val
      return retval
    }
    ScoreBoxGroup_.push = function() {
      var retval = Array.prototype.push.apply(this, arguments)
      this.cached_length = this.length // cache this for speed
      return retval
    }
    ScoreBoxGroup_.pushAll = function(array_of_stuff_to_push) {
      Array.prototype.push.apply(this, array_of_stuff_to_push)
      this.cached_length = this.length 
      return this
    }
    ScoreBoxGroup_.firstEmpty = function() {
      var len = this.cached_length, i = 0
        do {
          if(this[i].val === null) return this[i]
        } while(i++ < len)
    }

  // ***************************************************************************
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

  var Player_ = Player.prototype = {} //Object.extended()

  Player_.refreshTotals = function() {
    this.simple_total.refresh()
    this.upper_bonus.refresh()
    this.upper_total.refresh()
    this.lower_total.refresh()
    this.grand_total.refresh()
  }

  Player_.ready = function() {
    return (
      this.game.player === this &&
      this.game.roll_count > 0  
    )
  }

  Player_.nextMove = function() {
    // override me for AI players
  }

  // AIPlayer
  // ***************************************************************************
    var AIPlayer = function(name, game) {
      Player.apply(this, arguments) // call super-constructor
      this.dice_to_roll = null
      this.die_index_to_compare = 0
    }
    var AIPlayer_ = AIPlayer.prototype = Object.create(Player.prototype)
    AIPlayer_.nextMove = function() {
      if (this.game.round > 13) return
      if (this.game.roll_count === 0) { // need to make first roll 
        this.game.nextRoll()
        this.die_index_to_compare = 0
        this.game.next_delay = 500
      } else if (this.game.roll_count >= 3) { // rolling is over, choose a box 
        this.game.next_delay = 2000
        var chosen_box = this.chosenBox()
        if (chosen_box.val === null)
          chosen_box.proposeVal(this.game.dice)
        else
          chosen_box.lockVal(this.game.dice)
      } else { // choose and select dice
        if(this.die_index_to_compare === 0) 
          this.chooseDice()
        if(this.die_index_to_compare < 5) { // still more to select
          var i = this.die_index_to_compare
          this.game.dice[i].selected = this.dice_to_roll[i].selected
          this.die_index_to_compare++
          this.game.next_delay = this.die_index_to_compare * 100
        } else { // done selecting, time to roll
          this.die_index_to_compare = 0
          this.game.nextRoll()
          this.game.next_delay = 500
        }
      }
    }

    AIPlayer_.chooseDice = function() {
      this.dice_to_roll = new Dice()
    }
    AIPlayer_.chosenBox = function() {
      // find the highest scoring box with just the current gamedice values
      var game_dice = this.game.dice
      var i = this.choosables.cached_length
      var bestbox = this.choosables[0], bestboxval = -1
      while (i--) {
        var thisbox = this.choosables[i]
        var thisboxval = thisbox.unfinal? thisbox.calcVal(game_dice) : -1
        if (thisboxval > bestboxval) {
          bestbox = thisbox
          bestboxval = thisboxval
        }
      }
      return bestbox
    }

  // Robot 
  // ***************************************************************************
    function Robot(name, game){ 
      AIPlayer.apply(this, arguments) // call super-constructor
    }
    var Robot_ = Robot.prototype = Object.create(AIPlayer.prototype)
    
    Robot_.chooseDice = function(trials) {

      var a,b,c,d,e
      var scores = []
      var best_score = 0, best_selection = [0,0,0,0,0]

      // score each dice selection combo
      for (a=0; a<2; a++)
        for (b=0; b<2; b++)
          for (c=0; c<2; c++)
            for (d=0; d<2; d++)
              for (e=0; e<2; e++) {
                var selection = [a,b,c,d,e]
                // var index = a*16+b*8+c*4+d*2+e // decimal representation of this selection combo 
                var trial_count = Math.pow(6,Math.max(a+b+c+d+e-1,0)) // at least one trial for each possible set of die values
                if(trial_count > 1) trial_count *= 10 // times enough to "get yahtzee" 10x on average
                var score = this.scoreSelection(selection, trial_count)
                if(score > best_score) {best_score = score; best_selection = selection}
                scores[selection] = score // keep temporarily for debugging
              }

      // finally remember the best die selection
      this.dice_to_roll = this.game.dice.clone()
      this.dice_to_roll.selectByArray(best_selection)
      
      //for debugging
      //console.log(scores)
      //console.log(best_selection)
    }

    Robot_.scoreSelection = function(selection, trials) { 
      // returns a score across available boxes for the given die selection combo
      var total = 0
      var i = Math.max(trials,1)
      var choosables_length = this.choosables.cached_length
      var fake_dice = this.game.dice.clone()
      fake_dice.selectByArray(selection)
      while (i--) { // for each trial
        var ii=5; while (ii--) if(fake_dice[ii].selected) fake_dice[ii].roll() //inline rollSelected
        ii = choosables_length
        while (ii--) { // for each choosable box
          var box = this.choosables[ii]
          if (box.unfinal) {
            total += box.calcVal(fake_dice)
          }
        }

      }
      return total / trials
    }



  // ***************************************************************************
  // Game
  // ***************************************************************************
    this.Game = function() {
      this.dice = new Dice()          // the array-like set of 5 game dice
      this.players = []               // all players
      this.player = null              // current player
      this.player_index = 0           // index of current player in players[]
      this.round = 1                  // a game has 13 rounds to score all boxes
      this.roll_count = 0             // each players gets 3 rolls
      this.started = false            // true onece a new game has started
      this.next_delay = 500           // how long the AI pauses by default between moves
      this.timeout_id = 0             // holds id for the next queued function
    }
    var Game_ = this.Game.prototype = {} //Object.extended()
    Game_.newPlayer = function(playerTypeString) {
      if(this.started) return
      var PlayerConstructor = eval(playerTypeString) || Player // TODO remove use of eval
      var player_name = playerTypeString
      var p = new PlayerConstructor(player_name, this)
      this.players.push(p)
      if(this.player===null) this.player=p
      return p
    }
    Game_.nextPlayer = function() {
      this.started = true
      this.player_index++
      this.roll_count = 0
      this.player_index %= this.players.length
      if(this.player_index === 0) this.nextRound()
      this.player = this.players[this.player_index]
      this.dice.selectAll()
    }
    Game_.nextRound = function() {
      this.round++
      if(this.round > 13) {// determine winner(s)
        var i = this.players.length, score = 0, max = 0, winner = null
        while (i--) {
          score = this.players[i].grand_total.val
          if (score>=max) {max = score; winner = this.players[i]}
        }
        winner.winner = true
      }
    }
    Game_.nextRoll = function() {
      //if(this.roll_count >= 3) return false
      this.roll_count++
      this.dice.rollSelected()
    }
}
