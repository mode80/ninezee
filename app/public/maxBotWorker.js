/* JSHint *//* globals importScripts, self, Jahtzee*/

importScripts('jahtzee.js')

var j = new Jahtzee()
var g = new j.Game()
var p = g.newPlayer('MaxBot')

self.addEventListener('message', function(e){
	var given = e.data
	var returning = {} 
	p.choosables.setFinalsByArray(given.finals)
	returning.score = p.scoreSelectionChunk(given.selection, given.trials, given.dicevals)
	returning.trials_completed = given.trials
	returning.selection = given.selection
	self.postMessage(returning)
}, false);

