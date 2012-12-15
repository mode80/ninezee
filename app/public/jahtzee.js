/*  TODO
-   Improve AI
      . rerun stats after various scoring fixes
      . SmartBot had 4,4,4,6,6 with another roll and (basically) only 3-of-a-kind and fours left. Chose fours without rolling again.
      . SmartBot had 3,3,3,5,2 and only 4-of-akind left, rolled only the 2
-   disable UI while AI is playing
-   Undo feature
-   implement <die> directive with dot die faces 
-   other sound effects
-   fix game. startOver()
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
    var Die_ = Die.prototype = {} 
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
      var lastval = this[4].val
      if(lastval===null) return false
      var i = 4
      while (i--) { 
        if (lastval !== this[i].val) return false
        lastval = this[i].val
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
        this.player = player
        this.val = null
        this.final = false
        this.yahtzee = false //yahtzee box has to be ID'd and treated special
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
    ScoreBox_.avgBonus = function(dice) {
      // avg expected future contribution to a bonus 
      // overrride this for specific box types
      return 0
    }
    ScoreBox_.prefScore = function(dice) {
      // a function to quantify the "likability" of this box for the AI 
      return this.calcVal(dice) - this.easyVal() + this.avgBonus(dice)
    }
    ScoreBox_.proposeVal = function(dice) {
      if(this.player.ready() && this.val === null) {
        this.val = this.calcVal(dice)
        this.player.yahtzee_bonus.proposeVal(dice)
        this.player.refreshTotals()
      }
    }
    ScoreBox_.unproposeVal = function(dice) {
      if(this.player.ready() && !this.final) {
        this.val = null
        this.player.yahtzee_bonus.unproposeVal(dice)
        this.player.refreshTotals()
      }
    }
    ScoreBox_.lockVal = function(dice) {
      if(this.player.ready() && !this.final) {
        this.final = true
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
        this.max_val = n*6
      }
    var SimpleBox_ = SimpleBox.prototype = Object.create(ScoreBox.prototype)
    SimpleBox_.calcVal = function(dice) {
      var sum = 0, i = 5
      while (i--) if(dice[i].val === this.n) sum += dice[i].val
      return sum
    }
    SimpleBox_.easyVal = function() { 
      return this.n * 2.106 // derived from statistical sampling
    }
    SimpleBox_.avgBonus = function(dice) {
      var n_count = this.calcVal(dice) / this.n
      var typical_bonus_portion = this.n*3/63
      var typical_bonus = 35 * typical_bonus_portion
      if(n_count>=3) 
        return typical_bonus * n_count / 3
      else
        return -1 * typical_bonus * (3-n_count) / 3
    }
/*    SimpleBox_.avgBonusBeta = function(dice) {
      //under development replacement for the existing crude avgBonus method
      var full_bonus_amount = 35
      var percent_contribution_toward_bonus = this.n/21 //21=(6+5+4+3+2+1)
      var total_so_far = this.player.simple_scores.sumOfVals()
      var simple_boxes = this.player.simple_scores
      var i = simple_boxes.cached_length
      var liklihood_of_bonus = 0 //TODO
      var expected_top = 0 // TODO
      var given_top = 0
      var n = this.n, RCR = this.ROLLCOUNT_RATIO
      var BONUS_THRESHOLD = 63 // per the rules
      var a=6,b=6,c=6,d=6,e=6,f=6
      while (i--) {
        if (simple_boxes[i].final)
          given_top += simple_boxes[i].val
        else 
          expected_top += (n*RCR[0] + n*RCR[1] + n*RCR[2] + n*RCR[3] + n*RCR[4] + n*RCR[5])
      }
      var target_threshold = BONUS_THRESHOLD - given_top
      while (a--)
        while (b--)
          while (c--)
            while (d--)
              while (e--)
                while (f--)
                  //something
      return 0
    }
    // What % of the time are matching die counts of [0..5] acheived on average
    SimpleBox_.ROLLCOUNT_RATIO = [0.0653,0.2299,0.3415,0.2577,0.0929,0.0127]
  */

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
      return dice.sum()
    }
    NOfAKindBox_.easyVal = function() { 
      if(this.n===3) return 14.732 
      if(this.n===4) return 5.473
    }


  // Yahtzee
  // ***************************************************************************
    function Yahtzee(player) {
      NOfAKindBox.call(this, player, 5)
      this.yahtzee = true
    }
    var Yahtzee_ = Yahtzee.prototype = Object.create(NOfAKindBox.prototype)
    Yahtzee_.calcVal = function(dice) {
      if (dice.allSame()) return 50; else return 0
    }
    Yahtzee_.easyVal = function() {
      return 2.095
    }
    Yahtzee_.avgBonus = function(dice) {
      var rounds_remaining = 13 - this.player.game.round
      var chance_of_another_yahtzee = 0.0127 * rounds_remaining // roughly anyway
      return 100 * chance_of_another_yahtzee
    }
    Yahtzee_.prefScore = function(dice) {
      var avg_bonus = 0
      var calc_val = 0
      if (this.val !== 0) { // not zeroed out
        calc_val = this.calcVal(dice)
        if(!this.final) { // first yahtzee available
          if (calc_val > 0) avg_bonus = this.avgBonus(dice)
        } else if (calc_val > 0) { // rescore as the best available other box 
          calc_val = this.player.chooseBox(dice).calcVal(dice) 
          avg_bonus = 100
        }
      }
      return calc_val - this.easyVal() + avg_bonus
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
      return 22.999
    }

  // FullHouseBox
  // ***************************************************************************

    function FullHouseBox(player) {
      ScoreBox.apply(this, arguments)
    }
    var FullHouseBox_ = FullHouseBox.prototype = Object.create(ScoreBox.prototype)
    FullHouseBox_.calcVal = function(dice) {
      var i = 5, val_counts = [0,0,0,0,0,0,0], different_vals = 0
      var last = 0
      while (i--) {
          var die_val = dice[i].val
          if (val_counts[die_val] === 0) different_vals++
          val_counts[die_val]++
          last = die_val
      }
      if (different_vals===1) return 25 // yahtzee's count as full house
      if (different_vals===2 && (val_counts[last]===2 || val_counts[last]===3))
          return 25
      else 
          return 0
    }
    FullHouseBox_.easyVal = function() { 
      return 8.945
    }

  // SequenceOfNBox
  // ***************************************************************************

    function SequenceOfNBox(player, n) {
      ScoreBox.apply(this, arguments)
      this.n = n
    }
    var SequenceOfNBox_ = SequenceOfNBox.prototype = Object.create(ScoreBox.prototype)
    SequenceOfNBox_.calcVal = function(dice) {
      var sorted_vals = [dice[0].val, dice[1].val, dice[2].val, 
                         dice[3].val, dice[4].val].sort()
      var in_a_row = 1
      var last_val = 0
      var point_val = 0
      var yahtzee_wildcard = false
      var i = 5    
      while (i--) {
        var die_val = sorted_vals[i]
        if(die_val === last_val - 1) in_a_row++
        else if(die_val < last_val && in_a_row < this.n) in_a_row = 1
        last_val = die_val      
      }
      if(this.n === 4) point_val = 30; else if(this.n === 5) point_val = 40
      yahtzee_wildcard = (
        (this.player.yahtzee.final  && this.player.yahtzee.val > 0) && // as long as yahtzee box hasn't been zeroed
        (this.player.simple_scores[dice[0].val-1].final) && // and it can't go in the corresponding SimpleScore box
        (dice.allSame())  // rules say extra yahtzee's count as straights
      )
      if(in_a_row >= this.n || yahtzee_wildcard) return point_val;
      else return 0
    }
    SequenceOfNBox_.easyVal = function() { 
      if (this.n===4) return 17.334
      if (this.n===5) return 9.888 
    }

  // TotalBox
  // ***************************************************************************

    function TotalBox(player, score_box_group) {
      Box.apply(this, arguments)
      this.score_box_group = score_box_group
    }
    var TotalBox_ = TotalBox.prototype = Object.create(Box.prototype)
    TotalBox_.refresh = function() {
      this.final = this.score_box_group.isDone()
      this.val = this.score_box_group.sumOfVals()
    }

  // Yahtzee Bonus
  // ***************************************************************************

    function YahtzeeBonusBox(player, score_box_group) {
      Box.apply(this, arguments)
      this.final = false
      this.score_box_group = score_box_group
    }
    var YahtzeeBonusBox_ = YahtzeeBonusBox.prototype = Object.create(Box.prototype)
    YahtzeeBonusBox_.calcVal = function(dice) {
      if(dice.allSame() && 
          this.player.yahtzee.val > 0 &&
          this.player.yahtzee.final ) 
        return 100 
      else 
        return 0
    }
    YahtzeeBonusBox_.proposeVal = function(dice) {
      if(this.player.yahtzee.val > 0 && this.player.yahtzee.final)
        this.val += this.calcVal(dice)
    }
    YahtzeeBonusBox_.unproposeVal = function(dice) {
      if(this.player.yahtzee.val > 0 && this.player.yahtzee.final)
        this.val -= this.calcVal(dice)
    }
    YahtzeeBonusBox_.lockVal = function(dice) {
      if(this.score_box_group.isDone()) this.final = true
    }

  // UpperBonusBox
  // ***************************************************************************

    function UpperBonusBox(player) {
      Box.apply(this, arguments)
    }
    var UpperBonusBox_ = UpperBonusBox.prototype = Object.create(Box.prototype)
    UpperBonusBox_.refresh = function() {
      this.final = this.player.simple_total.final
      if(this.player.simple_total.val >= 63) this.val = 35
      if(this.final && this.val === null) this.val = 0
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
        if(!box.final) return false
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

    this.constructor = Player

    this.name = name || "Player"
    this.game = game
    this.winner = null
    this.AI = false

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
    this.yahtzee = new Yahtzee(this)

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
      this.constructor = AIPlayer
      Player.apply(this, arguments) // call super-constructor
      this.chosen_dice = null
      this.die_index = 0 // incremented inside .nextMove() when selecting
      this.AI = true
    }
    var AIPlayer_ = AIPlayer.prototype = Object.create(Player.prototype)

    AIPlayer_.nextMove = function() {
      if (this.game.round > 13) return  // bail if game over already

      var rolls = this.game.roll_count
      var game = this.game

      // roll
        if (rolls === 0 || (rolls < 3 && this.die_index >= 5)) { 
          game.nextRoll()
          this.die_index = 0
          game.next_delay = game.base_delay
          return
        }
  
      // choose dice
        if(this.die_index === 0 && rolls < 3 && game.dice.selectedCount()>0) 
          this.chosen_dice = this.chooseDice()
  
      // animate selection
        if (this.die_index < 5 && rolls < 3) { 
          var i = this.die_index
          game.dice[i].selected = this.chosen_dice[i].selected
          this.die_index++; 
          game.next_delay = this.die_index * (game.base_delay / 5)
          return
        }

      // choose a box 
        if (rolls === 3) { 
          var chosen_box = this.chooseBox()
          if (chosen_box.val === null) {    
            chosen_box.proposeVal(game.dice)
          } else {
            chosen_box.lockVal(game.dice)
          }
          game.next_delay = game.base_delay * 2 
        }

    }

    AIPlayer_.chooseDice = function() {
      return new Dice()
    }
    AIPlayer_.chooseBox = function() {
      // find the highest scoring box with just the current gamedice values
      var game_dice = this.game.dice
      var i = this.choosables.cached_length
      var best_box = this.choosables[0] 
      var best_score = -Infinity
      while (i--) {
        var this_box = this.choosables[i]
        if (!this_box.final) {
          var pref_score = this_box.prefScore(game_dice) //this_box.calcVal(game_dice)
          if (pref_score > best_score) {
            best_box = this_box
            best_score = pref_score
          }
        }
      }
      return best_box
    }

  // SmartBot 
  // ***************************************************************************
    function SmartBot(name, game){ 
      this.constructor = SmartBot
      AIPlayer.apply(this, arguments) // call super-constructor
    }
    var SmartBot_ = SmartBot.prototype = Object.create(AIPlayer.prototype)
    
    SmartBot_.chooseDice = function(trials) {

      var a,b,c,d,e
      var scores = []
      var best_score = -Infinity, best_selection = [0,0,0,0,0]

      // score each dice selection combo
      for (a=0; a<2; a++)
        for (b=0; b<2; b++)
          for (c=0; c<2; c++)
            for (d=0; d<2; d++)
              for (e=0; e<2; e++) {
                var selection = [a,b,c,d,e]
                var trial_count = Math.pow(6,Math.max(a+b+c+d+e,0)) // at least one trial for each possible set of die values
                if(trial_count > 1) trial_count *= 5 // times enough to "get yahtzee" 5x on average
                var score = this.scoreSelection(selection, trial_count)
                if(score > best_score) 
                    {best_score = score; 
                    best_selection = selection}
                scores[selection] = score // for debugging
              }

      // return the best die selection
      var chosen_dice = this.game.dice.clone()
      chosen_dice.selectByArray(best_selection)
      return chosen_dice 
      
    }

    SmartBot_.scoreSelection = function(selection, trials) { 
      // returns a score across available boxes for the given die selection combo
      var total = 0
      var i = trials || 1
      var choosables_length = this.choosables.cached_length
      var fake_dice = this.game.dice.clone()
      fake_dice.selectByArray(selection)
      while (i--) { // for each trial
        var ii=5; while (ii--) if(fake_dice[ii].selected) fake_dice[ii].roll() //inline rollSelected
        ii = choosables_length
        while (ii--) { // for each choosable box
          var box = this.choosables[ii]
          if (!box.final || box.yahtzee) {
            total += box.prefScore(fake_dice) // box.calcVal(fake_dice)
          }
        }

      }
      return total / trials
    }
    


  // MaxBot 
  // ***************************************************************************
  function MaxBot() {
    this.constructor = MaxBot
    SmartBot.apply(this, arguments)
  }
  var MaxBot_ = MaxBot.prototype = Object.create(SmartBot.prototype)
  
  MaxBot_.scoreSelection = function(selection, trials) { 
    // returns a max across available boxes for the given die selection combo
    var total = 0
    var i = trials || 1
    var choosables_length = this.choosables.cached_length
    var fake_dice = this.game.dice.clone()
    var this_score, max_score
    fake_dice.selectByArray(selection)
    while (i--) { // for each trial
      var ii=5; while (ii--) if(fake_dice[ii].selected) fake_dice[ii].roll() //inline rollSelected
      ii = choosables_length
      max_score = 0
      while (ii--) { // for each choosable box
        var box = this.choosables[ii]
        if (!box.final || box.yahtzee) { // available for scoring
          this_score = box.prefScore(fake_dice)
          if (this_score > max_score) max_score = this_score
        }
      }
      total += max_score
    }
    return total / trials
  }


  // ***************************************************************************
  // Game
  // ***************************************************************************
    this.Game = function Game() {
      this.constructor = Game
      this.dice = new Dice()          // the array-like set of 5 game dice
      this.players = []               // all players
      this.player = null              // current player
      this.winner = null              // set to eventual winner
      this.player_index = 0           // index of current player in players[]
      this.round = 1                  // a game has 13 rounds to score all boxes
      this.roll_count = 0             // each players gets 3 rolls
      this.started = false            // true onece a new game has started
      this.base_delay = 500           // how long the AI pauses by default between moves
      this.next_delay =this.base_delay// then next AI pause as adjusted from time to time
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
      if(this.gameOver()) {// determine winner(s)
        var i = this.players.length, score = 0, max = 0, winner = null
        while (i--) {
          score = this.players[i].grand_total.val
          if (score>=max) {max = score; winner = this.players[i]}
        }
        winner.winner = true
        this.winner = winner
      }
    }
    Game_.nextRoll = function() {
      if(this.roll_count >= 3) return false
      this.roll_count++
      this.dice.rollSelected()
    }
    Game_.gameOver = function() {
      return (this.round > 13)
    }
    Game_.startOver = function() {
      var i = this.players.length
      while (i--){
        var old_name = this.players[i].name
        this.players[i] = new this.players[i].constructor(old_name)
      }
      var old_players = this.players
      this.constructor(this) //reinitialize game vars
      this.players = old_players
      this.player = this.players[0]
    }
}
