
// GLOBALS/TEST VARIABLES ---------------------------------------------------------
var midi, data;
var noteInterval = [40,50,59,70,90];
var currentRootNote = 0;
var level = 1;
var levelScore = 0;
var inputNote = null;
var reset = false;
var outputPortId = 1879466032;
var gateTimerMsec = 3000;
var notes = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
var scoreElements = [];

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




// TESTING ---------------------------------------------------------

// function listInputsAndOutputs( midiAccess ) {
//   for (var entry of midiAccess.inputs) {
//     var input = entry[1];
//     console.log( "Input port [type:'" + input.type + "'] id:'" + input.id +
//       "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
//       "' version:'" + input.version + "'" );
//   }

//   for (var entry of midiAccess.outputs) {
//     var output = entry[1];
//     console.log( "Output port [type:'" + output.type + "'] id:'" + output.id +
//       "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
//       "' version:'" + output.version + "'" );
//   }
// }




// MIDI FUNCTIONS ---------------------------------------------------------
function onMIDISuccess(midiAccess) {
    
    console.log("Success");
    // // when we get a succesful response, run this code
    midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status
    // listInputsAndOutputs(midi);
    // var inputs = midi.inputs.values();
    // // loop over all available inputs and listen for any MIDI input
    // for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
    //     // each time there is a midi message call the onMIDIMessage function
    //     input.value.onmidimessage = onMIDIMessage;
    // }

    setOutputBus(midi);
    startNewLevel(enableInput);
}

function onMIDIFailure(error) {
    // when we get a failed response, run this code
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + error);
}

function onMIDIMessage(message) {
    disableInput();
    data = message.data; // this gives us our [command/channel, note, velocity] data.
    console.log('MIDI data', data); // MIDI data [144, 63, 73]
    inputNote = data[1] % 12;
    console.log("Inputnote: "+inputNote);
    checkInterval();
}

function sendNote(note, portID) {
    var noteOnMessage = [0x90, note, 0x7f];    // note on, middle C, full velocity
    var output = midi.outputs.get(portID);

    // console.log("output:", output);
    output.send( noteOnMessage );
    output.send( [0x80, note, 0x40], window.performance.now() + 2000.0 );
}


// Sets the output bus to the first one in the system
function setOutputBus(midiAccess){
    var outputs = [];
    for (var entry of midiAccess.outputs) {
        outputs.push(entry);
    }
    outputPortId = outputs[0][1].id;
}

// ---------------------------------------------------------




// EVENT/BUTTON BINDS ---------------------------------------------------------

document.getElementById("buttonStart").addEventListener("click", function(){
    console.log("Start game");
    resetGame()
    start();
});

// ONÖDIG
document.getElementById("buttonReset").addEventListener("click", function(){
    console.log("Reset game");
    resetGame();
});

// ---------------------------------------------------------




//GAME LOGIC ---------------------------------------------------------

// Reset internal level score, reset and change gui, start again
function startNewLevel(callback){

    levelScore = 0;    
    createScoreElements();


    // TODO:
    // Set gui elements according to level
    updateTextGUI();

    // Randomize a note [48,72] (C3 to C5, 2 octaves) 
    currentRootNote = Math.floor((Math.random() * 24) + 48);
    console.log(currentRootNote%12);



    // Calculate and save correct interval/scale
    calculateInterval(); 
    sendNote(currentRootNote, outputPortId);
    setTimeout(callback, gateTimerMsec);
}

// Keep going without changing level or resetting
function continueSameLevel(callback){
    updateTextGUI();
    fillScoreElements();
    setTimeout(callback, gateTimerMsec);
}

// Fill the checkboxes with the current level score
function fillScoreElements(){
    for(var i=0; i<levelScore; i++){
        console.log("fill");
        scoreElements[i].checked = true;
    }
}

function updateTextGUI(){
    document.getElementById("level").innerHTML= level;
    document.getElementById("levelscore").innerHTML = levelScore;
    // Update textarea to current note
    document.getElementById("not").innerHTML = getNoteLetter(currentRootNote);
}

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
    return notes[noteIndex];
}

// Returns a major chord array from a rootNote
function createMajorChord(rootMidiNote){
    return [rootMidiNote, rootMidiNote + 4, rootMidiNote + 7];
}


function resetGame(){}


// Creates and saves the 'correct' notes in an array from the current root note and the set scale
function calculateInterval(){
    var tempNotes = [];
    var currentStep = 0;
    intervalSteps.forEach(function(step){
        currentStep += step;
        tempNotes.push((currentRootNote + currentStep)%12);
    });
    noteInterval = tempNotes;
    console.log(noteInterval);
}


// Check if the inputed noted is in the interval array and removes it if found
function checkInterval(){

    // index = -1 if the value is not found
    var index = noteInterval.indexOf(inputNote);
    if(index > -1){
        console.log("Correct!");

        levelScore++;
        if(levelScore < level){
            noteInterval.splice(index, 1); // Remove from interval
            continueSameLevel(enableInput);
        } else {
            level++
            startNewLevel(enableInput);
        }
        // Code here: depending on level; do again or go up a level 

    } else {
        console.log("wrong note");
        startNewLevel(enableInput);
        // Code here: Dont go up a level, show a wrong answer, reset note etc.
    }
}


// Start listening to midi messages
function enableInput(){
    var inputs = midi.inputs.values();
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        input.value.onmidimessage = onMIDIMessage;
    }
    console.log("input enabled");
}


// Stop listening to midi messages
function disableInput(){
    var inputs = midi.inputs.values();
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message do nothing
        input.value.onmidimessage = null;
    }
    console.log("input disabled");
}









