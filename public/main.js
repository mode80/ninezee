/*globals _, angular*/

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
        this.isTemp = true
    }
    ScoreBox.prototype = {
      calcVal: function (dieArray) {
        // override this
      },
      proposeVal: function(dieArray) {
        if (this.val === null) this.val=this.calcVal(dieArray)
      },
      unproposeVal: function(dieArray) {
        if (this.isTemp) this.val=null
      },
      lockVal: function(dieArray) {
        if (this.val !== null && this.isTemp === true) {
          this.isTemp = false
          this.val = this.calcVal(dieArray)
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
    proto.calcVal = function (dieArray) {
      var sum = 0
      for (var i= 0, len=dieArray.length; i < len; i++) {
        if (this.n === dieArray[i].val) 
          sum = sum + dieArray[i].val
      }
      this.player.simpleTotal.calcVal()
      return sum
    }
  // ***********************************************************************************************

  // SimpleTotalBox
  // ***********************************************************************************************
    function SimpleTotalBox(player) {
      ScoreBox.call(this,player) 
    }
    proto = SimpleTotalBox.prototype = new ScoreBox()
    proto.calcVal = function() {
      
      var p = this.player

      this.val = p.aces.val + p.twos.val + p.threes.val + p.fours.val +
                 p.fives.val + p.sixes.val || null

      this.isTemp = p.aces.isTemp || p.twos.isTemp || p.threes.isTemp || 
                    p.fours.isTemp || p.fives.isTemp || p.sixes.isTemp

      this.player.upperBonus.calcVal()
      this.player.upperTotal.calcVal()
    }
  // ***********************************************************************************************

  // UpperBonusBox
  // ***********************************************************************************************
    function UpperBonusBox(player) {
      ScoreBox.call(this,player) 
    }  
    proto = UpperBonusBox.prototype = new ScoreBox()
    proto.calcVal = function() {
      this.isTemp = this.player.simpleTotal.isTemp
      if (this.player.simpleTotal.val >= 63) this.val = 35
      if (!this.isTemp && this.val === null) this.val = 0
    }
  // ***********************************************************************************************

  // UpperTotalBox
  // ***********************************************************************************************
    function UpperTotalBox(player) {
      ScoreBox.call(this,player) 
    }
    proto = UpperTotalBox.prototype = new ScoreBox()
    proto.calcVal = function() {
      this.isTemp = this.player.simpleTotal.isTemp
      this.val = this.player.simpleTotal.val + this.player.upperBonus.val
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

      this.simpleTotal = new SimpleTotalBox(this)
      this.upperBonus = new UpperBonusBox(this)
      this.upperTotal = new UpperTotalBox(this)

    }
  // ***********************************************************************************************

  // Dice
  // ***********************************************************************************************
    var dice = []
    for (var i=1; i<=5; i++) dice.push(new Die(i))

    dice.rollSelected = function() {
      var selectedDice = _.filter(dice, function(die) { return die.selected; })
      _.each(selectedDice, function(die) { die.roll() } )
    }

    dice.selectAll = function() {
      _.each(dice, function(die) {die.selected=true})
    }

    dice.selectNone = function() {
      _.each(dice, function(die) {die.selected=false})
    }
// *************************************************************************************************


// Init model objects
  $scope.dice = dice
  $scope.p1 = new Player("Player #1")

}
