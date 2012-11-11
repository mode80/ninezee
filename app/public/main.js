/*jshint asi: true, es5: true, proto: true*/

function bodyController ($scope) {

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

  // ScoreBox 
  // ***********************************************************************************************
    var ScoreBox = function(player) {
        this.player = player,
        this.val = null,
        this.is_temp = true
    }
    ScoreBox.prototype = {
      calcVal: function (die_array) {
        // Should return, the scorebox value of the given die_array. Override this.
      },
      proposeVal: function(die_array) {
        if (this.val === null) this.val=this.calcVal(die_array)
      },
      unproposeVal: function(die_array) {
        if (this.is_temp) this.val=null
      },
      lockVal: function(die_array) {
        if (this.val !== null && this.is_temp === true) {
          this.is_temp = false
          this.val = this.calcVal(die_array)
        }
      }
    }
  // ***********************************************************************************************

  // SimpleScoreBox 
  // ***********************************************************************************************
    var SimpleScoreBox = function(player, n) {
      ScoreBox.call(this, player) 
      this.n = n
    }
    var proto = SimpleScoreBox.prototype = new ScoreBox()
    proto.calcVal = function (die_array) {
      var sum = 0
      for (var i= 0, len=die_array.length; i < len; i++) {
        if (this.n === die_array[i].val) 
          sum = sum + die_array[i].val
      }
      this.player.simple_total.calcVal()
      return sum
    }
  // ***********************************************************************************************

  // SimpleTotalBox
  // ***********************************************************************************************
    function SimpleTotalBox(player) {
      ScoreBox.call(this,player) 
    }
    proto = SimpleTotalBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      
      var p = this.player

      this.val = p.aces.val + p.twos.val + p.threes.val + p.fours.val +
                 p.fives.val + p.sixes.val || null

      this.is_temp = p.aces.is_temp || p.twos.is_temp || p.threes.is_temp || 
                    p.fours.is_temp || p.fives.is_temp || p.sixes.is_temp

      this.player.upper_bonus.calcVal(die_array)
      this.player.upper_total.calcVal(die_array)
    }
  // ***********************************************************************************************

  // UpperBonusBox
  // ***********************************************************************************************
    function UpperBonusBox(player) {
      ScoreBox.call(this,player) 
    }  
    proto = UpperBonusBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      this.is_temp = this.player.simple_total.is_temp
      if (this.player.simple_total.val >= 63) this.val = 35
      if (!this.is_temp && this.val === null) this.val = 0
    }
  // ***********************************************************************************************

  // UpperTotalBox
  // ***********************************************************************************************
    function UpperTotalBox(player) {
      ScoreBox.call(this,player) 
    }
    proto = UpperTotalBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      var p = this.player
      this.is_temp = p.simple_total.is_temp
      this.val = (p.simple_total.val === null)? null : p.simple_total.val && p.upper_bonus.val
    }

  // NOfAKindBox
  // ***********************************************************************************************
    function NOfAKindBox(player, n) {
      ScoreBox.call(this,player)
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

  // ChanceBox
  // ***********************************************************************************************
    function ChanceBox(player) {
      ScoreBox.call(this,player)
    }
    proto = ChanceBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      return die_array.sumOfDice()
    }

  // FullHouse
  // ***********************************************************************************************
    function FullHouse(player) {
      ScoreBox.call(this,player)
    }
    proto = FullHouse.prototype = new ScoreBox()
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

  // Straight
  // ***********************************************************************************************
    function Straight(player, n) {
      ScoreBox.call(this,player)
      this.n = n
    }
    proto = Straight.prototype = new ScoreBox()
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


  // Player 
  // ***********************************************************************************************
    function Player(name) {

      this.name = name || "Player"
      
      this.aces    = new SimpleScoreBox(this, 1)
      this.twos    = new SimpleScoreBox(this, 2)
      this.threes  = new SimpleScoreBox(this, 3)
      this.fours   = new SimpleScoreBox(this, 4)
      this.fives   = new SimpleScoreBox(this, 5)
      this.sixes   = new SimpleScoreBox(this, 6)

      this.simple_total = new SimpleTotalBox(this)
      this.upper_bonus = new UpperBonusBox(this)
      this.upper_total = new UpperTotalBox(this)

      this.three_of_a_kind = new NOfAKindBox(this,3)
      this.four_of_a_kind = new NOfAKindBox(this,4)

      this.small_straight = new Straight(this,4)
      this.large_straight = new Straight(this,5)

      this.full_house = new FullHouse(this)
      this.chance = new ChanceBox(this)
      this.yahtzee = new NOfAKindBox(this,5)


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
