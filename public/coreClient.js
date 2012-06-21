function preload(stage) {
     var imageObj = new Image();
        imageObj.src = "/captureThree.png";
        imageObj.onload = startGame(stage);
}

function initGame() {
    
    var stage = new Kinetic.Stage({
          container: "container",
          width: 650,
          height: 755
        });
        
        preload(stage);
}

function startGame(stage) {
        var gameArea = new captureThree();
        var boxLayer = new Kinetic.Layer();
        //boxLayer.setY(105);
        var messageLayer = new Kinetic.Layer();
        var rectX = stage.getWidth() / 2 - 50;
        var rectY = stage.getHeight() / 2 - 25;

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
          writeMessage(messageLayer, "dragend");
          var centerx = this.getX() + (box.getWidth() /2);
          var centery = this.getY() + (box.getHeight() /2);
          this.setX(Math.floor(centerx/105)*105 +10 );
          this.setY(Math.floor(centery/105)*105 +10 );
          boxLayer.draw();
        });
        
        boxLayer.add(box);
        
        stage.add(gameBackground(gameArea));
        stage.add(messageLayer);
        stage.add(boxLayer);
      }
      

function gameBackground(gameArea) {
     var bgLayer = new Kinetic.Layer();
     bgLayer.setY(105);
    for (var x=0;x<6;x++) {
        for (var y=0;y<6;y++) {
            var bg;
            if (gameArea.area[x][y]) {
                bg = pieceShape(gameArea.area[x][y],x,y);
                }
                else { 
                    bg= new Kinetic.Rect({
                    x:10 + (105*x),
                    y:10 + (105*y),
                    width:100,
                    height:100,
                    fill: "#ffffff",
                    stroke: "black",
                    cornerRadius: 10,
                    alpha: 0.2,
                    id: "empty_"+x+"_"+y
                });
                }
            bg.on("mouseover", function() {
                this.setAlpha(1);
                bgLayer.draw();
                });
            bg.on("mouseout", function() {
                this.setAlpha(0.2);
                bgLayer.draw();
                });
            bgLayer.add(bg);
        }
    }
    return bgLayer;
}

function pieceShape(piece, x, y) {
     var imageObj = new Image();
        imageObj.src = "/captureThree.png";
          var image = new Kinetic.Image({
                x:10 + (105*x),
                y:10 + (105*y),
                width:105, height:105,
                image: imageObj,
                crop: {x:piece.owner*105, y:piece.value*105, width:105, height:105}
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