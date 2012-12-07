/*globals Jahtzee*/

function test() {

  var j = new Jahtzee()
  var g = new j.Game()
  var p = g.newPlayer()
  
  var trials = Math.pow(6,4) * 100
  
  var i = p.choosables.length
  var ii = trials
  


  while (i--) {
    //debugger
    var box = p.choosables[i]
    box.runavg = 0
    ii = trials
    while (ii--) {
      g.dice.selectAll()
      g.dice.rollSelected()
      box.runavg += box.calcVal(g.dice) / trials
    }
    console.log(box)
    console.log(box.runavg)
  }

}

