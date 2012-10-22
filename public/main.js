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
    function ScoreBox(player) {
      this.player = player
      this.val = null
      this.isTemp = false
      }
    ScoreBox.prototype.calcVal = function (dieArray) {
      // override this
    }
    ScoreBox.prototype.proposeVal = function(dieArray) {
      if (this.val == null) {
        this.val=this.calcVal(dieArray)
        this.isTemp = true
      }
    }
    ScoreBox.prototype.unproposeVal = function(dieArray) {
      if (this.isTemp) this.val=null
      this.isTemp = false
    }
    ScoreBox.prototype.lockVal = function(dieArray) {
      if (this.val !== null && this.isTemp === true) {
        this.val = this.calcVal(dieArray)
        this.isTemp = false
      }
    }
  // ***********************************************************************************************

  // SimpleScoreBox 
  // ***********************************************************************************************
    function SimpleScoreBox(player, n) {
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

  // SimpleTotalBox
  // ***********************************************************************************************
    function SimpleTotalBox() {}
    
    SimpleTotalBox.prototype = new ScoreBox()
    
    SimpleTotalBox.prototype.calcVal = function(aces, twos, threes, fours, fives, sixes) {
      
      if (null === aces.val || twos.val || threes.val || fours.val || fives.val || sixes.val) 
        this.val = null 
      else 
        this.val = aces.val + twos.val + threes.val + fours.val + fives.val + sixes.val

      this.isTemp = 
        aces.isTemp || twos.isTemp || threes.isTemp || fours.isTemp || fives.isTemp || sixes.isTemp
      
    }
  // ***********************************************************************************************


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
