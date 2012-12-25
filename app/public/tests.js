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
    ii = trials
    while (ii--) { // each trial
      box.final = false
      box.val = null
      while (true) {
        p.nextAction()
        if (box.final) { // just finished choosing
          box.runavg += box.val / trials
          g.round = 1
          break } } }

    console.log(box)
    console.log(box.runavg) } }

function battlePlayers(trials, player1, player2, etc) {
  //takes a trial_count followed by list of Player class names to battle 
  
  // latest  results: 
/*
[1000, "AIPlayer", "HejBot", "MaxBot", "MixBot"]
[120.12099999999985, 236.82599999999994, 238.40100000000032, 239.0150000000004]  
[120.16099999999992, 241.36299999999966, 239.1749999999998, 237.7470000000001] 
[120.50199999999982, 239.63600000000017, 237.0819999999997, 238.51899999999986] 
[119.85300000000004, 238.6580000000003, 237.84100000000018, 239.17700000000025] 
[118.49999999999987, 243.87299999999993, 237.25200000000012, 237.95999999999992] 
[119.45200000000000, 234.61099999999968, 238.2479999999998, 237.06799999999987] 
[119.80699999999989, 236.3009999999999, 241.43800000000005, 236.48499999999996] 
[118.55999999999985, 235.98100000000002, 239.59499999999994, 236.33699999999976] 
[121.42699999999995, 236.14999999999978, 236.30000000000024, 239.51700000000022]
[119.63599999999988, 237.13400000000001, 237.4299999999999, 237.59199999999993] 
[121.08200000000012, 237.2919999999999, 237.5630000000001, 239.52399999999975] 
[119.15099999999978, 238.1409999999999, 237.75699999999958, 239.25399999999996] 
[120.69999999999989, 240.7850000000003, 238.7539999999997, 238.44700000000032] 
[118.90999999999968, 236.08900000000006, 239.9689999999999, 236.87200000000016] 

*/
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
      for(var i=1; i<args.length; i++ ) g.newPlayer(args[i]) }

  setUp(arguments)

  while (true) {
    g.player.nextAction()
    if (g.gameOver()) {
      console.log(games)
      i = g.players.length
      while (i--) 
        avg_scores[i] = (avg_scores[i] || 0) + g.players[i].grand_total.val / trials
      setUp(arguments)
      if(games > trials) break } }

  console.log(arguments)
  console.log(avg_scores)  }