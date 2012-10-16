/**
 * Module dependencies.
 */
var http = require('http');
var express = require('express');
var app = module.exports= express();
var nowjs = require("now");
var ct = require('./public/core.js');

// Configuration
app.configure(function() {
	app.set('port', process.env.PORT || 8080);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res) {
    res.render('index', {
        locals: {
            title: 'Capture Three'
        }
    });
});

app.get('/test', function(req, res) {
    res.render('test', {
        locals: {
            title: 'Express',
            names: ['php', 'C++', 'linux', 'windows']
        }
    });
});

var server = http.createServer(app).listen(app.get('port'), function() {
console.log('Express server listening on port ' + app.get('port'));
})

var everyone = require('now').initialize(server);

var game = new ct.captureThree();

everyone.now.movePiece = function(x,y) {
	var piece = new ct.piece(0,Math.floor(Math.random()*2));
	game.area[x][y] = piece;
	everyone.now.updateGame(piece,x,y);
}
