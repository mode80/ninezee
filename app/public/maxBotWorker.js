/* JSHint *//* globals importScripts, self, Jahtzee*/

importScripts('jahtzee.js')

var j = new Jahtzee()
var g = new j.Game()
var p = g.newPlayer('MaxBot')

self.addEventListener('message', function(e){
	var given = e.data
	var gotten = {} 
	gotten.score = p.scoreSelectionChunk(given.selection, given.trials, given.dicevals)
	gotten.trials_completed = given.trials
	gotten.selection = given.selection
	self.postMessage(gotten)
}, false);

