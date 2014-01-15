/*jshint asi: true, proto: true, evil:true */

function Jahtzee() { // packages the functionality for a game of Jahtzee

  // Die 
  // ***************************************************************************

    function Die(val, sides, lowest_val) { // creates a die object that does, you know, die stuff
      this.sides = sides || 6 
      this.lowest_val = (lowest_val===undefined)? 1: lowest_val 
      this.val = val || this.roll() 
      this.selected = true }

    var Die_ = Die.prototype = {} // set the prototype object and a create a handy name for it

    Die_.roll = function() {
      this.val = Math.floor(Math.random() * this.sides) + this.lowest_val
      return this.val}

    Die_.select = function() { this.selected = true }

    Die_.deselect = function() { this.selected = false }


  // Dice
  // ***************************************************************************

    function Dice(n,sides,lowest_val) { // creates a set of n "sides"-sided dice
      sides = sides || 6
      lowest_val = (lowest_val===undefined)? 1: lowest_val 
      var dice = []
      for(var i = 1; i<=n; i++) dice.push(new Die(lowest_val,sides,lowest_val))
      dice.__proto__ = Dice.prototype // need to set proto explicitly to get array-like behavior
      dice.sides = sides
      dice.lowest_val = lowest_val
      return dice }


    Dice.possibleSequenceCount = function(n,k) { 
      // return the sequence count for n k-sided dice, as given by (n+d-1)!/n!(d-1)!
      // see http://www.murderousmaths.co.uk/books/unknownform.htm
      // cheat with lookup tables for 6 and 10 sided dice
      if (k==10) return [1,10,55,220,715,2002,5005,11440,24310,48620,92378][n]
      if (k==6) return [1,6,56,126,252,462,792,1287,2002,3003][n]
      throw "invalid k" }

    Dice.sortFn = function(a, b) {return(a.val - b.val)} // pre-defined fn for sort operations

    var Dice_ = Dice.prototype = Object.create(Array.prototype)

    Dice_.rollSelected = function() {
      var i = this.length 
      while(i--) if (this[i].selected) this[i].roll() }

    Dice_.selectByArray = function (selection) { // takes an array of booleans and selects dice accordingly
      var i = this.length 
      while (i--) this[i].selected = (selection[i]? true: false) }

    Dice_.selectAll = function() {
      var i = this.length  
      while(i--) this[i].selected = true }

    Dice_.selectNone = function() {
      var i = this.length 
      while(i--) this[i].selected = false }

    Dice_.selectInverse = function() {
      var i = this.length 
      while (i--) this[i].selected = !this[i].selected }

    Dice_.selectedCount = function() { // return count of selected dice
      var i = this.length , retval = 0
      while (i--) if (this[i].selected) retval++
      return retval }

    Dice_.sum = function() { // sum of all die vals
      var i = this.length , sum = 0
      while (i--) sum += this[i].val
      return sum }

    Dice_.sortedCopy = function() { return this.slice().sort(Dice.sortFn) }

    Dice_.valArray = function() { 
      var retvals = []
      var i = this.length
      while (i--) retvals[i] = this[i].val
      return retvals 
    }

    Dice_.setVals = function(val_array) {
      var i = val_array.length
      while(i--) this[i].val = val_array[i]
    }

    Dice_.sortedVals = function() { 
      var vals_to_sort = []
      var i = this.length
      while (i--) vals_to_sort[i] = this[i].val
      return vals_to_sort.sort() 
    }

    Dice_.allSame = function() { // return true when all die vals are equal
      var i = this.length - 1
      var lastval = this[i].val
      if (lastval===null) return false
      while (i--) { 
        if (lastval !== this[i].val) return false
        lastval = this[i].val }
      return true }

    Dice_.clone = function() { // return deep copy of this dice object
      var retval = new Dice(this.length, this.sides, this.lowest_val)
      var i = this.length 
      while (i--) {
        retval[i].val = this[i].val
        retval[i].selected = this[i].selected }
      return retval }


  // ***************************************************************************
  // Box
  // ***************************************************************************

    function Box(player) { // creates something that you'd put a number in on a player's scorecard
        this.player = player
        this.val = null
        this.final = false} 

    var Box_ = Box.prototype = {}


  // ScoreBox 
  // ***************************************************************************

    function ScoreBox(player) { // creates a type of box that contains a score (but not a total)
      Box.apply(this, arguments) }

    var ScoreBox_ = ScoreBox.prototype = Object.create(Box.prototype)

    ScoreBox_.calcVal = function(dice) { // returns what this box would score with the given dice 
      /* override this for more specific scorebox types */ }

    ScoreBox_.lockVal = function(dice) { // update this box with a final score based on the given dice
      if (this.player.ready() && !this.final) {
        this.final = true
        this.contenteditable = false 
        this.val = this.calcVal(dice)
        this.player.yahtzee_bonus.lockVal(dice) // any box update could affect yahtzee bonus
        this.player.refreshTotals()
        this.player.game.nextPlayer() } } // scoring a box marks the end of this player's turn

    ScoreBox_.proposeVal = function(dice) { // pretend to score this box with the given dice, but without finalizing it
      if (this.player.ready() && this.val === null) {
        this.contenteditable = true
        this.val = this.calcVal(dice)
        this.player.yahtzee_bonus.proposeVal(dice)
        this.player.refreshTotals() 
        return this.val } }

    ScoreBox_.unproposeVal = function(dice) { // reverse temporary effects of proposeVal()
      if (this.player.ready() && !this.final) {
        this.contenteditable = false 
        this.val = null
        this.player.yahtzee_bonus.unproposeVal(dice)
        this.player.refreshTotals() 
        return this.val } }


  // SimpleBox 
  // ***************************************************************************

    function SimpleBox(player, n) { // creates one of the top boxes on a scorecard. e.g. "Aces" when given n=1
        ScoreBox.apply(this, arguments) // call "super constructor"
        this.n = n }

    var SimpleBox_ = SimpleBox.prototype = Object.create(ScoreBox.prototype)

    SimpleBox_.calcVal = function(dice) { // find and sum only dice of value 'n'
      var sum = 0, i = dice.length 
      while (i--) if (dice[i].val === this.n) sum += dice[i].val
      return sum }


  // NOfAKindBox
  // ***************************************************************************

    function NOfAKindBox(player, n) { // creates e.g. the "3 of a kind" box when given n = 3
      ScoreBox.apply(this, arguments) // call super
      this.n = n }

    var NOfAKindBox_ = NOfAKindBox.prototype = Object.create(ScoreBox.prototype)

    NOfAKindBox_.calcVal = function(dice) { // returns sum of all dice when at least 'n' dice are equal
      var i = dice.length , ii = dice.sides+1 
      var val_counts = Array(ii) //
      while (i--) val_counts[dice[i].val] = (val_counts[dice[i].val]||0) + 1
      var most_count = 0
      while (ii--) 
        if ((val_counts[ii]||0) > most_count) most_count = val_counts[ii]
      if (most_count < this.n) return 0
      return dice.sum() }


  // Yahtzee
  // ***************************************************************************
    function YahtzeeBox(player, score) { // the one and only yathzee box
      this.score = score || 50
      NOfAKindBox.call(this, player, player.game.dice.length) } // it's basically a special NOfAKindBox with n="all dice"

    var YahtzeeBox_ = YahtzeeBox.prototype = Object.create(NOfAKindBox.prototype)

    YahtzeeBox_.calcVal = function(dice) { // you get 50 points when all dice are the same
      if (dice.allSame()) return this.score; else return 0 }


  // ChanceBox
  // ***************************************************************************

    function ChanceBox(player) { // creates the Chance box where any set of dice qualifies 
      ScoreBox.apply(this, arguments) } // call super

    var ChanceBox_ = ChanceBox.prototype = Object.create(ScoreBox.prototype)

    ChanceBox_.calcVal = function(dice) { return dice.sum() }


  // FullHouseBox
  // ***************************************************************************

    function FullHouseBox(player) { // creates the FullHouse box where all dice are one of only 2 (near-evenly split) values 
      ScoreBox.apply(this, arguments) } // call super

    var FullHouseBox_ = FullHouseBox.prototype = Object.create(ScoreBox.prototype)

    FullHouseBox_.calcVal = function(dice) {
      var i = dice.length, val_counts = Array(dice.sides+1), different_vals = 0
      var last = 0
      while (i--) {
          var die_val = dice[i].val
          if ((val_counts[die_val]||0) === 0) different_vals++
          val_counts[die_val] = (val_counts[die_val]||0) + 1
          last = die_val }
      if (different_vals===1) return 25 // yahtzee also counts as a full house
      if (
        different_vals===2 && (
          val_counts[last]===Math.floor(dice.length/2) || 
          val_counts[last]===Math.ceil(dice.length/2)
        )
      )
          return 25 
      else 
          return 0 }

  // NValues 
  // ***************************************************************************

    function NValues(player,n,score) { // creates the FullHouse box where all dice are one of only 2 (near-evenly split) values 
      this.n = n || 2
      this.score = score || 100
      ScoreBox.apply(this, arguments) } // call super

    var NValues_ = NValues.prototype = Object.create(ScoreBox.prototype)

    NValues_.calcVal = function(dice) {
      var i = dice.length, val_counts = Array(dice.sides+1), different_vals = 0
      var last = 0
      while (i--) {
        var die_val = dice[i].val
        if ((val_counts[die_val]||0) === 0) different_vals++
        val_counts[die_val] = (val_counts[die_val]||0) + 1
        last = die_val }
      if (different_vals===1) return this.score // yahtzee also counts here 
      if (different_vals===2)
        return this.score 
      else 
        return 0 }


  // SequenceOfNBox
  // ***************************************************************************

    function SequenceOfNBox(player, n, score) { // creates the box otherwise know as a straight. small_n in a row is a small one, large_n is large 
      this.score = score 
      ScoreBox.apply(this, arguments) // call super
      this.n = n }

    var SequenceOfNBox_ = SequenceOfNBox.prototype = Object.create(ScoreBox.prototype)

    SequenceOfNBox_.calcVal = function(dice) { // returns 30 for a qualifying small straight, 40 for a large
      var sorted_vals = dice.sortedVals() 
      var in_a_row = 1
      var last_val = 0
      var yahtzee_wildcard = false
      var i = dice.length    
      while (i--) {
        var die_val = sorted_vals[i]
        if (die_val === last_val - 1) in_a_row++ 
        else if (die_val !== last_val) in_a_row = 1
        last_val = die_val }
      yahtzee_wildcard = ( // will be true when we're dealing with a yahtzee that counts as a straight per official rules
        (this.player.yahtzee.final) && // a first yahtzee has been scored already, so this is an "extra"
        (this.player.yahtzee.val > 0) && // as long as yahtzee box hasn't been zeroed
        (this.player.simple_scores[dice[0].val-1].final) && // and it can't go in the corresponding SimpleScore box
        (dice.allSame()) ) // then the rules say extra yahtzee's count as straights 
      if (in_a_row >= this.n || yahtzee_wildcard) return this.score;
      else return 0 }


  // Yahtzee Bonus
  // ***************************************************************************

    function YahtzeeBonusBox(player, score_box_group, score) { // creates a box that reflects 100 times each yahtzee rolled beyond the first one
      this.score = score || 100
      Box.apply(this, arguments) // call super
      this.final = false
      this.score_box_group = score_box_group }

    var YahtzeeBonusBox_ = YahtzeeBonusBox.prototype = Object.create(Box.prototype)
    
    YahtzeeBonusBox_.calcVal = function(dice) {
      if (dice.allSame() && 
          this.player.yahtzee.val > 0 &&
          this.player.yahtzee.final ) 
        return this.score 
      else 
        return 0 }

    YahtzeeBonusBox_.lockVal = function(dice) {
      if (this.score_box_group.isDone()) this.final = true }

    YahtzeeBonusBox_.proposeVal = function(dice) {
      if (this.player.yahtzee.val > 0 && this.player.yahtzee.final)
        this.val += this.calcVal(dice) }

    YahtzeeBonusBox_.unproposeVal = function(dice) {
      if (this.player.yahtzee.val > 0 && this.player.yahtzee.final)
        this.val -= this.calcVal(dice) }


  // UpperBonusBox
  // ***************************************************************************

    function UpperBonusBox(player,bonus,threshold) { // creates a box that contains 'bonus' when the sum of SimpleBox values >= 'threshold' 
      this.bonus = bonus || 35
      this.threshold = threshold || 63
      Box.apply(this, arguments) } // call super

    var UpperBonusBox_ = UpperBonusBox.prototype = Object.create(Box.prototype)
    
    UpperBonusBox_.refresh = function() {
      this.final = this.player.simple_total.final
      if (this.player.simple_total.val >= this.threshold) this.val = this.bonus 
      if (this.final && this.val === null) this.val = 0 }


  // TotalBox
  // ***************************************************************************

    function TotalBox(player, score_box_group) { // creates a player scorecard box to contain the total of the given ScoreBoxGroup
      Box.apply(this, arguments) // call super
      this.score_box_group = score_box_group }

    var TotalBox_ = TotalBox.prototype = Object.create(Box.prototype)

    TotalBox_.refresh = function() {
      this.final = this.score_box_group.isDone() // this total is final when the boxes it totals are final
      this.val = this.score_box_group.sumOfVals() }


  // ScoreBoxGroup
  // ***************************************************************************

    function ScoreBoxGroup() { // creates an enhanced array of ScoreBoxes useful for totalling purposes
      var group = []
      group.__proto__ = Object.create(ScoreBoxGroup.prototype) // we have to set proto manually to get array-like behaviour
      return group }

    var ScoreBoxGroup_ = ScoreBoxGroup.prototype = Object.create(Array.prototype)

    ScoreBoxGroup_.isDone = function() { // returns true when constituent ScoreBoxes are all final
      var i = this.cached_length, box
      while(i--) { 
        box = this[i]
        if (!box.final) return false }
      return true }

    ScoreBoxGroup_.sumOfVals = function() { // totals constituent ScoreBoxes
      var i = this.cached_length, retval = 0
      while (i--) retval += this[i].val
      return retval }

    ScoreBoxGroup_.push = function() { // adds to the ScoreBoxGroup with Array.push syntax
      var retval = Array.prototype.push.apply(this, arguments)
      this.cached_length = this.length // cache this for speed
      return retval }

    ScoreBoxGroup_.pushAll = function(array_of_stuff_to_push) { // like push() but takes an array of ScoreBoxes to append
      Array.prototype.push.apply(this, array_of_stuff_to_push)
      this.cached_length = this.length 
      return this }

    ScoreBoxGroup_.getFinalsArray = function(){
      var i = this.length
      var retval = []
      while (i--) retval[i] = this[i].final 
      return retval
    }

    ScoreBoxGroup_.setFinalsByArray = function(final_array) {
      var i = this.length
      while (i--) this[i].final = final_array[i] 
    } 


  // ***************************************************************************
  // Player 
  // ***************************************************************************

    function Player(name, game) { // creates a Player object attached to the given Game object

      this.constructor = Player

      this.name = name || "Player"
      this.game = game
      this.winner = null // true when this player has won the last game
      this.AI = false // the non-subclassed Player object is expected to be human-controlled

      // initialize all the box objects that would appear on a player's scorecard

        // the normal scoring boxes
          this.aces             = new SimpleBox(this, 1)
          this.twos             = new SimpleBox(this, 2)
          this.threes           = new SimpleBox(this, 3)
          this.fours            = new SimpleBox(this, 4)
          this.fives            = new SimpleBox(this, 5)
          this.sixes            = new SimpleBox(this, 6)
          this.sevens           = new SimpleBox(this, 7)
          this.eights           = new SimpleBox(this, 8)
          this.nines            = new SimpleBox(this, 9)
          this.upper_bonus      = new UpperBonusBox(this,125,225)
          this.five_of_a_kind   = new NOfAKindBox(this, 5)
          this.seven_of_a_kind  = new NOfAKindBox(this, 7)
          this.two_values       = new NValues(this, 2, 100)
          this.sm_straight      = new SequenceOfNBox(this, 7, 50)
          this.lg_straight      = new SequenceOfNBox(this, 9, 100)
          this.chance           = new ChanceBox(this)
          this.yahtzee          = new YahtzeeBox(this, 500)

        // define groups for totalling etc
          this.simple_scores    = new ScoreBoxGroup()
          this.upper_scores     = new ScoreBoxGroup()
          this.lower_scores     = new ScoreBoxGroup()
          this.bonus_triggers   = new ScoreBoxGroup()
          this.choosables       = new ScoreBoxGroup()
          this.all_scores       = new ScoreBoxGroup()
          this.simple_scores.push( this.aces, this.twos, this.threes, 
            this.fours, this.fives, this.sixes, this.sevens, this.eights, this.nines)
          this.upper_scores.pushAll(this.simple_scores).push(this.upper_bonus)
          this.lower_scores.push(this.five_of_a_kind, this.seven_of_a_kind,
            this.two_values, this.sm_straight, this.lg_straight, this.chance)
          this.bonus_triggers.pushAll(this.simple_scores)
          this.bonus_triggers.pushAll(this.lower_scores)
          this.choosables.pushAll(this.bonus_triggers).push(this.yahtzee)
          this.yahtzee_bonus    = new YahtzeeBonusBox(this, this.bonus_triggers, 5000) 
          this.lower_scores.push(this.yahtzee, this.yahtzee_bonus)
          this.all_scores.pushAll(this.upper_scores).pushAll(this.lower_scores)
       
        // the total boxes
          this.simple_total     = new TotalBox(this, this.simple_scores)
          this.upper_total      = new TotalBox(this, this.upper_scores)
          this.lower_total      = new TotalBox(this, this.lower_scores)
          this.grand_total      = new TotalBox(this, this.all_scores) }


    var Player_ = Player.prototype = {} 

    Player_.refreshTotals = function() { // make all the total boxes update
      this.simple_total.refresh()
      this.upper_bonus.refresh()
      this.upper_total.refresh()
      this.lower_total.refresh()
      this.grand_total.refresh() }

    Player_.ready = function() { // true when it's this player's turn to choose dice
      return (
        this.game.player === this &&
        this.game.roll_count > 0 ) }

    Player_.nextAction = function() {} // override this for AI players 


  // AIPlayer
  // ***************************************************************************

    var AIPlayer = function(name, game) { // creates a computer-controlled player

      // init instance vars

        this.constructor = AIPlayer
        Player.apply(this, arguments) // call super
        this.chosen_dice = null
        this.die_index = 0 // incremented inside .nextAction() when selecting
        this.AI = true

      // stuff for worker threads

        this.best_selection = [0,0,0,0,0,0,0,0,0] 
        this.best_selection_score = -Infinity 
        this.target_trial_count = 0
        this.trials_completed = 0
        this.workers = []
        this.worker_index = 0

        function workerReply(e){
          var gotten = e.data
          this.trials_completed += gotten.trials_completed
          if (gotten.score > this.best_selection_score) {
            this.best_selection = gotten.selection
            this.best_selection_score = gotten.score
          }
        }

        try { // proxy out the workload to separate threads which each call scoreSelectionChunk for their portion
          this.workers[0] = new Worker("maxBotWorker.js")
          this.workers[1] = new Worker("maxBotWorker.js")
          this.workers[2] = new Worker("maxBotWorker.js")
          this.workers[3] = new Worker("maxBotWorker.js")
          this.workers[0].onmessage = workerReply.bind(this)
          this.workers[1].onmessage = workerReply.bind(this)
          this.workers[2].onmessage = workerReply.bind(this)
          this.workers[3].onmessage = workerReply.bind(this)
        } catch(err) {
          //ignore errors that stem from recursive loading webworker inside the webworker
        }

      // attach Player-specific AI strategy functions to corresponding boxes

        var i 
        i = this.choosables.length
        while (i--) {
          this.choosables[i].likability   = this.ScoreBox_likability
          this.choosables[i].avgBonus     = this.ScoreBox_easyVal }

        i = this.simple_scores.length
        while (i--) {
          this.simple_scores[i].easyVal   = this.SimpleBox_easyVal
          this.simple_scores[i].avgBonus  = this.SimpleBox_avgBonus }

        this.five_of_a_kind.easyVal       = this.NOfAKindBox_easyVal
        this.seven_of_a_kind.easyVal      = this.NOfAKindBox_easyVal
        this.two_values.easyVal           = this.NValues_easyVal
        this.yahtzee.easyVal              = this.YahtzeeBox_easyVal
        this.yahtzee.avgBonus             = this.YahtzeeBox_avgBonus
        this.chance.easyVal               = this.ChanceBox_easyVal
        this.sm_straight.easyVal          = this.SequenceOfNBox_easyVal
        this.lg_straight.easyVal          = this.SequenceOfNBox_easyVal }


    var AIPlayer_ = AIPlayer.prototype = Object.create(Player.prototype)

    // Player-centric AI stuff 

      AIPlayer_.nextAction = function() {  
        // takes the next action based on the game state
        // will be called in a loop with view updates between calls

        if (this.game.round > this.game.max_rounds) return // bail if game over already

        var rolls = this.game.roll_count // abbreviation var
        var game = this.game             // "

        // roll
          if (!this.choosing && ( rolls===0 || (rolls < game.max_rolls && this.die_index >= game.dice.length))) { 
            game.nextRoll()
            this.die_index = 0
            game.next_delay = game.base_delay // set base animation delay for view updates
            return }
    
        // choose dice
          if (this.die_index === 0 && rolls < game.max_rolls && game.dice.selectedCount()>0) {
            if (this.choosing !== true) {
              // prep and kick off async die selection analysis
              this.choosing = true
              this.chooseDice() 
            }
            if (this.target_trial_count > 0 && (this.target_trial_count - this.trials_completed) > 0) {
              // keep waiting // TODO update progress bar?
            } else if(this.die_index === 0){ 
              // it's done seleting for this roll
              this.chosen_dice = this.game.dice.clone()
              this.chosen_dice.selectByArray(this.best_selection)
              this.target_trial_count = 0
              this.trials_completed = 0
              this.best_selection_score = -Infinity 
              this.choosing = false
            }
          }

        // visibly select the dice once they're chosen, one at a time
          if (this.choosing===false && this.die_index < game.dice.length && rolls < game.max_rolls) { 
            var i = this.die_index // which die are we selecting?
            game.dice[i].selected = this.chosen_dice[i].selected
            this.die_index++; 
            game.next_delay = this.die_index * (game.base_delay / 10) // fine tuned animation delay 
            return }

        // choose a box 
          if (rolls === game.max_rolls) { 
            var chosen_box = this.chooseBox()
            if (chosen_box.val === null) {    
              chosen_box.proposeVal(game.dice)
            } else {
              chosen_box.lockVal(game.dice) }
            game.next_delay = game.base_delay * 2 } }

      AIPlayer_.chooseDice = function() { // the key decision // TODO make this generic for n k-sided dice?

        var a,b,c,d,e,f,g,h,i

        // score each possible dice selection combo 
          for (a=0; a<2; a++)
            for (b=0; b<2; b++)
              for (c=0; c<2; c++)
                for (d=0; d<2; d++)
                  for (e=0; e<2; e++) 
                    for (f=0; f<2; f++) 
                      for (g=0; g<2; g++) 
                        for (h=0; h<2; h++) 
                          for (i=0; i<2; i++) {
                            var selection = [a,b,c,d,e,f,g,h,i]
                            var trial_count = Dice.possibleSequenceCount(a+b+c+d+e+f+g+h+i,10) // at least one trial for each possible set of die sequences 
                            if (trial_count > 1) trial_count *= 1 // times enough to "get yahtzee" 1x on average
                            this.scoreSelection(selection, trial_count, this.game.dice) // this kicks of async work with Player-level properties updated then evaluated inside nextAction()
                          }
      }

      AIPlayer_.scoreSelection = function(selection, trials, dice){

        this.target_trial_count += trials
        this.worker_index = (this.worker_index + 1) % 4 // cycle through all 4
        this.worker = this.workers[this.worker_index] 
        this.worker.postMessage({
          "selection": selection, 
          "trials": trials, 
          "dicevals": dice.valArray(), 
          "finals": this.choosables.getFinalsArray(), 
          "id": this.worker_index 
        })

      }
          
      AIPlayer_.scoreSelectionChunk = function(selection, trials, dicevals) { 

        // returns a typical -best- score across available boxes for the given die selection
        // this strategy tends to target a specific box, disregarding fallback options
        var total = 0
        var i = trials || 1
        var choosables_length = this.choosables.cached_length
        var fake_dice = this.game.dice.clone()
        fake_dice.setVals(dicevals)
        var this_score, max_score
        fake_dice.selectByArray(selection)
        while (i--) { // for each trial
          var ii=fake_dice.length; while (ii--) if (fake_dice[ii].selected) fake_dice[ii].roll() //inline rollSelected
          ii = choosables_length
          max_score = 0
          while (ii--) { // for each choosable box
            var box = this.choosables[ii]
            if (!box.final) {
              this_score = box.likability(fake_dice)
              if (this_score > max_score) max_score = this_score } }
          total += max_score }
        return total / trials }


      AIPlayer_.chooseBox = function() {
        // return the highest scoring box with the current gamedice values
        var game_dice = this.game.dice
        var i = this.choosables.cached_length
        var best_box = this.choosables[0] 
        var best_score = -Infinity
        while (i--) {
          var this_box = this.choosables[i]
          if (!this_box.final) {
            var score = this_box.likability(game_dice) 
            if (score > best_score) {
              best_box = this_box
              best_score = score} } }
        return best_box }

    // Box-centric pieces of this Player's AI strategy for attachment in the constructor

      AIPlayer_.ScoreBox_easyVal = function() { return 0 }
        // // "easyVal" is a smart players's average score when targeting just this box with all rolls
        // // override this in the various ScoreBox types
        // return 0 }

      AIPlayer_.SimpleBox_easyVal = function() { 
        return this.n * 4.155 }          // derived from statistical sampling 

      AIPlayer_.NOfAKindBox_easyVal = function() {
         if (this.n===5) return 37.84 
         if (this.n===7) return 3.59 }

      AIPlayer_.YahtzeeBox_easyVal = function() { return 0 } 
        // return 2.297 }                  // derived "

      AIPlayer_.ChanceBox_easyVal = function() {
        return 62.82 }   // derived 

      AIPlayer_.NValues_easyVal = function() {
        if (this.n===2) return 13 } // derived 

      AIPlayer_.SequenceOfNBox_easyVal = function() { 
        if (this.n===7) return 38
        if (this.n===9) return 22 }

      AIPlayer_.SimpleBox_avgBonus = function(dice) { 
        // avg expected future contribution to an upper bonus
        // TODO this could be smarter
        var bonus_points = 125 
        var bonus_threshold = 225
        var n_count = this.calcVal(dice) / this.n
        var half_die_count = dice.length / 2
        var typical_bonus_portion = this.n * 5 / bonus_threshold
        var typical_bonus = bonus_points * typical_bonus_portion
        if (n_count>=5) 
          return typical_bonus * (n_count / 5)
        else
          return -1 * typical_bonus * (5-n_count) / 5 }

      AIPlayer_.YahtzeeBox_avgBonus = function(dice) { return 0 }
        // var bonus_points = 1000
        // var pct_rounds_remaining = this.player.game.round / this.player.game.max_rounds 
        // var chance_of_another_yahtzee = 0.33 * pct_rounds_remaining // roughly anyway
        // return bonus_points * chance_of_another_yahtzee }

      AIPlayer_.ScoreBox_likability = function(dice) { 
        // quantifies the "likability" of a box for the given dice 
          return this.calcVal(dice) - this.easyVal() + this.avgBonus(dice) }


  // MaxBot 
  // ***************************************************************************

    function MaxBot(name, game) { // creates an AI player that sets his sights and goes for it
      this.constructor = MaxBot
      AIPlayer.apply(this, arguments) // call super
    }

    var MaxBot_ = MaxBot.prototype = Object.create(AIPlayer.prototype)

  // ***************************************************************************
  // Game
  // ***************************************************************************

    this.Game = function Game() {     // creates a jahtzee game object, option diecount & sides, 
      this.constructor = Game
      this.dice = new Dice(9,10,0)    // the array-like set of game dice
      this.players = []               // array of all players
      this.player = null              // current player
      this.winner = null              // eventually set to the game winner
      this.player_index = 0           // index of current player in players[]
      this.max_rounds = 16            // a game has this many rounds to score all boxes
      this.round = 1                  // starting at round 1 
      this.max_rolls = 6              // each players gets this many rolls
      this.roll_count = 0             // starting at 0 
      this.started = false            // true once a new game has started
      this.base_delay = 500           // how long the AI pauses by default between actions
      this.next_delay =this.base_delay// the next AI pause, as adjusted from time to time
      this.timeout_id = 0 }

    var Game_ = this.Game.prototype = {} 

    Game_.newPlayer = function(playerTypeString) { // adds a player to the game of given type
      if (this.started) return
      var PlayerConstructor = eval(playerTypeString) || Player // TODO remove use of eval
      var player_name = playerTypeString
      var p = new PlayerConstructor(player_name, this)
      this.players.push(p)
      if (this.player===null) this.player=p
      return p }

    Game_.nextPlayer = function() { // set game state for the next player's turn
      this.started = true
      this.player_index++
      this.roll_count = 0
      this.player_index %= this.players.length
      if (this.player_index === 0) this.nextRound()
      this.player = this.players[this.player_index]
      this.dice.selectAll() }

    Game_.nextRound = function() { // set game state for the next round of play
      this.round++
      if ( this.gameOver() ) { // determine winner(s)
        var i = this.players.length, score = 0, max = 0, winner = null
        while (i--) {
          score = this.players[i].grand_total.val
          if (score>=max) {max = score; winner = this.players[i]} }
        winner.winner = true
        this.winner = winner } }

    Game_.nextRoll = function() { // set game state and execute the next roll
      if (this.roll_count >= this.max_rolls) return false
      this.roll_count++
      this.dice.rollSelected() }

    Game_.gameOver = function() { // returns true when game is over
      return (this.round > this.max_rounds) }

    Game_.toggleDie = function(die) { // toggles selection of a die. Returns false if not allowed.
      if (this.roll_count >=1 && this.player.AI === false ) {
        die.selected = !die.selected
        return true
      } else {
        return false
      } }

}
