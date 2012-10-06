function bodyController ($scope) {

    // Die "class"
    function Die(value) {
        this.value = value
        this.selected = false
    }
    Die.prototype.roll = function roll(){
        this.value = Math.ceil(Math.random()*6)
    }

    // Make array of dice with defaults
    $scope.dice = []
    for (var i = 1; i<=5; i++) $scope.dice.push(new Die(i))

    $scope.rollSelected = function() {
        var selected = _.filter($scope.dice, function(die) { die.selected })
        _.each(selected, function(die) { die.roll() } )
    }

}