var resources = { 'images':''};
var gameArea = new ct.captureThree();
var stage;
var image;

window.onload = function(){
            var sources = {
                tiles: "/captureThree.png"
            };
            loadImages(sources, initGame);
        };
        
function loadImages(sources, callback){
            var images = {};
            var loadedImages = 0;
            var numImages = 0;
            for (var src in sources) {
                numImages++;
            }
            for (var src in sources) {
                images[src] = new Image();
                images[src].onload = function(){
                    if (++loadedImages >= numImages) {
                        callback(images);
                    }
                };
                images[src].src = sources[src];
            }
        }
        
function initGame(images) {
    resources.images = images;
    
    stage = new Kinetic.Stage({
        container: "container",
        width: 650,
        height: 755
    });

    startGame(stage);
    now.updateGame = function(piece,x,y) {
    	gameArea.area[x][y] = piece;
    	
    	var empty = stage.get('#empty_' + x + '_' + y);
    	console.log(empty);
    	var bgLayer = empty[0].getLayer();
    	bgLayer.remove(empty[0]);
    	bgLayer.add(pieceShape(gameArea.area[x][y], x, y));
    	bgLayer.draw();    	
    }
}

function startGame(stage) {
    var boxLayer = new Kinetic.Layer();

    var messageLayer = new Kinetic.Layer();

    var box = new Kinetic.Rect({
        x: 535,
        y: 10,
        width: 100,
        height: 100,
        fill: "#00D2FF",
        stroke: "black",
        strokeWidth: 4,
        cornerRadius: 10,
        draggable: true
    });

    // write out drag and drop events
    box.on("dragstart", function() {
        writeMessage(messageLayer, "dragstart");
        //var centerx = box.x + ((box.width+100) /2);
        //var centery = box.y + ((box.height+100) /2);
    });
    box.on("dragend", function() {
        var centerx = this.getX() + (box.getWidth() / 2);
        var centery = this.getY() + (box.getHeight() / 2);
        var x = Math.floor(centerx / 105);
        var y = Math.floor(centery / 105) -1; //first row doesn't count
        this.setX(Math.floor(centerx / 105) * 105 + 10);
        this.setY(Math.floor(centery / 105) * 105 + 10);
        boxLayer.draw();
        writeMessage(messageLayer, "dragend " + x + ", " +y);
        now.movePiece(x,y);
    });

    boxLayer.add(box);

    stage.add(gameBackground(gameArea));
    stage.add(messageLayer);
    stage.add(boxLayer);
}


function gameBackground(gameArea) {
    var bgLayer = new Kinetic.Layer();
    bgLayer.setY(105);
    for (var x = 0; x < 6; x++) {
        for (var y = 0; y < 6; y++) {
            var bg;
            if (gameArea.area[x][y]) {
                bg = pieceShape(gameArea.area[x][y], x, y);
            }
            else {
                bg = new Kinetic.Rect({
                    x: 10 + (105 * x),
                    y: 10 + (105 * y),
                    width: 100,
                    height: 100,
                    fill: "#ffffff",
                    stroke: "black",
                    cornerRadius: 10,
                    alpha: 0.2,
                    id: "empty_" + x + "_" + y
                });
            }
           
            bgLayer.add(bg);
        }
    }
    return bgLayer;
}

function pieceShape(piece, x, y) {
    image = new Kinetic.Image({
        x: 10 + (105 * x),
        y: 10 + (105 * y),
        width: 105,
        height: 105,
        image: resources.images.tiles,
        crop: {
            x: piece.owner * 105,
            y: piece.value * 105,
            width: 105,
            height: 105
        }
    });
    return image;
}

function writeMessage(messageLayer, message) {
    var context = messageLayer.getContext();
    messageLayer.clear();
    context.font = "18pt Calibri";
    context.fillStyle = "black";
    context.fillText(message, 10, 25);
}