function bodyController ($scope) {

  // Die "class"
  // ****************************************************************************************************
    function Die(value) {
      this.value = value
      this.selected = false
    }
    Die.prototype.roll = function roll(){
      this.value = Math.ceil(Math.random() * 6)
    }
  // ****************************************************************************************************

  // ScoreBox "class"
  // ****************************************************************************************************
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
  // ****************************************************************************************************

  // SimpleScoreBox "class"
  // ****************************************************************************************************
    function SimpleScoreBox(n) {
      this.n = n
      }
    SimpleScoreBox.prototype = new ScoreBox()
    SimpleScoreBox.prototype.calcVal = function (dieArray) {
      var sum = 0
      for (var i= 0, len=dieArray.length; i < len; i++) {
        if (this.n === dieArray[i].value) 
          sum = sum + dieArray[i].value
      }
      return sum
    }
  // ****************************************************************************************************

  // Player "class"
  // ****************************************************************************************************
    function Player(name) {
      this.name = name || "Player"
      this.aces    = new SimpleScoreBox(1)
      this.twos    = new SimpleScoreBox(2)
      this.threes  = new SimpleScoreBox(3)
      this.fours   = new SimpleScoreBox(4)
      this.fives   = new SimpleScoreBox(5)
      this.sixes   = new SimpleScoreBox(6)
    }
  // ****************************************************************************************************

  // Make array of dice with default
  $scope.dice = []
  for (var i = 1; i<=5; i++) $scope.dice.push(new Die(i))

  // Init other model objects
  $scope.p1 = new Player("Player #1")

  $scope.dice.rollSelected = function() {
    var selectedDice = _.filter(this, function(die) { return die.selected; })
    _.each(selectedDice, function(die) { die.roll() } )

  }

  $scope.dice.selectAll = function() {
    _.each(this, function(die) {die.selected=true})
  }

  $scope.dice.selectNone = function() {
    _.each(this, function(die) {die.selected=false})
  }

}
