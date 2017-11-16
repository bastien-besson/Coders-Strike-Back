var ABTesting = 1;
//var AB = ["3",
//                "5",
//                "12684 7084",
//                "4073 4673",
//                "13010 1927",
//                "6564 7818",
//                "7499 1384",
//                "12549 7565 0 0 -1 1",
//                "12819 6603 0 0 -1 1",
//                "12280 8528 0 0 -1 1",
//                "13088 5640 0 0 -1 1"];

//var AB2 = ["3",
//                "5",
//                "12684 7084",
//                "4073 4673",
//                "13010 1927",
//                "6564 7818",
//                "7499 1384",
//                "12549 7565 0 0 -1 1",
//                "12819 6603 0 0 -1 1",
//                "12280 8528 0 0 -1 1",
//                "13088 5640 0 0 -1 1"];

var values = ["3", // laps
                "6", // checkpointCount
                "13096 2295", //checkpointX checkpointY
                "4584 2156", //checkpointX checkpointY
                "7333 4939", //checkpointX checkpointY
                "3348 7252", //checkpointX checkpointY
                "14595 7674", //checkpointX checkpointY
                "10583 5031", //checkpointX checkpointY
                "12549 7565 0 0 -1 1", // podX podY vX vY angle nextCheckPointId
                "4496 7722 0 0 225 3", // podX podY vX vY angle nextCheckPointId
                "12280 8528 0 0 -1 1", // podX podY vX vY angle nextCheckPointId
                "13088 5640 0 0 -1 1"]; // podX podY vX vY angle nextCheckPointId

var values2 = ["3", // laps
                "6", // checkpointCount
                "13096 2295", //checkpointX checkpointY
                "4584 2156", //checkpointX checkpointY
                "7333 4939", //checkpointX checkpointY
                "3348 7252", //checkpointX checkpointY
                "14595 7674", //checkpointX checkpointY
                "10583 5031", //checkpointX checkpointY
                "12549 7565 0 0 -1 1", // podX podY vX vY angle nextCheckPointId
                "4496 7722 0 0 225 3", // podX podY vX vY angle nextCheckPointId
                "12280 8528 0 0 -1 1", // podX podY vX vY angle nextCheckPointId
                "13088 5640 0 0 -1 1"]; // podX podY vX vY angle nextCheckPointId

//function readline() {
//    var val = values.shift();

//    if (values.length == 0) {
//        values = values2.slice();
//    }
//    return val;
//}

/*********************************** VECTOR ************************************************/
function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.prototype = {
    add: function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    },
    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    radiansTo: function (v) {
        var dx = this.x - v.x;
        var dy = this.y - v.y;
        var angle = Math.atan2(dy, dx); // radians
        return angle;
    },
    degreesTo: function (v) {
        var radians = this.radiansTo(v);
        var degrees = radians * 180 / Math.PI;

        if (degrees < 0) {
            degrees = 360 + degrees;
        }

        return degrees;
    },
    distance: function (v) {
        var x = this.x - v.x;
        var y = this.y - v.y;
        return Math.sqrt(x * x + y * y);
    },
    clone: function () {
        return new Vector(this.x, this.y);
    },
    toString: function () {
        return this.x + ' ' + this.y;
    }
}

/*********************************** MOVEMENT ************************************************/
var availableMoves = [
    new Int16Array([0, -90]),
    new Int16Array([0, 90]),
    new Int16Array([100, -90]),
    new Int16Array([100, 90]),
    new Int16Array([200, -90]),
    new Int16Array([200, 90]),
    new Int16Array([200, 0]),
];

/********************************** GENETIC ALGORITHM *************************************/
var simulationUnit = function (pod, moves) {
    var that = {
        pod: pod,
        moves: moves,
        weight: 0
    };

    return that;
};

var simulationGroup = function (minDepth) {
    var that = { group: [] };
    var index = 0;
    var count = Math.pow(availableMoves.length, minDepth);
    var moves = [];
    for (var x = 0; x < count; x++) moves[x] = [];

    that.run = function (podIndex, moveIndex) {
        //var endTimer;
        for (var i = 0, groupLength = that.group.length; i < groupLength; i++) {

            //endTimer = new Date().getTime();
            //var time = endTimer - GAME.main.startTimer;
            //if (time > 120) {
            //    //printErr('End of run');
            //    return "error";
            //}

            var pod = that.group[i].pod;
            var moves = that.group[i].moves;

            // Move pod
            for (var j = moveIndex, moveLength = moves.length; j < moveLength; j++) {
                pod.move(moves[j]);

                if (pod.position.distance(GAME.main.checkpoints[pod.nextCheckPointId]) < 575) {
                    pod.checkpointMultiplier++;

                    if (pod.nextCheckPointId == GAME.main.checkpoints.length - 1) {
                        pod.nextCheckPointId = 0;
                    } else {
                        pod.nextCheckPointId++;
                    }
                }

            }

            // Calculate weight
            that.group[i].weight = 100000 * pod.checkpointMultiplier - pod.position.distance(GAME.main.checkpoints[pod.nextCheckPointId]);
        }
    };

    that.increaseDepth = function () {
        var newGroup = [];

        that.group.sort((a, b) => b.weight - a.weight) // sort by weight
                  .slice(0, that.group.length / availableMoves.length) // remove the worst simulations
                  .forEach(unit => {
                      // clone simulation unit movements
                      var moves = unit.moves.slice();

                      // add new simulation Unit with one more move
                      availableMoves.forEach(move => {
                          var newUnit = simulationUnit(unit.pod.clone(), moves.concat([move]));
                          newGroup.push(newUnit);
                      });
                  });

        // update group
        that.group = newGroup;
    };

    that.update = function (pod) {
        var index = 0;
        that.group = [];
        while (index < count) {
            that.group.push(simulationUnit(pod.clone(), moves[index]));
            index++;
        }
    };

    // Initialize
    var index = 0;
    while (index < count) {
        for (var i = 0; i < minDepth; i++) {
            var value = Math.floor(index / Math.pow(availableMoves.length, i)) % availableMoves.length;
            moves[index][i] = availableMoves[value];
        }
        index++;
    }

    return that;
};

/********************************** GAME **************************************************/
var GAME = {
    speedCoefficient: 0.85,
    angleCoefficient: 0.2,
    radianCoefficient: Math.PI / 180,
};

GAME.Pod = function () {
    this.position = new Vector(0, 0);
    this.destination = new Vector(0, 0);
    this.speed = new Vector(0, 0);
    this.nextCheckPointId = 1;
    this.angle = 0;
    this.thrust = 0;
    //this.turnIndex = 1;
    //this.canBoost = true;
    this.checkpointMultiplier = 1;
};

GAME.Pod.prototype = {
    // Set the next movement of the pod
    move: function (movement, isOutput) {

        if (isOutput) {
            // Update pod thrust
            this.thrust = movement[0];

            // Calculate desired destination destination vector
            this.destination.x = this.position.x + Math.round(Math.cos((this.angle + movement[1]) * GAME.radianCoefficient)) * 100;
            this.destination.y = this.position.y + Math.round(Math.sin((this.angle + movement[1]) * GAME.radianCoefficient)) * 100;
        }

        // Update pod angle
        this.angle += movement[1] * GAME.angleCoefficient;

        // Calculate new speed
        this.speed.x += Math.cos((this.angle) * GAME.radianCoefficient) * movement[0];
        this.speed.y += Math.sin((this.angle) * GAME.radianCoefficient) * movement[0];

        // Calculate new position
        this.position.x = Math.round(this.position.x + this.speed.x);
        this.position.y = Math.round(this.position.y + this.speed.y);

        // Update speed for next turn
        this.speed.x = Math.trunc(this.speed.x * GAME.speedCoefficient);
        this.speed.y = Math.trunc(this.speed.y * GAME.speedCoefficient);
    },

    // Clone current pod
    clone: function () {
        var clone = new GAME.Pod();

        clone.position.x = this.position.x;
        clone.position.y = this.position.y;
        clone.speed.x = this.speed.x;
        clone.speed.y = this.speed.y;
        clone.angle = this.angle;
        //clone.turnIndex = this.turnIndex;
        clone.nextCheckPointId = this.nextCheckPointId;
        clone.checkpointMultiplier = this.checkpointMultiplier;

        return clone;
    },

    // Update pod infos
    update: function () {
        // 0 : posX; 1 : posY; 2 : speedX; 3 : speedY; 4 : angle; 5 : nextCheckpointId
        var line = readline();
        var inputValues = line.split(' ').map(value => parseInt(value));

        // Update turn index for current pod
        //if (this.nextCheckPointId === 0 && inputValues[5] === 1) {
        //    this.turnIndex++;
        //}

        this.position = new Vector(inputValues[0], inputValues[1]);
        this.speed = new Vector(inputValues[2], inputValues[3]);
        this.angle = inputValues[4] === -1 ? GAME.main.checkpoints[this.nextCheckPointId].degreesTo(this.position) : inputValues[4];
        this.nextCheckPointId = inputValues[5];
    }
};

GAME.main = (function () {
    var that = {
        playerPods: new Array(2).fill().map(pod => new GAME.Pod()),
        opponentPods: new Array(2).fill().map(pod => new GAME.Pod()),
        checkpoints: [],
        isDebug: false,
        logs: '',
        startTimer: 0,
    };

    // Private variables
    var loopIndex = 1;
    var startDepth = 4;
    var finalDepth = 15;
    // The genetic algorithm
    var simulations = simulationGroup(startDepth);

    // Initialize game infos
    var initialize = function () {
        // The number of laps to complete the race.
        var laps = parseInt(readline());
        // The number of checkpoints in the circuit.
        var checkpointCount = parseInt(readline());
        // Coordinates x and y of each checkpoints
        for (i = 0; i < checkpointCount; i++) {
            var checkpointCoordinates = readline().split(' ');
            GAME.main.checkpoints.push(new Vector(parseInt(checkpointCoordinates[0]), parseInt(checkpointCoordinates[1])));
        }
    };

    // Log all informations for one loop
    var logInfos = function () {
        that.logs += "index loop : " + loopIndex + "\n";
        that.logs += "POD_01 \n" +
                     "       angle: " + that.playerPods[0].angle + " || thrust: " + that.playerPods[0].thrust + "\n" +
                     "       turn: " + that.playerPods[0].turnIndex + "||" + " checkpointId: " + that.playerPods[0].nextCheckPointId + "]\n" +
                     "       speed: " + that.playerPods[0].speed + " || position: " + that.playerPods[0].position + "\n";

        that.logs += "POD_02 \n" +
                     "       angle: " + that.playerPods[1].angle + " || thrust: " + that.playerPods[1].thrust + "\n" +
                     "       turn: " + that.playerPods[1].turnIndex + "||" + " checkpointId: " + that.playerPods[1].nextCheckPointId + "]\n" +
                     "       speed: " + that.playerPods[1].speed + " || position: " + that.playerPods[1].position + "\n";
        //printErr(that.logs);
        that.logs = "";
    }

    that.run = function () {
        // Read initialization inputs
        initialize();

        // Game loop
        while (true) {
            // Start timer for one turn ( turn is 150ms max. )
            that.startTimer = new Date().getTime();

            // Update pod positions
            that.playerPods.forEach(pod => pod.update());
            that.opponentPods.forEach(pod => pod.update());

            // Move player's pod with genetic algorithm
            for (var index = 0; index < that.playerPods.length; index++) {
                var pod = that.playerPods[index];

                // Update simulation
                simulations.update(pod);

                // Run simulation
                simulations.run(index, 0);

                // Increase depth
                simulations.group = simulations.group.sort((a, b) => b.weight - a.weight) // sort by weight
                          .slice(0, simulations.group.length / 14) // remove the worst simulations

                var indexDepth = startDepth;
                while (indexDepth < finalDepth) {
                    indexDepth++;
                    simulations.increaseDepth();
                    simulations.run(index, indexDepth);
                }

                // Get best movement
                simulations.group.sort((a, b) => b.weight - a.weight);
                var bestSimulation = simulations.group[0];

                // Calculate movement
                pod.move(bestSimulation.moves[0], true);

                //// Use BOOST 
                if (loopIndex === 1 && index === 0) {
                    pod.thrust = "BOOST";
                }

                // Print movement
                print(pod.destination.x + ' ' + pod.destination.y + ' ' + pod.thrust);
                loopIndex++;
            }

            //var endTimer = new Date().getTime();
            //var time = endTimer - GAME.main.startTimer;
            //printErr("Execution time " + time + "ms \n");

            //Log informatinos
            //if (that.isDebug) {
            //    logInfos();
            //}

        }

    };

    return that;
})();

GAME.main.run();