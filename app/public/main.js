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
        this.player.calcTotals()
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

  // SimpleBox 
  // ***********************************************************************************************
    var SimpleBox = function(player, n) {
      ScoreBox.call(this, player) 
      this.n = n
    }
    var proto = SimpleBox.prototype = new ScoreBox()
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
      this.val = p.simple_boxes.reduce( function(sum,die){return sum + die.val}, 0 ) || null
      this.is_temp = p.simple_boxes.reduce( function(temp,die){return temp || die.is_temp}, false )
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

  // LowerTotalBox
  // ***********************************************************************************************
    function LowerTotalBox(player) {
      ScoreBox.call(this,player) 
    }
    proto = LowerTotalBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      var p = this.player
      this.is_temp = p.lower_boxes.reduce( function(temp,die){return temp || die.is_temp}, false )
      this.val =  p.lower_boxes.reduce( function(sum,die){return sum + die.val}, 0 )
    }

  // GrandTotalBox
  // ***********************************************************************************************
    function GrandTotalBox(player) {
      ScoreBox.call(this,player)
    }
    proto = GrandTotalBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      var p = this.player
      return p.upper_total + p.lower_total
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

  // Yahtzee Bonus
  // ***********************************************************************************************
    function YahtzeeBonusBox(player) {
      ScoreBox.call(this,player)
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
      ScoreBox.call(this,player)
    }
    proto = ChanceBox.prototype = new ScoreBox()
    proto.calcVal = function(die_array) {
      return die_array.sumOfDice()
    }

  // FullHouseBox
  // ***********************************************************************************************
    function FullHouseBox(player) {
      ScoreBox.call(this,player)
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

  // StraightBox
  // ***********************************************************************************************
    function StraightBox(player, n) {
      ScoreBox.call(this,player)
      this.n = n
    }
    proto = StraightBox.prototype = new ScoreBox()
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
      
      this.simple_boxes = []
      this.aces    = this.simple_boxes[0] =  new SimpleBox(this, 1)
      this.twos    = this.simple_boxes[1] =  new SimpleBox(this, 2)
      this.threes  = this.simple_boxes[2] =  new SimpleBox(this, 3)
      this.fours   = this.simple_boxes[3] =  new SimpleBox(this, 4)
      this.fives   = this.simple_boxes[4] =  new SimpleBox(this, 5)
      this.sixes   = this.simple_boxes[5] =  new SimpleBox(this, 6)

      this.simple_total = new SimpleTotalBox(this)
      this.upper_bonus  = new UpperBonusBox(this)
      this.upper_total  = new UpperTotalBox(this)

      this.upper_boxes  = this.simple_boxes.clone()
      this.upper_boxes.push(this.upper_bonus)

      this.lower_boxes = []
      this.three_of_a_kind  = this.lower_boxes[0] = new NOfAKindBox(this,3)
      this.four_of_a_kind   = this.lower_boxes[1] = new NOfAKindBox(this,4)
      this.full_house       = this.lower_boxes[4] = new FullHouseBox(this)
      this.small_straight   = this.lower_boxes[2] = new StraightBox(this,4)
      this.large_straight   = this.lower_boxes[3] = new StraightBox(this,5)
      this.chance           = this.lower_boxes[5] = new ChanceBox(this)
      this.yahtzee          = this.lower_boxes[6] = new NOfAKindBox(this,5)
      this.yahtzee_bonus    = this.lower_boxes[7] = new YahtzeeBonusBox(this)

      this.lower_total = new LowerTotalBox(this)
      this.grand_total = new GrandTotalBox(this)

    }
    Player.prototype.calcTotals = function() {
        this.upper_bonus.calcVal()
        this.upper_total.calcVal()          
        this.lower_total.calcVal()          
        this.grand_total.calcVal()          
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
