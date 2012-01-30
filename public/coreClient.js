var gameCanvas = null;

function initGame() {
    gameCanvas = jcotton.canvas('ctGame');
   gameCanvas.add(
       jcotton.rect(125, 125, 50, 50)
       );
}