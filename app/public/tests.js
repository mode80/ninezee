/*globals Jahtzee*/

function generateEasyVals(trial_count) {

  var j = new Jahtzee()
  var g = new j.Game()
  var p = g.newPlayer("MaxBot")
  var ii
  
  var trials = trial_count || 10000
  
  var i = p.choosables.length
  
  while (i--) { // each box

    var box = p.choosables[i]
    
    // first make only this box available
    ii = p.choosables.length
    while (ii--) p.choosables[ii].final = true
    box.final = false

    box.runavg = 0
    box.s0 =0, box.s1=0, box.s2=0, box.s3=0, box.s4=0, box.s5=0
    ii = trials
    while (ii--) { // each trial
      box.final = false
      while (true) {
        p.nextMove()
        if (box.final) { // just finished choosing
          box.runavg += box.val / trials
          /*if(box.val===0) box.s0++; else
          if(box.val===1) box.s1++; else
          if(box.val===2) box.s2++; else
          if(box.val===3) box.s3++; else
          if(box.val===4) box.s4++; else
          if(box.val===5) box.s5++; */
          g.round = 1
          break
        }
      } 
    }

    console.log(box)
    console.log(box.runavg)

  }

}

function battlePlayers(trials, player1, player2, etc) {
  //takes a trial_count followed by list of Player class names to battle 
  
  // latest  results: 
  // [2000, "AIPlayer", "SmartBot", "MaxBot", "MixBot"]
  //        [120.149,   229.187,    239.052,  234.082] 
  // [2000, "AIPlayer", "SmartBot", "MaxBot"]
  //        [118.554,   219.400,    227.641] 

  var games = 0

  var j = new Jahtzee()
  var g = new j.Game()
  g.base_delay = 0 
  var avg_scores = []
  var i = 0

  var setUp = function setUp(args) {
      games++
      g = new j.Game()
      for(var i=1; i<args.length; i++ )
        g.newPlayer(args[i])
  }
  setUp(arguments)

  while (true) {
    g.player.nextMove()
    if (g.gameOver()) {
      console.log(games)
      i = g.players.length
      while (i--) {
        avg_scores[i] = (avg_scores[i] || 0) + g.players[i].grand_total.val / trials
      }
      setUp(arguments)
      if(games > trials) break
    }
  }

  console.log(arguments)
  console.log(avg_scores)  


}

