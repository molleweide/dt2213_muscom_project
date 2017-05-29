
// GLOBALS/TEST VARIABLES ---------------------------------------------------------
var midi, data;
var noteInterval = [40,50,59,70,90];
var currentRootNote = 60;
var level = 2;
var levelScore = 0;
var PREVIOUS_NOTE = null;
var CURRENT_INPUT_NOTE = null;
var reset = false;
var outputPortId = 1879466032;

var gateTimerMsec = 3000;
var ALL_NOTES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B","C"];
var scoreElements = [];
var previousNote = undefined, currentNote = undefined;

var progressTimerIsRunning = false;
var progressTimer;
var stepTimer
var stepLength = 15;
var progressTimerDuration = 1 * 1000; // msec
var progressBarStepTime = progressTimerDuration / stepLength;
var progressNumber = 1;
var progressBarFull = false;
var contSingTimeout;
// Set scale/intervalsteps
// todo: add multiple scales and make it possible to the user to change scales
// Major scale:
var intervalSteps = [2,2,1,2,2,2];


// request MIDI access
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({
        sysex: false
    }).then(onMIDISuccess, onMIDIFailure);
} else {
    alert("No MIDI support in your browser.");
}




// List MIDI I/O ---------------------------------------------------------

function listInputsAndOutputs( midiAccess ) {
  for (var entry of midiAccess.inputs) {
    var input = entry[1];
    console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
      "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
      "' version:'" + input.version + "'" );
  }

  for (var entry of midiAccess.outputs) {
    var output = entry[1];
    console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
      "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
      "' version:'" + output.version + "'" );
  }
}




// MIDI FUNCTIONS ---------------------------------------------------------
function onMIDISuccess(midiAccess) {  
    console.log("Success");
    // // when we get a succesful response, run this code
    
    midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status

    // Set first bus to output
    // listInputsAndOutputs(midi);
    setOutputBus(midi);

    // Start game
    
}

function onMIDIFailure(error) {
    // when we get a failed response, run this code
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + error);
}

function onMIDIMessage(message) {
    clearTimeout(contSingTimeout)
    disableInput();
    data = message.data; // this gives us our [command/channel, note, velocity] data.
    console.log('MIDI message data:', data[0],data[1],data[2]); // MIDI data [144, 63, 73]
    
    if(data[0] == 144){
        updatePreviousAndCurrentNote( data[1] );
        checkInterval();
    } else {
        enableInput();
    }
    contSingTimeout = setTimeout(cancelProgressTimer, 500);
}

function sendNote(note, portID) {
    var noteOnMessage = [0x90, note, 0x7f];    // note on, note value, full velocity
    var output = midi.outputs.get(portID);

    // console.log("output:", output);
    output.send( noteOnMessage ); // Note on
    //output.send( [0x80, note, 0x40], window.performance.now() + 2000.0 ); // Note off
}


// Sets the output bus to the first one in the system
function setOutputBus(midiAccess){
    var outputs = [];
    for (var entry of midiAccess.outputs) {
        // console.log("entry: "+entry);
        outputs.push(entry);
    }
    // console.log("outputs:",outputs);
    // console.log("midiAccess.outputs:",midiAccess.outputs);
    outputPortId = outputs[0][1].id;
}

function makeArrayOfMidiIntoNotes(midiNoteArray) {
    var arr = [];
    for(var i=0; i<midiNoteArray.length; i++){
        arr.push(getNoteLetter(midiNoteArray[i])) ;
    }
    return arr;
}

//-----------------------------------------------------------------


function startProgressTimer() {
    //progressTimer = setTimeout(function(){ console.log( "*** same held for 5 sec! ***"); }, progressTimerDuration);
    fillProgressBar();
}

function cancelProgressTimer() {
    clearTimeout(progressTimer);
    progressTimerIsRunning = false;
    resetProgressBar();
    PREVIOUS_NOTE = null;
}


function fillProgressBar() {
    
    
    stepTimer = setInterval( function(){ 
        if ( progressNumber > stepLength ) {
            progressBarFull = true;
            return;
        }
        var progStepIds = "prog-" + progressNumber;
        var obj = document.getElementById( progStepIds );
        obj.style.backgroundColor = "green"; 
        progressNumber++;
    }, progressBarStepTime );
}

function resetProgressBar() {
    var progBlocks = document.getElementsByClassName("prog-block");
    clearInterval( stepTimer );
    for (var i = 0; i < progBlocks.length; i++) {
        progBlocks[i].style.backgroundColor="pink";
    }
    progressNumber = 1;
    progressBarFull = false;
}


// ---------------------------------------------------------




// EVENT/BUTTON BINDS ---------------------------------------------------------

// document.getElementById("buttonStart").addEventListener("click", function(){
//     console.log("Start game");
//     resetGame()
//     startNewLevel();
// });

$(window).keypress(function (e) {
    if (e.keyCode === 0 || e.keyCode === 32) {
        e.preventDefault()
        //setTimeout(enableInput, gateTimerMsec);
        if(waitingForSpace){
            enableInput();
            waitingForSpace = false;
        }
        
    }
})

$(window).keypress(function (e) {
    if (e.keyCode === 13) {
        e.preventDefault()
        //setTimeout(enableInput, gateTimerMsec);
        resetGame();
        startNewLevel();
        
    }
})

// ---------------------------------------------------------




//GAME LOGIC ---------------------------------------------------------

// Reset internal level score, reset and change gui, start again
function startNewLevel(){
    levelScore = 0;    
    createScoreElements();
    setStatusText("PRESS SPACE TO CAPTURE", "lightblue");

    // Randomize a note [48,72] (C3 to C5, 2 octaves) 
    
    // CURRENT ROOT NOTE
    currentRootNote = Math.floor((Math.random() * 24) + 48);
    
    // console.log("ROOT NOTE:",currentRootNote%12);

    // Calculate and save correct interval/scale
    calculateInterval(); 

    // TODO:
    // Set gui elements according to level
    updateTextGUI();
    sendChordMidi(0,4,7); // this is where the chord is sent to pd <<<<------
    waitingForSpace = true;

    
}

// Keep going without changing level or resetting
function continueSameLevel(callback){
    setStatusText("PRESS SPACE TO CAPTURE", "lightblue");
    CURRENT_INPUT_NOTE = null;
    PREVIOUS_NOTE = null;
    updateTextGUI();
    waitingForSpace = true;
}

// Fill the checkboxes with the current level score
function fillScoreElements(){
    for(var i=0; i<levelScore; i++){
        scoreElements[i].checked = true;
    }
}


function updatePreviousAndCurrentNote(midiNote) {
    PREVIOUS_NOTE = CURRENT_INPUT_NOTE;    
    CURRENT_INPUT_NOTE = (midiNote % 12); 
    
    // console.log( "CURRENT_INPUT_NOTE: " + CURRENT_INPUT_NOTE );
}

function evaluateIfPreviousIsEqualToCurrent() {
    if ( PREVIOUS_NOTE != null ) {
        if ( PREVIOUS_NOTE == CURRENT_INPUT_NOTE ) {
            return true;
        } else {
            PREVIOUS_NOTE = null;
            cancelProgressTimer()
            return false;
        }
    }
}

function updateTextGUI(){
    // document.getElementById("root-note").innerHTML = getNoteLetter(currentRootNote);
    document.getElementById("level").innerHTML= level;
    document.getElementById("levelscore").innerHTML = levelScore; 

    // Update textarea to current note
    document.getElementById("not").innerHTML = getNoteLetter(currentRootNote);
    document.getElementById("targets-intervals").innerHTML = makeArrayOfMidiIntoNotes(noteInterval) ; 
}


// Create the "level score" gui
function createScoreElements(){
    scoreElements = [];
    document.getElementById("scoreElements").innerHTML = "";
    for(var i=0; i<level; i++){
        var x = document.createElement("INPUT");
        x.setAttribute("type", "checkbox");
        //x.setAttribute("disabled", "disabled");
        scoreElements.push(x);
        document.getElementById("scoreElements").appendChild(x);
    }
}


// Writes the letter of the note, independent of what octave it is
function getNoteLetter(midiNote){
    var noteIndex = midiNote % 12;
    return ALL_NOTES[noteIndex];
}

// Returns a major chord array from a rootNote
function sendChordMidi(){
    for (var i=0; i<arguments.length; i++) {
        sendNote( currentRootNote + arguments[ i ] , outputPortId );
    }
}

function resetGame(){
    level = 1;
}


// Creates and saves the 'correct' notes in an array from the current root note and the set scale
// ie. create a target interval array
function calculateInterval(){
    var tempNotes = [];
    var currentStep = 0;
    intervalSteps.forEach(function(step){
        currentStep += step;
        tempNotes.push((currentRootNote + currentStep)%12);
    });
    noteInterval = tempNotes;
    //console.log("T ARR: ",noteInterval); // array of target intervals
}


// Check if the inputed note is in the interval array and removes it if found
// and does shit if right or wrong
function checkInterval(){

    // index = -1 if the value is not found
    
    var index = noteInterval.indexOf(CURRENT_INPUT_NOTE);

    if(index > -1){
        // if sung note does not exist in the noteInterval array
        // J: tvärtom, if it _does_ exist

        if ( !progressTimerIsRunning ){
            startProgressTimer(); 
            progressTimerIsRunning = true;
            enableInput();
            
        } else {
            if( evaluateIfPreviousIsEqualToCurrent() ){
                if(progressBarFull){
                    cancelProgressTimer();
                    levelScore++;
                    if( levelScore < level ){
                        setStatusText("CORRECT! The note was " + getNoteLetter(CURRENT_INPUT_NOTE), "green");
                        noteInterval.splice(index, 1); // Remove from interval
                        fillScoreElements();
                        setTimeout(continueSameLevel, 3000);
                    } else {
                        setStatusText("CORRECT! The note was " + getNoteLetter(CURRENT_INPUT_NOTE), "green");
                        level++
                        fillScoreElements();
                        setTimeout(startNewLevel, 3000);
                    }

                } else {
                    enableInput();
                }
                
            } else {
                    cancelProgressTimer();
                    // setStatusText("WRONG", "red");
                    CURRENT_INPUT_NOTE = null;
                    PREVIOUS_NOTE = null;
                    enableInput();
                    // setTimeout(continueSameLevel, 3000);
            }
        }




        // Code here: depending on level; do again or go up a level 

    } else {
        CURRENT_INPUT_NOTE = null;
        PREVIOUS_NOTE = null;
        console.log("wrong note");
        cancelProgressTimer();
        enableInput();
        
        // setStatusText("WRONG", "red");
        // setTimeout(continueSameLevel, 3000); 
        /* här tolkar jag det som att programmet start om level'n
            men det ska ju bara göras om man har sjungit korrekt not hela vägen
        */
        // Code here: Dont go up a level, show a wrong answer, reset note etc.
    }
}


// Start listening to midi messages
function enableInput(){
    setStatusText("SING", "green");
    var inputs = midi.inputs.values();
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        input.value.onmidimessage = onMIDIMessage;
    }
    // console.log("input enabled");
}


// Stop listening to midi messages
function disableInput(){
    var inputs = midi.inputs.values();
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message do nothing
        input.value.onmidimessage = null;
    }
    // console.log("input disabled");
}

function setStatusText(text, color){
    var a = document.getElementById("status");
    a.innerHTML = text;
    a.style.color = color;
}









