
// GLOBALS/TEST VARIABLES ---------------------------------------------------------
var midi, data;
var noteInterval = [40,50,59,70,90];
var rootNote = 0;
var score = 0;
var inputNote = null;
var reset = false;
var portId = 1879466032;
var gateTimerMsec = 500;

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

    start(enableInput);
}

function onMIDIFailure(error) {
    // when we get a failed response, run this code
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + error);
}

function onMIDIMessage(message) {
    disableInput();
    data = message.data; // this gives us our [command/channel, note, velocity] data.
    console.log('MIDI data', data); // MIDI data [144, 63, 73]
    inputNote = data[1];
    checkInterval();
}

function sendNote(note, portID) {
  var noteOnMessage = [0x90, note, 0x7f];    // note on, middle C, full velocity
  var output = midi.outputs.get(portID);

  // console.log("output:", output);
  output.send( noteOnMessage );
  output.send( [0x80, note, 0x40], window.performance.now() + 2000.0 );
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

function start(callback){

    // Randomize a note [48,72] (C3 to C5, 2 octaves) 
    rootNote = Math.floor((Math.random() * 24) + 48);

    // Update textarea to current note
    document.getElementById("not").value = rootNote;

    // Calculate and save correct interval
    calculateInterval();  
    console.log(rootNote);
    sendNote(rootNote, portId);
    setTimeout(callback, gateTimerMsec);
}

function resetGame(){
    
}

function calculateInterval(){

}

// Check if the inputed noted is in the interval array and removes it if found
function checkInterval(){
    console.log("checkInterval called")
    var index = noteInterval.inde xOf(inputNote);
    console.log(index);
    if(index > -1){
        // Remove from interval and depending on level; do again or go up a level 
        noteInterval.splice(index, 1);
        console.log(noteInterval);
        console.log("Correct!");
    } else {
        console.log("wrong note");
        start(enableInput);
        // Dont go up a level, show a wrong answer, reset note etc.
    }
}


function enableInput(){
    console.log("enableInput called");
    var inputs = midi.inputs.values();
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        input.value.onmidimessage = onMIDIMessage;
    }

    console.log("input enabled");

}

function disableInput(){
    
    var inputs = midi.inputs.values();
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        input.value.onmidimessage = null;
    }

    console.log("input disabled");

}









