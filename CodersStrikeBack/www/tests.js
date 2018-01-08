/// <reference path="index.js" />

/* Initialize all parameters to launch the game */
var settings = ["3", // laps
                "4", // checkpointCount
                "4630 6447", //checkpointX checkpointY
                "12381 6324", //checkpointX checkpointY
                "10244 6583", //checkpointX checkpointY  
                "13821 3958", //checkpointX checkpointY
                "4630 6447 0 0 -1 1"]// podX podY vX vY angle nextCheckPointId
                //, "4496 7722 0 0 225 3"
                //, "12280 8528 0 0 -1 1"// podX podY vX vY angle nextCheckPointId
                //, "13088 5640 0 0 -1 1"];// podX podY vX vY angle nextCheckPointId

 //[4630;6447][12381;6324][10244;6583][13821;3958]



function initSettings() {
    games.innerHTML = parseInt(games.innerHTML) + 1;
    // Clear canvas
    mainCtxt.clearRect(0, 0, 800, 450);
    // Clear canvas
    pathCtxt.clearRect(0, 0, 800, 450);

    settings = [];
    var minCheckpointNb = 3;
    var maxCheckpointNb = 6;
    var maxWidth = 15000;
    var maxHeight = 8000;
    var checkpointNb = Math.floor(Math.random() * (maxCheckpointNb - minCheckpointNb + 1) + minCheckpointNb);

    settings.push("3");// Number of laps
    settings.push(checkpointNb);// Number of checkpoints

    var checkpoints = [];
    var checkpoint = new Vector();
    for (var i = 0; i < checkpointNb; i++) {
        var isOk = false;

        while (!isOk) {
            checkpoint = new Vector(Math.floor(Math.random() * (maxWidth - 1000 + 1) + 1000), Math.floor(Math.random() * (maxHeight - 1000 + 1) + 1000));

            if (!checkpoints.some(cp => cp.distance(checkpoint) < 1200)) {
                isOk = true;
            }
        }
        checkpoints.push(checkpoint);

        if (i == 0) {
            previousPosition = new Vector(checkpoint.x, checkpoint.y);
        }
    }

    checkpointCoordinates.innerHTML = "";
    checkpoints.forEach(cp => {
        settings.push(cp.x + ' ' + cp.y);
        checkpointCoordinates.innerHTML += "[" + cp.x + ";" + cp.y + "]";
    });
    settings.push(previousPosition.x + ' ' + previousPosition.y + ' 0 0 -1 1');
}

function readline() {
    return settings.shift();
}

function printErr(msg) {
    //console.warn(msg);
}

function print(msg) {
    //console.log(msg);
}

function display(pod) {
    // Clear canvas
    mainCtxt.clearRect(0, 0, 800, 450);
    mainCtxt.fillStyle = "black";
    mainCtxt.fillText('loop : ' + GAME.main.loopIndex, 5, 15);

    // Draw checkpoints
    GAME.main.checkpoints.forEach((checkpoint, index) => {
        // Display pod on map
        mainCtxt.beginPath();
        mainCtxt.fillStyle = "grey";
        mainCtxt.arc(
            checkpoint.x * screenRatio,
            checkpoint.y * screenRatio,
            600 * screenRatio,
            0,
            2 * Math.PI);
        mainCtxt.stroke();
        mainCtxt.fill();

        mainCtxt.fillStyle = "black";
        mainCtxt.fillText(index, checkpoint.x * screenRatio - 5, checkpoint.y * screenRatio + 5);
    });

    // Display pod on map
    mainCtxt.beginPath();
    mainCtxt.fillStyle = "red";
    mainCtxt.arc(
        pod.position.x * screenRatio,
        pod.position.y * screenRatio,
        400 * screenRatio,
        0,
        2 * Math.PI);
    mainCtxt.stroke();
    mainCtxt.fill();

    // Draw trajectory
    mainCtxt.beginPath();
    mainCtxt.fillStyle = "black";
    mainCtxt.moveTo(pod.position.x * screenRatio, pod.position.y * screenRatio);
    mainCtxt.lineTo(
        pod.position.x * screenRatio + Math.cos(pod.angle * GAME.radianCoefficient) * 25,
        pod.position.y * screenRatio + Math.sin(pod.angle * GAME.radianCoefficient) * 25);
    mainCtxt.stroke();

    pathCtxt.fillStyle = "black";
    pathCtxt.font = "14px Arial";
    pathCtxt.fillText(GAME.main.loopIndex, pod.position.x * screenRatio, pod.position.y * screenRatio);
    pathCtxt.beginPath();
    pathCtxt.moveTo(previousPosition.x * screenRatio, previousPosition.y * screenRatio);
    pathCtxt.lineTo(pod.position.x * screenRatio, pod.position.y * screenRatio);
    pathCtxt.stroke();
    previousPosition.x = pod.position.x;
    previousPosition.y = pod.position.y;

    var angle = pod.angle;
    var nextNextCheckpointId = pod.nextCheckPointId == GAME.main.checkpoints.length - 1 ? 0 : pod.nextCheckPointId + 1;
    var cp1Angle = GAME.main.checkpoints[pod.nextCheckPointId].degreesTo(pod.position);
    var cp2Angle = GAME.main.checkpoints[nextNextCheckpointId].degreesTo(pod.position);

    var angleCp1 = Math.abs(angle - cp1Angle) <= 180 ? Math.abs(angle - cp1Angle) : 360 - Math.abs(angle - cp1Angle);
    var angleCp2 = Math.abs(angle - cp2Angle) <= 180 ? Math.abs(angle - cp2Angle) : 360 - Math.abs(angle - cp2Angle);

    mainCtxt.fillText('angle : ' + angleCp1, 5, 35);
    mainCtxt.fillText('angle : ' + angleCp2, 5, 55);

    //if (angleCp1 + angleCp2 > 180 + 10) {
    //    errors.innerHTML += GAME.main.loopIndex + ':' + (angleCp1 + angleCp2) + ';';
    //}
}

var podIndex = 0;
var games = 0;
var errors = 0;
var loops = 0;
var screenRatio = 1 / 20;
var games = document.getElementById("games");
var errors = document.getElementById("errors");
var checkpointCoordinates = document.getElementById("checkpoints");
var btnStop = document.getElementById("btnStop");
var mainCanvas = document.getElementById("main");
var mainCtxt = mainCanvas.getContext("2d");
var pathCanvas = document.getElementById("path");
var pathCtxt = pathCanvas.getContext("2d");
var previousPosition = new Vector();

mainCtxt.font = "bold 16px Arial";
mainCtxt.beginPath();
mainCtxt.rect(0, 0, 800, 450);
mainCtxt.fillStyle = "grey";
mainCtxt.fill();

btnStop.onclick = function () {
    debugger;
    clearInterval(GAME.main.loopFunction);
}

var launchTest = function () {
    
    initSettings();
    GAME.main.run();
};

launchTest();