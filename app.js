/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

// Configuration
app.configure(function() {
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
            title: 'Express'
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

// Only listen on $ node app.js
if (!module.parent) {
    app.listen(process.env.C9_PORT);
    console.log("Express server listening on port %d", app.address().port);
}

io.sockets.on('connection', function(socket) {
    socket.emit('news', {
        hello: 'world'
    });
    socket.on('my other event', function(data) {
        console.log(data);
    });
});


function captureThree() {
    this.maxx = 6;
    this.maxy = 6;
    this.area = new Array(this.maxx);
    for (var i=0;i<this.maxx;i++) {
        this.area[i] = new Array(this.maxy);
    }
    
}