/*globals Jahtzee*/

function test() {

  var j = new Jahtzee()
  var g = new j.Game()
  var p = g.newPlayer("SmartBot")
  var ii
  
  var trials = 100 //Math.pow(6,4) //* 24
  
  var i = 1// p.choosables.length
  
  while (i--) { // each box

    var box = p.aces //p.choosables[i]
    
    // first make only this box available
    ii = p.choosables.length
    while (ii--) p.choosables[ii].unfinal = false
    box.unfinal = true

    box.runavg = 0
    box.s0 =0, box.s1=0, box.s2=0, box.s3=0, box.s4=0, box.s5=0
    ii = trials
    while (ii--) { // each trial
      box.unfinal = true
      while (true) {
        p.nextMove()
        if (!box.unfinal) { // just finished choosing
          //box.runavg += box.val / trials
          if(box.val===0) box.s0++; else
          if(box.val===1) box.s1++; else
          if(box.val===2) box.s2++; else
          if(box.val===3) box.s3++; else
          if(box.val===4) box.s4++; else
          if(box.val===5) box.s5++; 
          //eval("box.scorecount"+box.val+"=box.scorecount"+box.val+" + 1 || 1")
          g.round = 1
          break
        }
      } 
    }

    console.log(box)
    console.log(box.runavg)

  }

}

