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
    distance2: function (v) {
        var x = this.x - v.x;
        var y = this.y - v.y;
        return x * x + y * y;
    },
    clone: function () {
        return new Vector(this.x, this.y);
    },
    toString: function () {
        return this.x + ' ' + this.y;
    }
}

/*********************************** MOVEMENT ************************************************/
function Movement(thrust, angle) {
    this.thrust = thrust || 0;
    this.angle = angle || 0;
}

Movement.prototype = {
    toString: function () {
        return 'A' + this.angle + ' T' + this.thrust;
    }
}

var availableMoves = [
    new Movement(0, -90),
    new Movement(0, 90),
    new Movement(100, 0),
    new Movement(100, -90),
    new Movement(100, 90),
    new Movement(200, -90),
    new Movement(200, 90),
    new Movement(200, 0),
];

/********************************** GENETIC ALGORITHM *************************************/

var simulationUnit = function (pod, moves) {
    var that = {
        pod: pod,
        moves: moves,
        weight: 0
    };

    return that;
}

var simulationGroup = function (pod, minDepth) {
    var that = { group: [] };
    var index = 0;
    var count = Math.pow(availableMoves.length, minDepth);
    var moves = [];
    for (var x = 0; x < count; x++) moves[x] = [];

    that.run = function (pod, moveIndex) {
        for (i = 0; i < that.group.length; i++) {
            var currentPod = that.group[i].pod;
            var moves = that.group[i].moves;

            // Move pod
            for (j = moveIndex; j < moves.length; j++) {
                currentPod.move(moves[j]);
                
                if (currentPod.position.distance2(GAME.main.checkpoints[currentPod.nextCheckPointId]) < 250000) {
                    currentPod.checkpointMultiplier++;

                    if (currentPod.nextCheckPointId == GAME.main.checkpoints.length - 1) {
                        currentPod.nextCheckPointId = 0;
                    } else {
                        currentPod.nextCheckPointId++;
                    }
                }
            }

            // Calculate weight
            that.group[i].weight = 20000 * currentPod.checkpointMultiplier - currentPod.position.distance(GAME.main.checkpoints[currentPod.nextCheckPointId]);
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

    // Initialize
    while (index < count) {
        for (var i = 0; i < minDepth; i++) {
            var value = Math.floor(index / Math.pow(availableMoves.length, i)) % availableMoves.length;
            moves[index][i] = availableMoves[value];
        }

        that.group.push(simulationUnit(pod.clone(), moves[index]));
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
            this.thrust = movement.thrust;

            // Calculate desired destination destination vector
            this.destination.x = this.position.x + Math.round(Math.cos((this.angle + movement.angle) * GAME.radianCoefficient)) * 100;
            this.destination.y = this.position.y + Math.round(Math.sin((this.angle + movement.angle) * GAME.radianCoefficient)) * 100;
        }

        // Update pod angle
        this.angle += movement.angle * GAME.angleCoefficient;

        // Calculate new speed
        this.speed.x += Math.cos((this.angle) * GAME.radianCoefficient) * movement.thrust;
        this.speed.y += Math.sin((this.angle) * GAME.radianCoefficient) * movement.thrust;

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
        GAME.main.logs += line + "\n";
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
        playerPods: [],
        opponentPods: [],
        checkpoints: [],
        isDebug: true,
        logs: '',
    };

    // Private variables
    var loopIndex = 1;
    var initDepth = 5;
    var finalDepth = 5;

    // Initialize game infos
    var initialize = function () {
        // The pods
        that.playerPods[0] = new GAME.Pod();
        that.playerPods[1] = new GAME.Pod();
        that.opponentPods[0] = new GAME.Pod();
        that.opponentPods[1] = new GAME.Pod();
        // The number of laps to complete the race.
        var line = readline();
        GAME.main.logs += line + "\n";
        var laps = parseInt(line);
        // The number of checkpoints in the circuit.
        var line = readline();
        GAME.main.logs += line + "\n";
        var checkpointCount = parseInt(line);
        // Coordinates x and y of each checkpoints
        for (i = 0; i < checkpointCount; i++) {
            var line = readline();
            GAME.main.logs += line + "\n";
            var checkpointCoordinates = line.split(' ');
            GAME.main.checkpoints.push(new Vector(parseInt(checkpointCoordinates[0]), parseInt(checkpointCoordinates[1])));
        }
    };

    // Log all informations for one loop
    var logInfos = function () {
        //that.logs += "index loop : " + loopIndex + "\n";
        //that.logs += "POD_01 \n" +
        //             "       angle: " + that.playerPods[0].angle + " || thrust: " + that.playerPods[0].thrust + "\n" +
        //             "       turn: " + that.playerPods[0].turnIndex + "||" + " checkpointId: " + that.playerPods[0].nextCheckPointId + "]\n" +
        //             "       speed: " + that.playerPods[0].speed + " || position: " + that.playerPods[0].position + "\n";

        //that.logs += "POD_02 \n" +
        //             "       angle: " + that.playerPods[1].angle + " || thrust: " + that.playerPods[1].thrust + "\n" +
        //             "       turn: " + that.playerPods[1].turnIndex + "||" + " checkpointId: " + that.playerPods[1].nextCheckPointId + "]\n" +
        //             "       speed: " + that.playerPods[1].speed + " || position: " + that.playerPods[1].position + "\n";
        printErr(that.logs);
        that.logs = "";
    }

    that.run = function () {
        // Read initialization inputs
        initialize();

        // Game loop
        while (true) {

            // Update pod positions
            that.playerPods.forEach(pod => pod.update());
            that.opponentPods.forEach(pod => pod.update());

            // Move player's pod with genetic algorithm
            for (var index = 0; index < that.playerPods.length; index++) {

                if (index == 0) {
                    // Print movement
                    print('0 0 50');

                } else {
                    var pod = that.playerPods[index];

                    // Create simulation
                    var podSimulations = simulationGroup(pod, initDepth);

                    // Run simulation
                    podSimulations.run(pod, 0);

                    //var indexDepth = initDepth;

                    //podSimulations.group = podSimulations.group.sort((a, b) => b.weight - a.weight) // sort by weight
                    //                                    .slice(0, podSimulations.group.length / availableMoves.length); // remove the worst simulations

                    //while (indexDepth < finalDepth) {
                    //    podSimulations.increaseDepth();

                    //    // Run simulation
                    //    podSimulations.run(pod, indexDepth);
                    //    indexDepth++;
                    //}

                    podSimulations.group.sort((a, b) => b.weight - a.weight);

                    // Get best movement
                    var bestSimulation = podSimulations.group[0];

                    //that.logs += "POD_0" + index + " weight : " + bestSimulation.weight;

                    // Calculate movement
                    pod.move(bestSimulation.moves[0], true);

                    //// Use BOOST 
                    if (loopIndex === 1 && index === 0) {
                        pod.thrust = "BOOST";
                    }

                    // Print movement
                    print(pod.destination.x + ' ' + pod.destination.y + ' ' + pod.thrust);
                }
            }

            // Log informations
            if (that.isDebug) {
                logInfos();
            }

            loopIndex++;
        }
    };

    return that;
})();

GAME.main.run();

var values = [  "3",
                "5",
                "12684 7084",
                "4073 4673",
                "13010 1927",
                "6564 7818",
                "7499 1384",
                "12549 7565 0 0 -1 1",
                "12819 6603 0 0 -1 1",
                "12280 8528 0 0 -1 1",
                "13088 5640 0 0 -1 1"];

var readline = function () {
    return values.shift();
}