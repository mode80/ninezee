function bodyController ($scope) {

  // Die 
  // ***********************************************************************************************
    function Die(val) {
      this.val = val || 1
      this.selected = false
    }
    Die.prototype.roll = function roll(){
      this.val = Math.ceil(Math.random() * 6)
    }
  // ***********************************************************************************************

  // ScoreBox 
  // ***********************************************************************************************
    function ScoreBox() {
      this.val = null
      this.temporary = false
      }
    ScoreBox.prototype.calcVal = function (dieArray) {
      // override this
    }
    ScoreBox.prototype.proposeVal = function(dieArray) {
      if (this.val == null) {
        this.val=this.calcVal(dieArray)
        this.temporary = true
      }
    }
    ScoreBox.prototype.unproposeVal = function(dieArray) {
      if (this.temporary) this.val=null
      this.temporary = false
    }
    ScoreBox.prototype.lockVal = function(dieArray) {
      if (this.val !== null && this.temporary === true) {
        this.val = this.calcVal(dieArray)
        this.temporary = false
      }
    }
  // ***********************************************************************************************

  // SimpleScoreBox 
  // ***********************************************************************************************
    function SimpleScoreBox(n) {
      this.n = n
      }
    SimpleScoreBox.prototype = new ScoreBox()
    SimpleScoreBox.prototype.calcVal = function (dieArray) {
      var sum = 0
      for (var i= 0, len=dieArray.length; i < len; i++) {
        if (this.n === dieArray[i].val) 
          sum = sum + dieArray[i].val
      }
      return sum
    }
  // ***********************************************************************************************

  // Player 
  // ***********************************************************************************************
    function Player(name) {
      this.name = name || "Player"
      this.aces    = new SimpleScoreBox(1)
      this.twos    = new SimpleScoreBox(2)
      this.threes  = new SimpleScoreBox(3)
      this.fours   = new SimpleScoreBox(4)
      this.fives   = new SimpleScoreBox(5)
      this.sixes   = new SimpleScoreBox(6)
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
