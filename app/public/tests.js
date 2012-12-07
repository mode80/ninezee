/*globals Jahtzee*/

function test() {

  var j = new Jahtzee()
  var g = new j.Game()
  var p = g.newPlayer("Robot")
  
  var trials = 1500 * 24
  
  var i = p.choosables.length
  var ii = trials
  


  while (i--) { // each box

    var box = p.choosables[i]

    // first make only this box available
    ii = p.choosables.length
    while (ii--) p.choosables[i].unfinal = false
    box.unfinal = true

    box.runavg = 0
    ii = trials
    while (ii--) { // each trial
      box.unfinal = true
      while (true) {
        p.nextMove()
        if (!box.unfinal) { // just finished choosing
          box.runavg += box.val / trials
          g.round = 1
          break
        }
      } 
    }

    console.log(box)
    console.log(box.runavg)

  }

}

