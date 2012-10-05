$(document).ready(function onDocumentReady(){

	$('.die').click(function onDieClick() {
		$(this).toggleClass('reverse-video')
	})

	$('#btnRoll').click(function onBtnRollClick() {
        var selectedDice =_.filter($('#dice-section .die'), function(eachDie){
            return $(eachDie).hasClass('reverse-video')
        })
        _.each(selectedDice, function(die) {
            $(die).html(Math.ceil(Math.random()*6))
            $(die).removeClass('reverse-video')
        })


    })

    $('#btnSelectAll').click(function onBtnSelectAllClick() {
        $('.die').addClass('reverse-video')
    })

    $('#btnSelectNone').click(function onBtnSelectNoneClick() {
        $('.die').removeClass('reverse-video')
    })


})

