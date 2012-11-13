/*jshint asi: true, es5: true, proto: true*/

function bodyController ($scope) {

  var proto

  // Die 
  // ***********************************************************************************************
    var Die = function(val) {
        this.val = val || 1
        this.selected = false
    }
    Die.prototype.roll = function() {
      this.val = Math.ceil(Math.random() * 6)
    }
  // ***********************************************************************************************


  // Box
  // ***********************************************************************************************
    var Box = function Box (player) {
      this.player = player,
      this.val = null,
      this.is_temp = true
    }


  // ScoreBox 
  // ***********************************************************************************************
    var ScoreBox = function(player) {
      Box.apply(this, arguments)
    }
    proto = ScoreBox.prototype = new Box()
    proto.calcVal = function (die_array) {
      // override this
    }
    proto.proposeVal = function(die_array) {
      if (this.val === null) this.val=this.calcVal(die_array)
      this.player.refreshTotals()
    }
    proto.unproposeVal = function(die_array) {
      if (this.is_temp) this.val=null
      this.player.refreshTotals()
    }
    proto.lockVal = function(die_array) {
      if (this.val !== null && this.is_temp === true) {
        this.is_temp = false
        this.val = this.calcVal(die_array)
        this.player.refreshTotals()
      }
    }
  // ***********************************************************************************************

  // SimpleBox 
  // ***********************************************************************************************
    var SimpleBox = function(player, n) {
      ScoreBox.apply(this,arguments) 
      this.n = n
    }
    proto = SimpleBox.prototype = new ScoreBox()
    proto.calcVal = function (die_array) {
      var sum = 0
      for (var i= 0, len=die_array.length; i < len; i++) {
        if (this.n === die_array[i].val) 
          sum = sum + die_array[i].val
      }
      return sum
    }
  // ***********************************************************************************************

  // NOfAKindBox
  // ***********************************************************************************************
    function NOfAKindBox(player, n) {
      ScoreBox.apply(this,arguments)
      this.n = n
    }
    proto = NOfAKindBox.prototype = new ScoreBox()
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

  // Yahtzee Bonus
  // ***********************************************************************************************
    function YahtzeeBonusBox(player) {
      ScoreBox.apply(this,arguments)
    }
    proto = YahtzeeBonusBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      var added_bonus
      if ( NOfAKindBox.prototype.calcVal.call(this, die_array, 5) > 0 && 
           this.player.yahtzee.val > 0) {
        added_bonus = 100
      }
      this.val =+ added_bonus
    }

  // ChanceBox
  // ***********************************************************************************************
    function ChanceBox(player) {
      ScoreBox.apply(this,arguments)
    }
    proto = ChanceBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      return die_array.sumOfDice()
    }

  // FullHouseBox
  // ***********************************************************************************************
    function FullHouseBox(player) {
      ScoreBox.apply(this,arguments)
    }
    proto = FullHouseBox.prototype = new ScoreBox()
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
      if (count[1] + count[2] === 5) return 25; else return 0
    }

  // SequenceOfNBox
  // ***********************************************************************************************
    function SequenceOfNBox(player, n) {
      ScoreBox.apply(this,arguments)
      this.n = n
    }
    proto = SequenceOfNBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      var sorted_dice = die_array.sortedCopy()
      var in_a_row = 1
      var last_val
      var point_val = 0
      sorted_dice.each(function(die) {
        if (die.val === last_val + 1) in_a_row++
        last_val = die.val
      })
      if (this.n === 4) point_val=30; else if (this.n === 5) point_val=40
      if (in_a_row >= this.n) return point_val; else return 0
    }

  // TotalBox
  // ***********************************************************************************************
    function TotalBox(player, score_box_group) {
      Box.apply(this,arguments)
      this.score_box_group = score_box_group
    }
    proto = TotalBox.prototype = new Box()
    proto.refresh = function() {
      this.is_temp = ! this.score_box_group.isDone()
      this.val = this.score_box_group.sumOfVals()
    }

  // UpperBonusBox
  // ***********************************************************************************************
    function UpperBonusBox(player) {
      Box.apply(this,arguments) 
    }  
    proto = UpperBonusBox.prototype = new Box()
    proto.refresh = function() {
      this.is_temp = this.player.simple_total.is_temp
      if (this.player.simple_total.val >= 63) this.val = 35
      if (!this.is_temp && this.val === null) this.val = 0
    }
  // ***********************************************************************************************

  // ScoreBoxGroup
  // ***********************************************************************************************
    function ScoreBoxGroup () {}
    proto = ScoreBoxGroup.prototype = []
    proto.isDone = function() {
      var i = this.length, box
      while (i--) {
        box = this[i]
        if (box.is_temp || box.val === null) return false
      }
      return true
    }
    proto.sumOfVals = function() {
      var i = this.length, sum = 0
      while (i--) {
        sum = sum + this[i].val
      } 
      return sum
      //return this.sum( function(box){ return box.val} )
    }
    proto.applyPush = function(array_of_stuff_to_push) {
      Array.prototype.push.apply(this, array_of_stuff_to_push)
      return this
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
      this.small_straight   = new SequenceOfNBox(this,4)
      this.large_straight   = new SequenceOfNBox(this,5)
      this.chance           = new ChanceBox(this)
      this.yahtzee          = new NOfAKindBox(this,5)
      this.yahtzee_bonus    = new YahtzeeBonusBox(this)

      this.simple_scores = new ScoreBoxGroup()
      this.upper_scores = new ScoreBoxGroup()
      this.lower_scores = new ScoreBoxGroup()
      this.all_scores  = new ScoreBoxGroup()
      with (this) { 
        simple_scores.push(aces,twos,threes,fours,fives,sixes)
        upper_scores.applyPush(simple_scores).push(upper_bonus)
        lower_scores.push(three_of_a_kind, four_of_a_kind, full_house, small_straight, 
                             large_straight, chance, yahtzee, yahtzee_bonus)
        all_scores.applyPush(upper_scores).applyPush(lower_scores)
      }

      this.simple_total = new TotalBox(this, this.simple_scores) 
      this.upper_total  = new TotalBox(this, this.upper_scores)
      this.lower_total = new TotalBox(this, this.lower_scores)
      this.grand_total = new TotalBox(this, this.all_scores)

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
// *************************************************************************************************


// Init model objects
  $scope.dice = dice
  $scope.p1 = new Player("Player #1")

}
