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
        degrees = degrees < 0 ? 360 + degrees : degrees;

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
var moves = [
    //new Int16Array([0, 0]),
    new Int16Array([0, -90]),
    new Int16Array([0, 90]),
    new Int16Array([100, 0]),
    new Int16Array([100, -90]),
    new Int16Array([100, 90]),
    new Int16Array([200, 0]),
    new Int16Array([200, -90]),
    new Int16Array([200, 90]),
];

/********************************** GENETIC ALGORITHM *************************************/
var simulationUnit = function (pod, moves) {
    return {
        pod: pod,
        moves: moves,
        weight: 0
    };
};

var simulationGroup = function (depth) {
    var that = {
        move: [],
        weight: 0
    };

    var availableMoves = [];

    that.run = function (pod) {
        that.move = [];
        that.weight = 0;

        //var checkpointA = GAME.main.checkpoints[pod.nextCheckPointId];
        //var checkpointB = pod.nextCheckPointId == GAME.main.checkpoints.length - 1 ?
        //    GAME.main.checkpoints[0] : GAME.main.checkpoints[pod.nextCheckPointId + 1];

        //var checkpointAngle = checkpointA.degreesTo(pod.position);
        //var angle = pod.angle - checkpointAngle;

        // Calculate all movements and find the selected simulation
        recursiveTree(pod, depth);
    };

    // Initialize Tree
    var recursiveTree = function (basePod, depth, initialMove) {
        if (depth) {
            moves.forEach(move => {
                // Clone pod
                var pod = basePod.clone();

                // Move pod
                pod.move(move[0], move[1]);

                // Check if move is interesting 
                var nextNextCheckPointId = pod.nextCheckPointId == GAME.main.checkpoints.length - 1 ? 0 : pod.nextCheckPointId + 1;
                var cp1Angle = GAME.main.checkpoints[pod.nextCheckPointId].degreesTo(pod.position);
                var cp2Angle = GAME.main.checkpoints[nextNextCheckPointId].degreesTo(pod.position);

                // Update pod next checkpoint if needed
                var delta = 18;
                if (pod.position.distance(GAME.main.checkpoints[pod.nextCheckPointId]) < GAME.checkpointRadius) {
                    pod.checkpointMultiplier++;
                    pod.nextCheckPointId = pod.nextCheckPointId == GAME.main.checkpoints.length - 1 ? 0 : pod.nextCheckPointId + 1;
                    delta = 90;
                }

                var angleCp1 = Math.abs(pod.angle - cp1Angle) <= 180 ? Math.abs(pod.angle - cp1Angle) : 360 - Math.abs(pod.angle - cp1Angle);
                var angleCp2 = Math.abs(pod.angle - cp2Angle) <= 180 ? Math.abs(pod.angle - cp2Angle) : 360 - Math.abs(pod.angle - cp2Angle);
                if (angleCp1 + angleCp2 > 180 + delta) {
                    return;
                }

                // Update weight if all moves has been calculated
                if (depth == 1) {
                    var weight = 100000 * pod.checkpointMultiplier - pod.position.distance(GAME.main.checkpoints[pod.nextCheckPointId]);

                    // Set the first move as 'best move' if the weight is higher
                    if (weight > that.weight) {
                        that.weight = weight;
                        that.move = initialMove;
                    }
                }

                // Go recursive !
                recursiveTree(pod, depth - 1, initialMove ? initialMove : move);
            });
        }
    }

    return that;
};

/********************************** GAME **************************************************/
var GAME = {
    speedCoefficient: 0.85,
    angleCoefficient: 0.2,
    radianCoefficient: Math.PI / 180,
    checkpointRadius: 550
};

GAME.Pod = function () {
    this.position = new Vector(0, 0);
    this.destination = new Vector(0, 0);
    this.speed = new Vector(0, 0);
    this.nextCheckPointId = 1;
    this.angle = 0;
    this.thrust = 0;
    this.checkpointMultiplier = 1;
    this.turn = 1;
};

GAME.Pod.prototype = {
    // Set the next movement of the pod
    move: function (thrust, angle, isReal) {
        // Update pod thrust
        this.thrust = thrust;

        // Calculate desired destination destination vector
        this.destination.x = this.position.x + Math.round(Math.cos((this.angle + angle) * GAME.radianCoefficient)) * 100;
        this.destination.y = this.position.y + Math.round(Math.sin((this.angle + angle) * GAME.radianCoefficient)) * 100;

        // Update pod angle
        this.angle += angle * GAME.angleCoefficient;
        this.angle = this.angle < 0 ? 360 + this.angle : this.angle % 360;

        // Calculate new speed
        this.speed.x += Math.cos((this.angle) * GAME.radianCoefficient) * this.thrust;
        this.speed.y += Math.sin((this.angle) * GAME.radianCoefficient) * this.thrust;

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
        clone.nextCheckPointId = this.nextCheckPointId;
        clone.checkpointMultiplier = this.checkpointMultiplier;

        return clone;
    },

    // Update pod infos
    update: function () {
        var line = readline();
        if (line) {
            // 0 : posX; 1 : posY; 2 : speedX; 3 : speedY; 4 : angle; 5 : nextCheckpointId
            var inputValues = line.split(' ').map(function (value) { return parseInt(value); });
            this.position = new Vector(inputValues[0], inputValues[1]);
            this.speed = new Vector(inputValues[2], inputValues[3]);
            this.angle = inputValues[4] === -1 ? GAME.main.checkpoints[this.nextCheckPointId].degreesTo(this.position) : inputValues[4];
            this.nextCheckPointId = inputValues[5];
        } else {
          
        }
    }
};

GAME.main = (function () {
    var that = {
        playerPods: [new GAME.Pod(), new GAME.Pod()], // new Array(2).fill().map(function(pod) { return new GAME.Pod(); }),
        opponentPods: [new GAME.Pod(), new GAME.Pod()], // new Array(2).fill().map(function(pod) { return new GAME.Pod(); }),
        checkpoints: [],
        loopIndex: 1
    };

    // Private variables
    var depth = 4;
    var simulations = simulationGroup(depth);
    var loopFunction;

    // Initialize game infos
    var initialize = function () {
        that.loopIndex = 1;
        // The number of laps to complete the race.
        var laps = parseInt(readline());
        // The number of checkpoints in the circuit.
        var checkpointCount = parseInt(readline());
        // Coordinates x and y of each checkpoints
        for (i = 0; i < checkpointCount; i++) {
            var checkpointCoordinates = readline().split(' ');
            that.checkpoints.push(new Vector(parseInt(checkpointCoordinates[0]), parseInt(checkpointCoordinates[1])));
        }
    };

    that.run = function () {
        // Read initialization inputs
        initialize();
        loopFunction = setInterval(gameLoop, 100);
    };

    var gameLoop = function () {

        // Update pod infos
        that.playerPods.forEach(function (pod) { pod.update(); });
        that.opponentPods.forEach(function (pod) { pod.update(); });

        // Start timer for one turn ( turn is 150ms max. )
        startTimer = new Date().getTime();

        // Move player's pod with genetic algorithm
        for (var index = 0; index < 1; index++) {//that.playerPods.length
            // Get current pod
            var pod = that.playerPods[index];

            // Run simulation
            simulations.run(pod);

            if (simulations.move.length == 0) {
                debugger;
                // Run simulation
                simulations.run(pod);
            }

            var test = pod.clone();

            // Calculate movement
            pod.move(simulations.move[0], simulations.move[1], true);

            if (isNaN(pod.angle)) {
                debugger;
            }

            //// Use boost 
            pod.thrust = that.loopIndex === 1 && index === 0 ? "BOOST" : pod.thrust;


            // Print movement
            print(pod.destination.x + ' ' + pod.destination.y + ' ' + pod.thrust);
            display(pod);

            // Update pod next checkpoint if needed
            if (pod.position.distance(GAME.main.checkpoints[pod.nextCheckPointId]) < GAME.checkpointRadius) {
                pod.nextCheckPointId = pod.nextCheckPointId == GAME.main.checkpoints.length - 1 ? 0 : pod.nextCheckPointId + 1;
                pod.turn = pod.nextCheckPointId == 1 ? pod.turn + 1 : pod.turn;
                if (pod.turn == 4) {
                    GAME.main.checkpoints = [];
                    pod.turn = 1;
                    clearInterval(loopFunction);
                    launchTest();
                }
            }
        }

        that.loopIndex++;
        endTimer = new Date().getTime();
        var time = endTimer - startTimer;
        printErr("Execution time " + time + "ms \n");
    }

    return that;
})();