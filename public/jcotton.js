//jcotton.core.js
jcotton = { 
    canvases: [],
	animationImages: [],
	animationImagesLoaded: [],
	
	setFrameRate: function(fps) {
		jcotton.config.timeBetweenFrames = 1000 / fps;
	}
};


//jcotton.config.js
jcotton.config = {
	canDrawText: 
		document.createElement('canvas').getContext &&
		typeof document.createElement('canvas').getContext('2d').fillText == 'function' && 
		!(navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPad/i)),
	hasTouches: (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPad/i)),
	timeBetweenFrames: 1000 / 24
};

//jcotton.animation.js
jcotton.animation = function(transform, time, ease, callback) {
	this._drawable = null;
	
	if (transform.scale) {
		transform.xscale = transform.yscale = transform.scale;
	}
	if (transform['+scale']) {
		transform['+xscale'] = transform['+yscale'] = transform['+scale'];
	}
	this._transform = transform;
	this._totalTime = time;
	this._ease = isNaN(ease) ? 0 : ease;
	this._startTime = 0;
	this._frameCount = 0;
	this._isPlaying = true;
	this._pauseTime = 0;
	this._callback = callback;
	
	this.setDrawable = function(drawable) {
		this._drawable = drawable;
		this.reset();
	};
	
	this.reset = function() {
		for(var key in this._transform) {
			if (this._transform.hasOwnProperty(key)) {
				if (key[0] == "+") {
					this._transform[key.substring(1)] = this._drawable["_"+key.substring(1)] + this._transform[key];
				}
			}
		}
		this._startTime = jcotton.helpers.getCurrentTimestamp();
		this._frameCount = 0;
	};
	
	this.step = function() {
		if (this._isPlaying) {
			this._frameCount += 1;
			var timePassed = (jcotton.helpers.getCurrentTimestamp() - this._startTime);
			var currentFrameLength = timePassed / this._frameCount;
			var framesLeft = Math.floor((this._totalTime - timePassed) / currentFrameLength);
			var key;
			if (framesLeft < 1) {
				// make sure that the ending values are set
				for(key in this._transform) {
					if (this._transform.hasOwnProperty(key)) {
						this._drawable["_"+key] = this._transform[key];
					}
				}
				if (this._callback) {
					jcotton.addCallback(this._callback);
				}
				return true;
			}
			for(key in this._transform) {
				if (this._transform.hasOwnProperty(key)) {
					this._drawable["_"+key] += 
						(this._transform[key] - this._drawable["_"+key]) / framesLeft * (1 - ((this._totalTime - timePassed) / this._totalTime) * this._ease);
				}
			}
			return false;
		}
	};
	
	this.pause = function() {
		this._pauseTime = (jcotton.helpers.getCurrentTimestamp() - this._startTime);
		this._isPlaying = false;
	};
	
	this.play = function() {
		this._startTime = (jcotton.helpers.getCurrentTimestamp() - this._pauseTime);
		this._isPlaying = true;
	};
	
	this.playPause = function() {
		if (this._isPlaying) {
			this.pause();
		} else {
			this.play();
		}
	};
	
	this.dispose = function() {
		delete this._transform;
	};
};

jcotton.animationLoop = function(iterations) {
	this._drawable = null;
	
	// create animations
	this.animations = [];
	this._iterations = iterations === undefined ? 0 : iterations;
	this._currentAnimation = 0;
	
	this.setDrawable = function(drawable) {
		this._drawable = drawable;
		for(var i = 0; i < this.animations.length; i++) {
			this.animations[i].setDrawable(drawable);	
		}
	};
	
	this.step = function() {
		// run the current animation step, if it is done move to the next animation
		if (this.animations[this._currentAnimation].step()) {
			this._currentAnimation += 1;
			
			// if the animation was the last check to see if to end the iterations or start them over
			if (this._currentAnimation >= this.animations.length) {
				if (iterations > 0) {
					this._iterations -= 1;
					if (this._iterations === 0) {
						return false;	
					}
				}
				this._currentAnimation = 0;
			}
			
			this.animations[this._currentAnimation].timeLeft = this.animations[this._currentAnimation].totalTime;
			this.animations[this._currentAnimation].reset();
			
		}
	};
	
	this.pause = function() { this.animations[0].pause(); };
	this.play = function() { this.animations[0].play(); };
	this.playPause = function() { this.animations[0].playPause(); };
	
	this.dispose = function() {
		for(var i = 0; i < this.animations.length; i++) {
			this.animations[i].dispose();
			delete this.animations[i];
		}
		delete this.animations;
	};
};


//jcotton.arc.js
jcotton._arc = function(x, y, radius, startAngle, endAngle, counterClockwise) {
	this._x = x;
	this._y = y;
	this._radius = radius;
	this._startAngle = startAngle * (Math.PI / 180);
	this._endAngle = endAngle * (Math.PI / 180);
	this._counterClockwise = counterClockwise === undefined ? false : counterClockwise;
	
	this._drawInternal = function(context) {
		context.beginPath();
		this._setupPath(context);
		context.arc(this._x, this._y, this._radius, this._startAngle, this._endAngle, this._counterClockwise);
		context.fill();
		context.stroke();
	};
	
	this._xmin = function() {
		return this._x - this._radius;
	};
	this._xmax = function() {
		return this._x + this._radius;
	};
	this._ymin = function() {
		return this._y - this._radius;
	};
	this._ymax = function() {
		return this._y + this._radius;
	};
};

jcotton.arc = function(x, y, radius, startAngle, endAngle, counterClockwise) {
	return jcotton.path(
		new jcotton._arc(x, y, radius, startAngle, endAngle, counterClockwise)
	);
};

//jcotton.callbacks.js
jcotton._queuedCallbacks = [];

jcotton.addCallback = function(callback) {
	jcotton._queuedCallbacks.push(callback);
};

jcotton.runCallbacks = function() {
	while(jcotton._queuedCallbacks.length > 0) {
		var callback = jcotton._queuedCallbacks.pop();
		callback();
	}
};

//jcotton.canvas.js
jcotton._canvas = function(id) {
	jcotton.canvases[id] = this;
	this._element = document.getElementById(id);
	this._mouseEvents = [];
	this.xmouse = 0;
	this.ymouse = 0;
	this._drawables = [];
	
	if (!this._element || this._element.tagName.toUpperCase() != "CANVAS") {
		alert("Error: no canvas with id " + id);
		return;
	}
	
	this._context = this._element.getContext('2d');
	CanvasTextFunctions.enable(this._context);
	
	this.add = function(drawable) {
		drawable._setContext(this._context);
		this._drawables.push(drawable);
		this.refreshSort();
		return this;
	};
	
	this.remove = function(drawable) {
		for(var i = 0; i < this._drawables.length; i++) {
			if (this._drawables[i] == drawable) {
				this._drawables.splice(i, 1);
				return this;
			}
		}
		return this;
	};
	
	this.refreshSort = function() {
		this._drawables.sort(function(a, b) {
			return a.depth() - b.depth();
		});
	};
	
	this.width = function() {
		return this._element.width;	
	};
	
	this.height = function() {
		return this._element.height;	
	};
	
	this.draw = function() {
		this._onEnterFrame();
		
		this._context.clearRect(0, 0, this._element.width, this._element.height);
		for(var i = 0; i < this._drawables.length; i++) {
			this._drawables[i].draw(this._context);
		}
		jcotton.runCallbacks();
		
		
	};
	
	this._getMousePosition = function(event) {
		var offset = jcotton.helpers.getOffset(this._element);
		return [event.clientX - offset[0], event.clientY - offset[1]];
	};

	this._onMouseEvent = function(e, eventName) {
		var mousePosition = this._getMousePosition(e);
		this.xmouse = mousePosition[0];
		this.ymouse = mousePosition[1];
		if (mousePosition[0] >= 0 && mousePosition[0] <= this._element.width &&
			mousePosition[1] >= 0 && mousePosition[1] <= this._element.height) {
			if (this._mouseEvents[eventName]) {
				this._mouseEvents[eventName](mousePosition[0], mousePosition[1]);	
			}
			
			for(var i = 0; i < this._drawables.length; i++) {
				this._drawables[i].doMouseEvent(eventName, mousePosition[0], mousePosition[1]);
			}
		}
	};
	
	this._setMouseEvent = function(eventName, callback) {
		this._mouseEvents[eventName] = callback;
	};
	
	this._onEnterFrame = function() { };
	this._onMouseDown = function(e) { jcotton.canvases[id]._onMouseEvent(e, "down"); };
	this._onMouseUp = function(e) { jcotton.canvases[id]._onMouseEvent(e, "up"); };
	this._onMouseMove = function(e) { jcotton.canvases[id]._onMouseEvent(e, "move"); };

	jcotton.helpers.addWindowEvent("mousedown", jcotton.canvases[id]._onMouseDown);
	jcotton.helpers.addWindowEvent("mouseup", jcotton.canvases[id]._onMouseUp);
	jcotton.helpers.addWindowEvent("mousemove", jcotton.canvases[id]._onMouseMove);
	
	this.onEnterFrame = function(callback) {
		this._onEnterFrame = callback;
		return this;
	};
	
	this.onMouseDown = function(callback) {
		this._setMouseEvent("down", callback);
		return this;
	};
	
	this.onMouseUp = function(callback) {
		this._setMouseEvent("up", callback);
		return this;
	};
	
	this.onMouseMove = function(callback) {
		this._setMouseEvent("move", callback);
		return this;
	};
	
	this.clear = function() {
		var i;
		for(i = 0; i < this._mouseEvents; i++) {
			delete this._mouseEvents[i];
		}
		delete this._mouseEvents;
		this._mouseEvents = [];
		
		for(i = 0; i < this._drawables; i++) {
			this._drawables[i].dispose();
			delete this._drawables[i];
		}
		delete this._drawables;
		this._drawables = [];
	};
	
	this.dispose = function() {
		this.clear();
		delete this._mouseEvents;
		delete this._drawables;
	};
	
	
	setInterval('jcotton.canvases["'+this._element.id+'"].draw()', jcotton.config.timeBetweenFrames);
};

jcotton.canvas = function(id) {
	if (jcotton.canvases[id]) { return jcotton.canvases[id]; }
	return new jcotton._canvas(id);
};


//
// This code is released to the public domain by Jim Studt, 2007.
// He may keep some sort of up to date copy at http://www.federated.com/~jim/canvastext/
//
var CanvasTextFunctions = { };

CanvasTextFunctions.letters = {
    ' ': { width: 16, points: [] },
    '!': { width: 10, points: [[5,21],[5,7],[-1,-1],[5,2],[4,1],[5,0],[6,1],[5,2]] },
    '"': { width: 16, points: [[4,21],[4,14],[-1,-1],[12,21],[12,14]] },
    '#': { width: 21, points: [[11,25],[4,-7],[-1,-1],[17,25],[10,-7],[-1,-1],[4,12],[18,12],[-1,-1],[3,6],[17,6]] },
    '$': { width: 20, points: [[8,25],[8,-4],[-1,-1],[12,25],[12,-4],[-1,-1],[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
    '%': { width: 24, points: [[21,21],[3,0],[-1,-1],[8,21],[10,19],[10,17],[9,15],[7,14],[5,14],[3,16],[3,18],[4,20],[6,21],[8,21],[10,20],[13,19],[16,19],[19,20],[21,21],[-1,-1],[17,7],[15,6],[14,4],[14,2],[16,0],[18,0],[20,1],[21,3],[21,5],[19,7],[17,7]] },
    '&': { width: 26, points: [[23,12],[23,13],[22,14],[21,14],[20,13],[19,11],[17,6],[15,3],[13,1],[11,0],[7,0],[5,1],[4,2],[3,4],[3,6],[4,8],[5,9],[12,13],[13,14],[14,16],[14,18],[13,20],[11,21],[9,20],[8,18],[8,16],[9,13],[11,10],[16,3],[18,1],[20,0],[22,0],[23,1],[23,2]] },
    '\'': { width: 10, points: [[5,19],[4,20],[5,21],[6,20],[6,18],[5,16],[4,15]] },
    '(': { width: 14, points: [[11,25],[9,23],[7,20],[5,16],[4,11],[4,7],[5,2],[7,-2],[9,-5],[11,-7]] },
    ')': { width: 14, points: [[3,25],[5,23],[7,20],[9,16],[10,11],[10,7],[9,2],[7,-2],[5,-5],[3,-7]] },
    '*': { width: 16, points: [[8,21],[8,9],[-1,-1],[3,18],[13,12],[-1,-1],[13,18],[3,12]] },
    '+': { width: 26, points: [[13,18],[13,0],[-1,-1],[4,9],[22,9]] },
    ',': { width: 10, points: [[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
    '-': { width: 26, points: [[4,9],[22,9]] },
    '.': { width: 10, points: [[5,2],[4,1],[5,0],[6,1],[5,2]] },
    '/': { width: 22, points: [[20,25],[2,-7]] },
    '0': { width: 20, points: [[9,21],[6,20],[4,17],[3,12],[3,9],[4,4],[6,1],[9,0],[11,0],[14,1],[16,4],[17,9],[17,12],[16,17],[14,20],[11,21],[9,21]] },
    '1': { width: 20, points: [[6,17],[8,18],[11,21],[11,0]] },
    '2': { width: 20, points: [[4,16],[4,17],[5,19],[6,20],[8,21],[12,21],[14,20],[15,19],[16,17],[16,15],[15,13],[13,10],[3,0],[17,0]] },
    '3': { width: 20, points: [[5,21],[16,21],[10,13],[13,13],[15,12],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
    '4': { width: 20, points: [[13,21],[3,7],[18,7],[-1,-1],[13,21],[13,0]] },
    '5': { width: 20, points: [[15,21],[5,21],[4,12],[5,13],[8,14],[11,14],[14,13],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
    '6': { width: 20, points: [[16,18],[15,20],[12,21],[10,21],[7,20],[5,17],[4,12],[4,7],[5,3],[7,1],[10,0],[11,0],[14,1],[16,3],[17,6],[17,7],[16,10],[14,12],[11,13],[10,13],[7,12],[5,10],[4,7]] },
    '7': { width: 20, points: [[17,21],[7,0],[-1,-1],[3,21],[17,21]] },
    '8': { width: 20, points: [[8,21],[5,20],[4,18],[4,16],[5,14],[7,13],[11,12],[14,11],[16,9],[17,7],[17,4],[16,2],[15,1],[12,0],[8,0],[5,1],[4,2],[3,4],[3,7],[4,9],[6,11],[9,12],[13,13],[15,14],[16,16],[16,18],[15,20],[12,21],[8,21]] },
    '9': { width: 20, points: [[16,14],[15,11],[13,9],[10,8],[9,8],[6,9],[4,11],[3,14],[3,15],[4,18],[6,20],[9,21],[10,21],[13,20],[15,18],[16,14],[16,9],[15,4],[13,1],[10,0],[8,0],[5,1],[4,3]] },
    ':': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],[-1,-1],[5,2],[4,1],[5,0],[6,1],[5,2]] },
    ',': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],[-1,-1],[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
    '<': { width: 24, points: [[20,18],[4,9],[20,0]] },
    '=': { width: 26, points: [[4,12],[22,12],[-1,-1],[4,6],[22,6]] },
    '>': { width: 24, points: [[4,18],[20,9],[4,0]] },
    '?': { width: 18, points: [[3,16],[3,17],[4,19],[5,20],[7,21],[11,21],[13,20],[14,19],[15,17],[15,15],[14,13],[13,12],[9,10],[9,7],[-1,-1],[9,2],[8,1],[9,0],[10,1],[9,2]] },
    '@': { width: 27, points: [[18,13],[17,15],[15,16],[12,16],[10,15],[9,14],[8,11],[8,8],[9,6],[11,5],[14,5],[16,6],[17,8],[-1,-1],[12,16],[10,14],[9,11],[9,8],[10,6],[11,5],[-1,-1],[18,16],[17,8],[17,6],[19,5],[21,5],[23,7],[24,10],[24,12],[23,15],[22,17],[20,19],[18,20],[15,21],[12,21],[9,20],[7,19],[5,17],[4,15],[3,12],[3,9],[4,6],[5,4],[7,2],[9,1],[12,0],[15,0],[18,1],[20,2],[21,3],[-1,-1],[19,16],[18,8],[18,6],[19,5]] },
    'A': { width: 18, points: [[9,21],[1,0],[-1,-1],[9,21],[17,0],[-1,-1],[4,7],[14,7]] },
    'B': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[-1,-1],[4,11],[13,11],[16,10],[17,9],[18,7],[18,4],[17,2],[16,1],[13,0],[4,0]] },
    'C': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5]] },
    'D': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[11,21],[14,20],[16,18],[17,16],[18,13],[18,8],[17,5],[16,3],[14,1],[11,0],[4,0]] },
    'E': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,21],[17,21],[-1,-1],[4,11],[12,11],[-1,-1],[4,0],[17,0]] },
    'F': { width: 18, points: [[4,21],[4,0],[-1,-1],[4,21],[17,21],[-1,-1],[4,11],[12,11]] },
    'G': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[18,8],[-1,-1],[13,8],[18,8]] },
    'H': { width: 22, points: [[4,21],[4,0],[-1,-1],[18,21],[18,0],[-1,-1],[4,11],[18,11]] },
    'I': { width: 8, points: [[4,21],[4,0]] },
    'J': { width: 16, points: [[12,21],[12,5],[11,2],[10,1],[8,0],[6,0],[4,1],[3,2],[2,5],[2,7]] },
    'K': { width: 21, points: [[4,21],[4,0],[-1,-1],[18,21],[4,7],[-1,-1],[9,12],[18,0]] },
    'L': { width: 17, points: [[4,21],[4,0],[-1,-1],[4,0],[16,0]] },
    'M': { width: 24, points: [[4,21],[4,0],[-1,-1],[4,21],[12,0],[-1,-1],[20,21],[12,0],[-1,-1],[20,21],[20,0]] },
    'N': { width: 22, points: [[4,21],[4,0],[-1,-1],[4,21],[18,0],[-1,-1],[18,21],[18,0]] },
    'O': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21]] },
    'P': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,14],[17,12],[16,11],[13,10],[4,10]] },
    'Q': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21],[-1,-1],[12,4],[18,-2]] },
    'R': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[4,11],[-1,-1],[11,11],[18,0]] },
    'S': { width: 20, points: [[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
    'T': { width: 16, points: [[8,21],[8,0],[-1,-1],[1,21],[15,21]] },
    'U': { width: 22, points: [[4,21],[4,6],[5,3],[7,1],[10,0],[12,0],[15,1],[17,3],[18,6],[18,21]] },
    'V': { width: 18, points: [[1,21],[9,0],[-1,-1],[17,21],[9,0]] },
    'W': { width: 24, points: [[2,21],[7,0],[-1,-1],[12,21],[7,0],[-1,-1],[12,21],[17,0],[-1,-1],[22,21],[17,0]] },
    'X': { width: 20, points: [[3,21],[17,0],[-1,-1],[17,21],[3,0]] },
    'Y': { width: 18, points: [[1,21],[9,11],[9,0],[-1,-1],[17,21],[9,11]] },
    'Z': { width: 20, points: [[17,21],[3,0],[-1,-1],[3,21],[17,21],[-1,-1],[3,0],[17,0]] },
    '[': { width: 14, points: [[4,25],[4,-7],[-1,-1],[5,25],[5,-7],[-1,-1],[4,25],[11,25],[-1,-1],[4,-7],[11,-7]] },
    '\\': { width: 14, points: [[0,21],[14,-3]] },
    ']': { width: 14, points: [[9,25],[9,-7],[-1,-1],[10,25],[10,-7],[-1,-1],[3,25],[10,25],[-1,-1],[3,-7],[10,-7]] },
    '^': { width: 16, points: [[6,15],[8,18],[10,15],[-1,-1],[3,12],[8,17],[13,12],[-1,-1],[8,17],[8,0]] },
    '_': { width: 16, points: [[0,-2],[16,-2]] },
    '`': { width: 10, points: [[6,21],[5,20],[4,18],[4,16],[5,15],[6,16],[5,17]] },
    'a': { width: 19, points: [[15,14],[15,0],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'b': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
    'c': { width: 18, points: [[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'd': { width: 19, points: [[15,21],[15,0],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'e': { width: 18, points: [[3,8],[15,8],[15,10],[14,12],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'f': { width: 12, points: [[10,21],[8,21],[6,20],[5,17],[5,0],[-1,-1],[2,14],[9,14]] },
    'g': { width: 19, points: [[15,14],[15,-2],[14,-5],[13,-6],[11,-7],[8,-7],[6,-6],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'h': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
    'i': { width: 8, points: [[3,21],[4,20],[5,21],[4,22],[3,21],[-1,-1],[4,14],[4,0]] },
    'j': { width: 10, points: [[5,21],[6,20],[7,21],[6,22],[5,21],[-1,-1],[6,14],[6,-3],[5,-6],[3,-7],[1,-7]] },
    'k': { width: 17, points: [[4,21],[4,0],[-1,-1],[14,14],[4,4],[-1,-1],[8,8],[15,0]] },
    'l': { width: 8, points: [[4,21],[4,0]] },
    'm': { width: 30, points: [[4,14],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0],[-1,-1],[15,10],[18,13],[20,14],[23,14],[25,13],[26,10],[26,0]] },
    'n': { width: 19, points: [[4,14],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
    'o': { width: 19, points: [[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3],[16,6],[16,8],[15,11],[13,13],[11,14],[8,14]] },
    'p': { width: 19, points: [[4,14],[4,-7],[-1,-1],[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
    'q': { width: 19, points: [[15,14],[15,-7],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'r': { width: 13, points: [[4,14],[4,0],[-1,-1],[4,8],[5,11],[7,13],[9,14],[12,14]] },
    's': { width: 17, points: [[14,11],[13,13],[10,14],[7,14],[4,13],[3,11],[4,9],[6,8],[11,7],[13,6],[14,4],[14,3],[13,1],[10,0],[7,0],[4,1],[3,3]] },
    't': { width: 12, points: [[5,21],[5,4],[6,1],[8,0],[10,0],[-1,-1],[2,14],[9,14]] },
    'u': { width: 19, points: [[4,14],[4,4],[5,1],[7,0],[10,0],[12,1],[15,4],[-1,-1],[15,14],[15,0]] },
    'v': { width: 16, points: [[2,14],[8,0],[-1,-1],[14,14],[8,0]] },
    'w': { width: 22, points: [[3,14],[7,0],[-1,-1],[11,14],[7,0],[-1,-1],[11,14],[15,0],[-1,-1],[19,14],[15,0]] },
    'x': { width: 17, points: [[3,14],[14,0],[-1,-1],[14,14],[3,0]] },
    'y': { width: 16, points: [[2,14],[8,0],[-1,-1],[14,14],[8,0],[6,-4],[4,-6],[2,-7],[1,-7]] },
    'z': { width: 17, points: [[14,14],[3,0],[-1,-1],[3,14],[14,14],[-1,-1],[3,0],[14,0]] },
    '{': { width: 14, points: [[9,25],[7,24],[6,23],[5,21],[5,19],[6,17],[7,16],[8,14],[8,12],[6,10],[-1,-1],[7,24],[6,22],[6,20],[7,18],[8,17],[9,15],[9,13],[8,11],[4,9],[8,7],[9,5],[9,3],[8,1],[7,0],[6,-2],[6,-4],[7,-6],[-1,-1],[6,8],[8,6],[8,4],[7,2],[6,1],[5,-1],[5,-3],[6,-5],[7,-6],[9,-7]] },
    '|': { width: 8, points: [[4,25],[4,-7]] },
    '}': { width: 14, points: [[5,25],[7,24],[8,23],[9,21],[9,19],[8,17],[7,16],[6,14],[6,12],[8,10],[-1,-1],[7,24],[8,22],[8,20],[7,18],[6,17],[5,15],[5,13],[6,11],[10,9],[6,7],[5,5],[5,3],[6,1],[7,0],[8,-2],[8,-4],[7,-6],[-1,-1],[8,8],[6,6],[6,4],[7,2],[8,1],[9,-1],[9,-3],[8,-5],[7,-6],[5,-7]] },
    '~': { width: 24, points: [[3,6],[3,8],[4,11],[6,12],[8,12],[10,11],[14,8],[16,7],[18,7],[20,8],[21,10],[-1,-1],[3,8],[4,10],[6,11],[8,11],[10,10],[14,7],[16,6],[18,6],[20,7],[21,10],[21,12]] }
};

CanvasTextFunctions.letter = function (ch)
{
    return CanvasTextFunctions.letters[ch];
}

CanvasTextFunctions.ascent = function( font, size)
{
    return size;
}

CanvasTextFunctions.descent = function( font, size)
{
    return 7.0*size/25.0;
}

CanvasTextFunctions.measure = function( font, size, str)
{
    var total = 0;
    var len = str.length;

    for (var i = 0; i < len; i++) {
	var c = CanvasTextFunctions.letter( str.charAt(i));
	if ( c) total += c.width * size / 25.0;
    }
    return total;
}

CanvasTextFunctions.draw = function(ctx,font,size,x,y,str)
{
    var total = 0;
    var len = str.length;
    var mag = size / 25.0;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 2.0 * mag;

    for (var i = 0; i < len; i++) {
	var c = CanvasTextFunctions.letter( str.charAt(i));
	if ( !c) continue;

	ctx.beginPath();

	var penUp = 1;
	var needStroke = 0;
	for ( j = 0; j < c.points.length; j++) {
	    var a = c.points[j];
	    if ( a[0] == -1 && a[1] == -1) {
		penUp = 1;
		continue;
	    }
	    if ( penUp) {
		ctx.moveTo( x + a[0]*mag, y - a[1]*mag);
		penUp = false;
	    } else {
		ctx.lineTo( x + a[0]*mag, y - a[1]*mag);
	    }
	}
	ctx.stroke();
	x += c.width*mag;
    }
    ctx.restore();
    return total;
}

CanvasTextFunctions.enable = function( ctx)
{
    ctx.fakeDrawText = function(font,size,x,y,text) { return CanvasTextFunctions.draw( ctx, font,size,x,y,text); };
    ctx.fakeMeasureText = function(font,size,text) { return CanvasTextFunctions.measure( font,size,text); };
    ctx.fontAscent = function(font,size) { return CanvasTextFunctions.ascent(font,size); }
    ctx.fontDescent = function(font,size) { return CanvasTextFunctions.descent(font,size); }

    ctx.drawTextRight = function(font,size,x,y,text) { 
	var w = CanvasTextFunctions.measure(font,size,text);
	return CanvasTextFunctions.draw( ctx, font,size,x-w,y,text); 
    };
    ctx.drawTextCenter = function(font,size,x,y,text) { 
	var w = CanvasTextFunctions.measure(font,size,text);
	return CanvasTextFunctions.draw( ctx, font,size,x-w/2,y,text); 
    };
}



//jcotton.circle.js
jcotton.circle = function(x, y, radius) {
	return jcotton.arc(x, y, radius, 0, 360);
};

//jcotton.color.js
jcotton.color = function(red, green, blue, alpha) {
	this.red = red;
	this.green = green;
	this.blue = blue;
	this.alpha = (alpha === undefined) ? 1 : alpha;
	this.getStyle = function() {
		return "rgba("+this.red+","+this.green+","+this.blue+","+this.alpha+")";
	};
	
	this.isVisible = function() {
		return this.alpha > 0;	
	};
};


//jcotton.drawable.js
jcotton.drawable = function(child) {
	child._context = null;
	child._xposition = 0;
	child._yposition = 0;
	child._origin = {x: 0, y: 0};
	child._xscale = 1;
	child._yscale = 1;
	child._rotation = 0;
	child._opacity = 1;
	child._depth = 0;
	child._animations = [];
	child._mouseEvents = {};
	child._isOver = false;
	child._buildingLoop = null;
	child._disposed = false;
	
	child.setProperty = function(propertyName, newValue) {
		if (
			propertyName == "xposition" ||
			propertyName == "yposition" ||
			propertyName == "scale" ||
			propertyName == "rotation" ||
			propertyName == "opacity") {
			this["_" + propertyName] = newValue;	
		}
	};
	
	if (!child._setContext) {
		child._setContext = function(context) {
			this._context = context;
		};
	}
	
	child._animate = function() {
		if (this._animations && this._animations.length) {
			if (this._animations[0].step()) {
				this._animations[0].dispose();
				delete this._animations[0];
				this._animations.shift();
				if (this._animations.length) {
					this._animations[0].reset();
				}
			}
		}
	};
	
	child._beginDraw = function(context) {
		context.save();
		context.translate(this._xposition, this._yposition);
		context.rotate(this._rotation / (180 / Math.PI));
		context.scale(this._xscale, this._yscale);
		context.translate(-this._origin.x, -this._origin.y);
		context.globalAlpha *= this._opacity < 0 ? 0 : this._opacity;
	};
	
	child._endDraw = function(context) {
		context.restore();
	};
	
	child.draw = function(context, drawInternalObject) {
		this._animate();
		this._beginDraw(context);
		this._drawInternal(context);
		this._endDraw(context);
	};
	
	child._addAnimation = function(animation) {
		this._animations.push(animation);
		animation.setDrawable(this);
	};
	
	child.pause = function() { if (this._animations.length) { this._animations[0].pause(); } };
	child.play = function() { if (this._animations.length) { this._animations[0].play(); } };
	child.playPause = function() { if (this._animations.length) { this._animations[0].playPause(); } };
	
	child.position = function(x, y) {
		if (x === undefined) {
			return {x: this._xposition, y: this._yposition};
		} else {
			this._xposition = x;
			this._yposition = y;
			return this;
		}
	};
	
	child.origin = function(x, y) {
		if (x === undefined) {
			return this._origin;
		} else {
			this._origin.x = x;
			this._origin.y = y;
			return this;
		}
	};
	
	child.rotation = function(rotation) {
		if (rotation === undefined) {
			return this._rotation;
		} else {
			this._rotation = rotation;
			return this;
		}
	};
	
	child.scale = function(x, y) {
		if (x === undefined) {
			return {x: this._xscale, y: this._yscale};
		} else {
			if (y === undefined) {
				y = x;
			}
			this._xscale = x;
			this._yscale = y;
			return this;
		}
	};
	
	child.opacity = function(opacity) {
		if (opacity === undefined) {
			return this._opacity;
		} else {
			this._opacity = opacity;
			return this;
		}
	};
	
	child.depth = function(depth) {
		if (depth === undefined) {
			return this._depth;
		} else {
			this._depth = depth;
			return this;
		}
	};
	
	child.animate = function(transform, time, ease, callback) { 
		if (this._buildingLoop) {
			this._buildingLoop.animations.push(
				new jcotton.animation(transform, time, ease, callback)
			);
		} else {
			this._addAnimation(
				new jcotton.animation(transform, time, ease, callback)
			);
		}
		return this;
	};
	
	child.beginLoop = function(iterations) {
		this._buildingLoop = new jcotton.animationLoop([], iterations);
		return this;
	};
	
	child.endLoop = function() {
		this._addAnimation(this._buildingLoop);
		this._buildingLoop = null;
		return this;
	};
	
	child.onMouseOver = function(event) {
		this._mouseEvents.over = event;
		return this;
	};
	
	child.onMouseOut = function(event) {
		this._mouseEvents.out = event;
		return this;
	};
	
	child.onMouseDown = function(event) {
		this._mouseEvents.down = event;
		return this;
	};
	
	child.onMouseUp = function(event) {
		this._mouseEvents.up = event;
		return this;
	};
	
	child.hitTest = function(x, y) {
		return (x >= this._xmin() + this._xposition - this._origin.x) && 
			(x <= this._xmax() + this._xposition - this._origin.x) && 
			(y >= this._ymin() + this._yposition - this._origin.y) && 
			(y <= this._ymax() + this._yposition - this._origin.y);
	};
	
	child.doMouseEvent = function(eventName, x, y) {
		if (eventName == "move" && (this._mouseEvents.out || this._mouseEvents.over)) {
			if (this._isOver != this.hitTest(x, y)) {
				this._isOver = !this._isOver;
			
				if (this._mouseEvents[this._isOver ? "over" : "out"]) {
					this._mouseEvents[this._isOver ? "over" : "out"](x, y);	
				}
			}
		} else if (this._mouseEvents[eventName] && this.hitTest(x, y)) {
			this._mouseEvents[eventName](x, y);
		}
	};
	
	child._dispose = function() {
		delete this._mouseEvents;
		for(var i = 0; i < this._animations; i++) {
			this._animations[i].dispose();
			delete this._animations[i];
		}
	};
	
	child.dispose = function() {
		//override
		this._dispose();
	};
	
	return child;
};


// Copyright 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Known Issues:
//
// * Patterns are not implemented.
// * Radial gradient are not implemented. The VML version of these look very
//   different from the canvas one.
// * Clipping paths are not implemented.
// * Coordsize. The width and height attribute have higher priority than the
//   width and height style values which isn't correct.
// * Painting mode isn't implemented.
// * Canvas width/height should is using content-box by default. IE in
//   Quirks mode will draw the canvas using border-box. Either change your
//   doctype to HTML5
//   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
//   or use Box Sizing Behavior from WebFX
//   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
// * Non uniform scaling does not correctly scale strokes.
// * Optimize. There is always room for speed improvements.

// Only add this code if we do not already have a canvas implementation
if (!document.createElement('canvas').getContext) {

(function() {

  // alias some functions to make (compiled) code shorter
  var m = Math;
  var mr = m.round;
  var ms = m.sin;
  var mc = m.cos;
  var abs = m.abs;
  var sqrt = m.sqrt;

  // this is used for sub pixel precision
  var Z = 10;
  var Z2 = Z / 2;

  /**
   * This funtion is assigned to the <canvas> elements as element.getContext().
   * @this {HTMLElement}
   * @return {CanvasRenderingContext2D_}
   */
  function getContext() {
    return this.context_ ||
        (this.context_ = new CanvasRenderingContext2D_(this));
  }

  var slice = Array.prototype.slice;

  /**
   * Binds a function to an object. The returned function will always use the
   * passed in {@code obj} as {@code this}.
   *
   * Example:
   *
   *   g = bind(f, obj, a, b)
   *   g(c, d) // will do f.call(obj, a, b, c, d)
   *
   * @param {Function} f The function to bind the object to
   * @param {Object} obj The object that should act as this when the function
   *     is called
   * @param {*} var_args Rest arguments that will be used as the initial
   *     arguments when the function is called
   * @return {Function} A new function that has bound this
   */
  function bind(f, obj, var_args) {
    var a = slice.call(arguments, 2);
    return function() {
      return f.apply(obj, a.concat(slice.call(arguments)));
    };
  }

  var G_vmlCanvasManager_ = {
    init: function(opt_doc) {
      if (/MSIE/.test(navigator.userAgent) && !window.opera) {
        var doc = opt_doc || document;
        // Create a dummy element so that IE will allow canvas elements to be
        // recognized.
        doc.createElement('canvas');
        doc.attachEvent('onreadystatechange', bind(this.init_, this, doc));
      }
    },

    init_: function(doc) {
      // create xmlns
      if (!doc.namespaces['g_vml_']) {
        doc.namespaces.add('g_vml_', 'urn:schemas-microsoft-com:vml',
                           '#default#VML');

      }
      if (!doc.namespaces['g_o_']) {
        doc.namespaces.add('g_o_', 'urn:schemas-microsoft-com:office:office',
                           '#default#VML');
      }

      // Setup default CSS.  Only add one style sheet per document
      if (!doc.styleSheets['ex_canvas_']) {
        var ss = doc.createStyleSheet();
        ss.owningElement.id = 'ex_canvas_';
        ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
            // default size is 300x150 in Gecko and Opera
            'text-align:left;width:300px;height:150px}' +
            'g_vml_\\:*{behavior:url(#default#VML)}' +
            'g_o_\\:*{behavior:url(#default#VML)}';

      }

      // find all canvas elements
      var els = doc.getElementsByTagName('canvas');
      for (var i = 0; i < els.length; i++) {
        this.initElement(els[i]);
      }
    },

    /**
     * Public initializes a canvas element so that it can be used as canvas
     * element from now on. This is called automatically before the page is
     * loaded but if you are creating elements using createElement you need to
     * make sure this is called on the element.
     * @param {HTMLElement} el The canvas element to initialize.
     * @return {HTMLElement} the element that was created.
     */
    initElement: function(el) {
      if (!el.getContext) {

        el.getContext = getContext;

        // Remove fallback content. There is no way to hide text nodes so we
        // just remove all childNodes. We could hide all elements and remove
        // text nodes but who really cares about the fallback content.
        el.innerHTML = '';

        // do not use inline function because that will leak memory
        el.attachEvent('onpropertychange', onPropertyChange);
        el.attachEvent('onresize', onResize);

        var attrs = el.attributes;
        if (attrs.width && attrs.width.specified) {
          // TODO: use runtimeStyle and coordsize
          // el.getContext().setWidth_(attrs.width.nodeValue);
          el.style.width = attrs.width.nodeValue + 'px';
        } else {
          el.width = el.clientWidth;
        }
        if (attrs.height && attrs.height.specified) {
          // TODO: use runtimeStyle and coordsize
          // el.getContext().setHeight_(attrs.height.nodeValue);
          el.style.height = attrs.height.nodeValue + 'px';
        } else {
          el.height = el.clientHeight;
        }
        //el.getContext().setCoordsize_()
      }
      return el;
    }
  };

  function onPropertyChange(e) {
    var el = e.srcElement;

    switch (e.propertyName) {
      case 'width':
        el.style.width = el.attributes.width.nodeValue + 'px';
        el.getContext().clearRect();
        break;
      case 'height':
        el.style.height = el.attributes.height.nodeValue + 'px';
        el.getContext().clearRect();
        break;
    }
  }

  function onResize(e) {
    var el = e.srcElement;
    if (el.firstChild) {
      el.firstChild.style.width =  el.clientWidth + 'px';
      el.firstChild.style.height = el.clientHeight + 'px';
    }
  }

  G_vmlCanvasManager_.init();

  // precompute "00" to "FF"
  var dec2hex = [];
  for (var i = 0; i < 16; i++) {
    for (var j = 0; j < 16; j++) {
      dec2hex[i * 16 + j] = i.toString(16) + j.toString(16);
    }
  }

  function createMatrixIdentity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  function matrixMultiply(m1, m2) {
    var result = createMatrixIdentity();

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var sum = 0;

        for (var z = 0; z < 3; z++) {
          sum += m1[x][z] * m2[z][y];
        }

        result[x][y] = sum;
      }
    }
    return result;
  }

  function copyState(o1, o2) {
    o2.fillStyle     = o1.fillStyle;
    o2.lineCap       = o1.lineCap;
    o2.lineJoin      = o1.lineJoin;
    o2.lineWidth     = o1.lineWidth;
    o2.miterLimit    = o1.miterLimit;
    o2.shadowBlur    = o1.shadowBlur;
    o2.shadowColor   = o1.shadowColor;
    o2.shadowOffsetX = o1.shadowOffsetX;
    o2.shadowOffsetY = o1.shadowOffsetY;
    o2.strokeStyle   = o1.strokeStyle;
    o2.globalAlpha   = o1.globalAlpha;
    o2.arcScaleX_    = o1.arcScaleX_;
    o2.arcScaleY_    = o1.arcScaleY_;
    o2.lineScale_    = o1.lineScale_;
  }

  function processStyle(styleString) {
    var str, alpha = 1;

    styleString = String(styleString);
    if (styleString.substring(0, 3) == 'rgb') {
      var start = styleString.indexOf('(', 3);
      var end = styleString.indexOf(')', start + 1);
      var guts = styleString.substring(start + 1, end).split(',');

      str = '#';
      for (var i = 0; i < 3; i++) {
        str += dec2hex[Number(guts[i])];
      }

      if (guts.length == 4 && styleString.substr(3, 1) == 'a') {
        alpha = guts[3];
      }
    } else {
      str = styleString;
    }

    return {color: str, alpha: alpha};
  }

  function processLineCap(lineCap) {
    switch (lineCap) {
      case 'butt':
        return 'flat';
      case 'round':
        return 'round';
      case 'square':
      default:
        return 'square';
    }
  }

  /**
   * This class implements CanvasRenderingContext2D interface as described by
   * the WHATWG.
   * @param {HTMLElement} surfaceElement The element that the 2D context should
   * be associated with
   */
  function CanvasRenderingContext2D_(surfaceElement) {
    this.m_ = createMatrixIdentity();

    this.mStack_ = [];
    this.aStack_ = [];
    this.currentPath_ = [];

    // Canvas context properties
    this.strokeStyle = '#000';
    this.fillStyle = '#000';

    this.lineWidth = 1;
    this.lineJoin = 'miter';
    this.lineCap = 'butt';
    this.miterLimit = Z * 1;
    this.globalAlpha = 1;
    this.canvas = surfaceElement;

    var el = surfaceElement.ownerDocument.createElement('div');
    el.style.width =  surfaceElement.clientWidth + 'px';
    el.style.height = surfaceElement.clientHeight + 'px';
    el.style.overflow = 'hidden';
    el.style.position = 'absolute';
    surfaceElement.appendChild(el);

    this.element_ = el;
    this.arcScaleX_ = 1;
    this.arcScaleY_ = 1;
    this.lineScale_ = 1;
  }

  var contextPrototype = CanvasRenderingContext2D_.prototype;
  contextPrototype.clearRect = function() {
    this.element_.innerHTML = '';
  };

  contextPrototype.beginPath = function() {
    // TODO: Branch current matrix so that save/restore has no effect
    //       as per safari docs.
    this.currentPath_ = [];
  };

  contextPrototype.moveTo = function(aX, aY) {
    var p = this.getCoords_(aX, aY);
    this.currentPath_.push({type: 'moveTo', x: p.x, y: p.y});
    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.lineTo = function(aX, aY) {
    var p = this.getCoords_(aX, aY);
    this.currentPath_.push({type: 'lineTo', x: p.x, y: p.y});

    this.currentX_ = p.x;
    this.currentY_ = p.y;
  };

  contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                            aCP2x, aCP2y,
                                            aX, aY) {
    var p = this.getCoords_(aX, aY);
    var cp1 = this.getCoords_(aCP1x, aCP1y);
    var cp2 = this.getCoords_(aCP2x, aCP2y);
    bezierCurveTo(this, cp1, cp2, p);
  };

  // Helper function that takes the already fixed cordinates.
  function bezierCurveTo(self, cp1, cp2, p) {
    self.currentPath_.push({
      type: 'bezierCurveTo',
      cp1x: cp1.x,
      cp1y: cp1.y,
      cp2x: cp2.x,
      cp2y: cp2.y,
      x: p.x,
      y: p.y
    });
    self.currentX_ = p.x;
    self.currentY_ = p.y;
  }

  contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
    // the following is lifted almost directly from
    // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes

    var cp = this.getCoords_(aCPx, aCPy);
    var p = this.getCoords_(aX, aY);

    var cp1 = {
      x: this.currentX_ + 2.0 / 3.0 * (cp.x - this.currentX_),
      y: this.currentY_ + 2.0 / 3.0 * (cp.y - this.currentY_)
    };
    var cp2 = {
      x: cp1.x + (p.x - this.currentX_) / 3.0,
      y: cp1.y + (p.y - this.currentY_) / 3.0
    };

    bezierCurveTo(this, cp1, cp2, p);
  };

  contextPrototype.arc = function(aX, aY, aRadius,
                                  aStartAngle, aEndAngle, aClockwise) {
    aRadius *= Z;
    var arcType = aClockwise ? 'at' : 'wa';

    var xStart = aX + mc(aStartAngle) * aRadius - Z2;
    var yStart = aY + ms(aStartAngle) * aRadius - Z2;

    var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
    var yEnd = aY + ms(aEndAngle) * aRadius - Z2;

    // IE won't render arches drawn counter clockwise if xStart == xEnd.
    if (xStart == xEnd && !aClockwise) {
      xStart += 0.125; // Offset xStart by 1/80 of a pixel. Use something
                       // that can be represented in binary
    }

    var p = this.getCoords_(aX, aY);
    var pStart = this.getCoords_(xStart, yStart);
    var pEnd = this.getCoords_(xEnd, yEnd);

    this.currentPath_.push({type: arcType,
                           x: p.x,
                           y: p.y,
                           radius: aRadius,
                           xStart: pStart.x,
                           yStart: pStart.y,
                           xEnd: pEnd.x,
                           yEnd: pEnd.y});

  };

  contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
  };

  contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.stroke();

    this.currentPath_ = oldPath;
  };

  contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
    var oldPath = this.currentPath_;
    this.beginPath();

    this.moveTo(aX, aY);
    this.lineTo(aX + aWidth, aY);
    this.lineTo(aX + aWidth, aY + aHeight);
    this.lineTo(aX, aY + aHeight);
    this.closePath();
    this.fill();

    this.currentPath_ = oldPath;
  };

  contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
    var gradient = new CanvasGradient_('gradient');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    return gradient;
  };

  contextPrototype.createRadialGradient = function(aX0, aY0, aR0,
                                                   aX1, aY1, aR1) {
    var gradient = new CanvasGradient_('gradientradial');
    gradient.x0_ = aX0;
    gradient.y0_ = aY0;
    gradient.r0_ = aR0;
    gradient.x1_ = aX1;
    gradient.y1_ = aY1;
    gradient.r1_ = aR1;
    return gradient;
  };

  contextPrototype.drawImage = function(image, var_args) {
    var dx, dy, dw, dh, sx, sy, sw, sh;

    // to find the original width we overide the width and height
    var oldRuntimeWidth = image.runtimeStyle.width;
    var oldRuntimeHeight = image.runtimeStyle.height;
    image.runtimeStyle.width = 'auto';
    image.runtimeStyle.height = 'auto';

    // get the original size
    var w = image.width;
    var h = image.height;

    // and remove overides
    image.runtimeStyle.width = oldRuntimeWidth;
    image.runtimeStyle.height = oldRuntimeHeight;

    if (arguments.length == 3) {
      dx = arguments[1];
      dy = arguments[2];
      sx = sy = 0;
      sw = dw = w;
      sh = dh = h;
    } else if (arguments.length == 5) {
      dx = arguments[1];
      dy = arguments[2];
      dw = arguments[3];
      dh = arguments[4];
      sx = sy = 0;
      sw = w;
      sh = h;
    } else if (arguments.length == 9) {
      sx = arguments[1];
      sy = arguments[2];
      sw = arguments[3];
      sh = arguments[4];
      dx = arguments[5];
      dy = arguments[6];
      dw = arguments[7];
      dh = arguments[8];
    } else {
      throw Error('Invalid number of arguments');
    }

    var d = this.getCoords_(dx, dy);

    var w2 = sw / 2;
    var h2 = sh / 2;

    var vmlStr = [];

    var W = 10;
    var H = 10;

    // For some reason that I've now forgotten, using divs didn't work
    vmlStr.push(' <g_vml_:group',
                ' coordsize="', Z * W, ',', Z * H, '"',
                ' coordorigin="0,0"' ,
                ' style="width:', W, 'px;height:', H, 'px;position:absolute;');

    // If filters are necessary (rotation exists), create them
    // filters are bog-slow, so only create them if abbsolutely necessary
    // The following check doesn't account for skews (which don't exist
    // in the canvas spec (yet) anyway.

    if (this.m_[0][0] != 1 || this.m_[0][1]) {
      var filter = [];

      // Note the 12/21 reversal
      filter.push('M11=', this.m_[0][0], ',',
                  'M12=', this.m_[1][0], ',',
                  'M21=', this.m_[0][1], ',',
                  'M22=', this.m_[1][1], ',',
                  'Dx=', mr(d.x / Z), ',',
                  'Dy=', mr(d.y / Z), '');

      // Bounding box calculation (need to minimize displayed area so that
      // filters don't waste time on unused pixels.
      var max = d;
      var c2 = this.getCoords_(dx + dw, dy);
      var c3 = this.getCoords_(dx, dy + dh);
      var c4 = this.getCoords_(dx + dw, dy + dh);

      max.x = m.max(max.x, c2.x, c3.x, c4.x);
      max.y = m.max(max.y, c2.y, c3.y, c4.y);

      vmlStr.push('padding:0 ', mr(max.x / Z), 'px ', mr(max.y / Z),
                  'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(',
                  filter.join(''), ", sizingmethod='clip');")
    } else {
      vmlStr.push('top:', mr(d.y / Z), 'px;left:', mr(d.x / Z), 'px;');
    }

    vmlStr.push(' ">' ,
                '<g_vml_:image src="', image.src, '"',
                ' style="width:', Z * dw, 'px;',
                ' height:', Z * dh, 'px;"',
                ' cropleft="', sx / w, '"',
                ' croptop="', sy / h, '"',
                ' cropright="', (w - sx - sw) / w, '"',
                ' cropbottom="', (h - sy - sh) / h, '"',
                ' />',
                '</g_vml_:group>');

    this.element_.insertAdjacentHTML('BeforeEnd',
                                    vmlStr.join(''));
  };

  contextPrototype.stroke = function(aFill) {
    var lineStr = [];
    var lineOpen = false;
    var a = processStyle(aFill ? this.fillStyle : this.strokeStyle);
    var color = a.color;
    var opacity = a.alpha * this.globalAlpha;

    var W = 10;
    var H = 10;

    lineStr.push('<g_vml_:shape',
                 ' filled="', !!aFill, '"',
                 ' style="position:absolute;width:', W, 'px;height:', H, 'px;"',
                 ' coordorigin="0 0" coordsize="', Z * W, ' ', Z * H, '"',
                 ' stroked="', !aFill, '"',
                 ' path="');

    var newSeq = false;
    var min = {x: null, y: null};
    var max = {x: null, y: null};

    for (var i = 0; i < this.currentPath_.length; i++) {
      var p = this.currentPath_[i];
      var c;

      switch (p.type) {
        case 'moveTo':
          c = p;
          lineStr.push(' m ', mr(p.x), ',', mr(p.y));
          break;
        case 'lineTo':
          lineStr.push(' l ', mr(p.x), ',', mr(p.y));
          break;
        case 'close':
          lineStr.push(' x ');
          p = null;
          break;
        case 'bezierCurveTo':
          lineStr.push(' c ',
                       mr(p.cp1x), ',', mr(p.cp1y), ',',
                       mr(p.cp2x), ',', mr(p.cp2y), ',',
                       mr(p.x), ',', mr(p.y));
          break;
        case 'at':
        case 'wa':
          lineStr.push(' ', p.type, ' ',
                       mr(p.x - this.arcScaleX_ * p.radius), ',',
                       mr(p.y - this.arcScaleY_ * p.radius), ' ',
                       mr(p.x + this.arcScaleX_ * p.radius), ',',
                       mr(p.y + this.arcScaleY_ * p.radius), ' ',
                       mr(p.xStart), ',', mr(p.yStart), ' ',
                       mr(p.xEnd), ',', mr(p.yEnd));
          break;
      }


      // TODO: Following is broken for curves due to
      //       move to proper paths.

      // Figure out dimensions so we can do gradient fills
      // properly
      if (p) {
        if (min.x == null || p.x < min.x) {
          min.x = p.x;
        }
        if (max.x == null || p.x > max.x) {
          max.x = p.x;
        }
        if (min.y == null || p.y < min.y) {
          min.y = p.y;
        }
        if (max.y == null || p.y > max.y) {
          max.y = p.y;
        }
      }
    }
    lineStr.push(' ">');

    if (!aFill) {
      var lineWidth = this.lineScale_ * this.lineWidth;

      // VML cannot correctly render a line if the width is less than 1px.
      // In that case, we dilute the color to make the line look thinner.
      if (lineWidth < 1) {
        opacity *= lineWidth;
      }

      lineStr.push(
        '<g_vml_:stroke',
        ' opacity="', opacity, '"',
        ' joinstyle="', this.lineJoin, '"',
        ' miterlimit="', this.miterLimit, '"',
        ' endcap="', processLineCap(this.lineCap), '"',
        ' weight="', lineWidth, 'px"',
        ' color="', color, '" />'
      );
    } else if (typeof this.fillStyle == 'object') {
      var fillStyle = this.fillStyle;
      var angle = 0;
      var focus = {x: 0, y: 0};

      // additional offset
      var shift = 0;
      // scale factor for offset
      var expansion = 1;

      if (fillStyle.type_ == 'gradient') {
        var x0 = fillStyle.x0_ / this.arcScaleX_;
        var y0 = fillStyle.y0_ / this.arcScaleY_;
        var x1 = fillStyle.x1_ / this.arcScaleX_;
        var y1 = fillStyle.y1_ / this.arcScaleY_;
        var p0 = this.getCoords_(x0, y0);
        var p1 = this.getCoords_(x1, y1);
        var dx = p1.x - p0.x;
        var dy = p1.y - p0.y;
        angle = Math.atan2(dx, dy) * 180 / Math.PI;

        // The angle should be a non-negative number.
        if (angle < 0) {
          angle += 360;
        }

        // Very small angles produce an unexpected result because they are
        // converted to a scientific notation string.
        if (angle < 1e-6) {
          angle = 0;
        }
      } else {
        var p0 = this.getCoords_(fillStyle.x0_, fillStyle.y0_);
        var width  = max.x - min.x;
        var height = max.y - min.y;
        focus = {
          x: (p0.x - min.x) / width,
          y: (p0.y - min.y) / height
        };

        width  /= this.arcScaleX_ * Z;
        height /= this.arcScaleY_ * Z;
        var dimension = m.max(width, height);
        shift = 2 * fillStyle.r0_ / dimension;
        expansion = 2 * fillStyle.r1_ / dimension - shift;
      }

      // We need to sort the color stops in ascending order by offset,
      // otherwise IE won't interpret it correctly.
      var stops = fillStyle.colors_;
      stops.sort(function(cs1, cs2) {
        return cs1.offset - cs2.offset;
      });

      var length = stops.length;
      var color1 = stops[0].color;
      var color2 = stops[length - 1].color;
      var opacity1 = stops[0].alpha * this.globalAlpha;
      var opacity2 = stops[length - 1].alpha * this.globalAlpha;

      var colors = [];
      for (var i = 0; i < length; i++) {
        var stop = stops[i];
        colors.push(stop.offset * expansion + shift + ' ' + stop.color);
      }

      // When colors attribute is used, the meanings of opacity and o:opacity2
      // are reversed.
      lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"',
                   ' method="none" focus="100%"',
                   ' color="', color1, '"',
                   ' color2="', color2, '"',
                   ' colors="', colors.join(','), '"',
                   ' opacity="', opacity2, '"',
                   ' g_o_:opacity2="', opacity1, '"',
                   ' angle="', angle, '"',
                   ' focusposition="', focus.x, ',', focus.y, '" />');
    } else {
      lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity,
                   '" />');
    }

    lineStr.push('</g_vml_:shape>');

    this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
  };

  contextPrototype.fill = function() {
    this.stroke(true);
  }

  contextPrototype.closePath = function() {
    this.currentPath_.push({type: 'close'});
  };

  /**
   * @private
   */
  contextPrototype.getCoords_ = function(aX, aY) {
    var m = this.m_;
    return {
      x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
      y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
    }
  };

  contextPrototype.save = function() {
    var o = {};
    copyState(this, o);
    this.aStack_.push(o);
    this.mStack_.push(this.m_);
    this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
  };

  contextPrototype.restore = function() {
    copyState(this.aStack_.pop(), this);
    this.m_ = this.mStack_.pop();
  };

  function matrixIsFinite(m) {
    for (var j = 0; j < 3; j++) {
      for (var k = 0; k < 2; k++) {
        if (!isFinite(m[j][k]) || isNaN(m[j][k])) {
          return false;
        }
      }
    }
    return true;
  }

  function setM(ctx, m, updateLineScale) {
    if (!matrixIsFinite(m)) {
      return;
    }
    ctx.m_ = m;

    if (updateLineScale) {
      // Get the line scale.
      // Determinant of this.m_ means how much the area is enlarged by the
      // transformation. So its square root can be used as a scale factor
      // for width.
      var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
      ctx.lineScale_ = sqrt(abs(det));
    }
  }

  contextPrototype.translate = function(aX, aY) {
    var m1 = [
      [1,  0,  0],
      [0,  1,  0],
      [aX, aY, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.rotate = function(aRot) {
    var c = mc(aRot);
    var s = ms(aRot);

    var m1 = [
      [c,  s, 0],
      [-s, c, 0],
      [0,  0, 1]
    ];

    setM(this, matrixMultiply(m1, this.m_), false);
  };

  contextPrototype.scale = function(aX, aY) {
    this.arcScaleX_ *= aX;
    this.arcScaleY_ *= aY;
    var m1 = [
      [aX, 0,  0],
      [0,  aY, 0],
      [0,  0,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
    var m1 = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, matrixMultiply(m1, this.m_), true);
  };

  contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
    var m = [
      [m11, m12, 0],
      [m21, m22, 0],
      [dx,  dy,  1]
    ];

    setM(this, m, true);
  };

  /******** STUBS ********/
  contextPrototype.clip = function() {
    // TODO: Implement
  };

  contextPrototype.arcTo = function() {
    // TODO: Implement
  };

  contextPrototype.createPattern = function() {
    return new CanvasPattern_;
  };

  // Gradient / Pattern Stubs
  function CanvasGradient_(aType) {
    this.type_ = aType;
    this.x0_ = 0;
    this.y0_ = 0;
    this.r0_ = 0;
    this.x1_ = 0;
    this.y1_ = 0;
    this.r1_ = 0;
    this.colors_ = [];
  }

  CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
    aColor = processStyle(aColor);
    this.colors_.push({offset: aOffset,
                       color: aColor.color,
                       alpha: aColor.alpha});
  };

  function CanvasPattern_() {}

  // set up externs
  G_vmlCanvasManager = G_vmlCanvasManager_;
  CanvasRenderingContext2D = CanvasRenderingContext2D_;
  CanvasGradient = CanvasGradient_;
  CanvasPattern = CanvasPattern_;

})();

} // if
// End of code licensed under Apache License 2.0


//jcotton.gradient.js
jcotton.gradientStop = function(color, position) {
	this.color = color;
	this.position = position;	
};

jcotton.linearGradient = function(context, x1, y1, x2, y2) {
	this._gradient = context.createLinearGradient(x1, y1, x2, y2);
	
	this.addStop = function(color, position) {
		this._gradient.addColorStop(position, color.getStyle());
	};
	
	this.getStyle = function() {
		return this._gradient;
	};
	
	this.isVisible = function() {
		return true;
	}
};


//jcotton.group.js
jcotton._group = function() {
	this._drawables = [];
	
	this.add = function(drawable) {
		drawable._setContext(this._context);
		this._drawables.push(drawable);
		return this;
	};
	
	this._setContext = function(context) {
		this._context = context;
		for (var i = 0; i < this._drawables.length; i++) {
			this._drawables[i]._setContext(context);	
		}
	};
	
	this._drawInternal = function(context) {
		for (var i = 0; i < this._drawables.length; i++) {
			this._drawables[i].draw(context);	
		}	
	};
	
	this._xmin = function() { 
		var minPos = this._drawables[0]._xmin() + this._drawables[0]._xposition;
		for(var i = 0; i < this._drawables.length; i++) {
			if (this._drawables[i]._xmin() + this._drawables[0]._xposition < minPos) {
				minPos = this._drawables[i]._xmin() + this._drawables[0]._xposition;
			}
		}
		return minPos;
	};
	this._xmax = function() { 
		var maxPos = this._drawables[0]._xmax() + this._drawables[0]._xposition;
		for(var i = 0; i < this._drawables.length; i++) {
			if (this._drawables[i]._xmax() + this._drawables[0]._xposition > maxPos) {
				maxPos = this._drawables[i]._xmax() + this._drawables[0]._xposition;
			}
		}
		return maxPos;
	};
	this._ymin = function() { 
		var minPos = this._drawables[0]._ymin() + this._drawables[0]._yposition;
		for(var i = 0; i < this._drawables.length; i++) {
			if (this._drawables[i]._ymin() + this._drawables[0]._yposition < minPos) {
				minPos = this._drawables[i]._ymin() + this._drawables[0]._yposition;
			}
		}
		return minPos;
	};
	this._ymax = function() { 
		var maxPos = this._drawables[0]._ymax() + this._drawables[0]._yposition;
		for(var i = 0; i < this._drawables.length; i++) {
			if (this._drawables[i]._ymax() + this._drawables[0]._yposition > maxPos) {
				maxPos = this._drawables[i]._ymax() + this._drawables[0]._yposition;
			}
		}
		return maxPos;
	};
	
	this.dispose = function() {
		for(var i = 0; i < this._drawables.length; i++) {
			this._drawables[i].dispose();	
			delete this._drawables[i];
		}
		this._dispose();
	};
};

jcotton.group = function() {
	return jcotton.drawable(
		new jcotton._group()
	);
};


//jcotton.helpers.js
jcotton.helpers = {
	getScrollPosition: function() {
		return [
			(window.pageXOffset === undefined ? document.scrollLeft : window.pageXOffset), 
			(window.pageYOffset === undefined ? document.scrollTop : window.pageYOffset)
		];
	},
	
	getOffset: function(element) {
		var scrollPosition = jcotton.helpers.getScrollPosition();
		var offset = [
			-scrollPosition[0], 
			-scrollPosition[1]
		];
		while(element) {
			offset[0] += element.offsetLeft;
			offset[1] += element.offsetTop;
			element = element.offsetParent;
		}
		return offset;
	},
	
	addWindowEvent: function(eventName, callback) {
		if (window.addEventListener) // W3C standard
		{
		  window.addEventListener(eventName, callback, false); // NB **not** 'onload'
		} 
		else if (window.attachEvent) // Microsoft
		{
		  window.attachEvent('on' + eventName, callback);
		}
	},	
	
	getCurrentTimestamp: function() {
		var currentDate = new Date();
		var currentTimestamp = currentDate.getTime();
		//delete currentDate;
		return currentTimestamp;
	},
	
	touchHandler: function(e) {
		var touches = e.changedTouches,
	        type = "";
	    
	    var scrollPosition = jcotton.helpers.getScrollPosition();
	    
	    for (var i = 0; i < touches.length; i++) {
			var replaceEvent = false;
			for(var key in jcotton.canvases) {
				if (jcotton.canvases.hasOwnProperty(key)) {
					var mousePosition = jcotton.canvases[key]._getMousePosition(touches[i]);
					mousePosition[0] -= scrollPosition[0];
					mousePosition[1] -= scrollPosition[1];
					replaceEvent = replaceEvent || 
					(mousePosition[0] >= 0 && mousePosition[0] <= jcotton.canvases[key].width() &&
					 mousePosition[1] >= 0 && mousePosition[1] <= jcotton.canvases[key].height());
				}
				
			}
			if (replaceEvent) {
			    
			    switch(e.type)
			    {
			        case "touchstart": type = "mousedown"; break;
			        case "touchmove":  type="mousemove"; break;        
			        case "touchend":   type="mouseup"; break;
			        default: return;
			    }
			    
			    var simulatedEvent = document.createEvent("MouseEvent");
			    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
			                              touches[i].screenX, touches[i].screenY, 
			                              touches[i].clientX - scrollPosition[0], touches[i].clientY - scrollPosition[1], false, 
			                              false, false, false, 0/*left*/, null);
			                                                                            
			    touches[i].target.dispatchEvent(simulatedEvent);
			    e.preventDefault();
			}
		}
	}
};

if (jcotton.config.hasTouches) {
	document.addEventListener("touchstart", jcotton.helpers.touchHandler, true);
	document.addEventListener("touchmove", jcotton.helpers.touchHandler, true);
	document.addEventListener("touchend", jcotton.helpers.touchHandler, true);
}

jcotton._image = function(path) {
	this._path = "";
	
	this.src = function(imagePath) {
		this._path = imagePath;
	
		if (!jcotton.animationImages[imagePath]) {
			jcotton.animationImagesLoaded[imagePath] = false;
			jcotton.animationImages[imagePath] = this.image = new Image();
			jcotton.animationImages[imagePath].src = imagePath;
			jcotton.animationImages[imagePath].onload = function() {
				jcotton.animationImagesLoaded[imagePath] = true;
			};
		}
		return this;
	};
	
	if (path) {
		this.src(path);
	}
	
	this._drawInternal = function(context) {
		if (jcotton.animationImagesLoaded[this._path]) {
			var image = jcotton.animationImages[this._path];
			context.drawImage(image, 0, 0);
		}
	};
	
	this._xmin = function() { return 0; };
	this._xmax = function() { return jcotton.animationImages[this._path].width; };
	this._ymin = function() { return 0; };
	this._ymax = function() { return jcotton.animationImages[this._path].height; };
	
	this.dispose = function() {
		this._dispose();
	};
};

jcotton.image = function(path) {
	return jcotton.drawable(
		new jcotton._image(path)
	);
};

//jcotton.path.js
jcotton.path = function(child) {
	jcotton.drawable(child);
	
	child._strokeColor = new jcotton.color(0, 0, 0, 1);
	child._strokeWidth = 1;
	child._fillColor = new jcotton.color(255, 255, 255, 1);
	
	child.fillColor = function(red, green, blue, opacity) {
		delete this._fillColor;
		this._fillColor = new jcotton.color(red, green, blue, opacity);
		return this;
	};
	
	child.fillGradient = function(canvas, x1, y1, x2, y2) {
		delete this._fillColor;
		this._fillColor = new jcotton.linearGradient(canvas._context, x1, y1, x2, y2);
		return this;
	};
	
	child.fillGradientStop = function(position, red, green, blue, opacity) {
		this._fillColor.addStop( new jcotton.color(red, green, blue, opacity), position);
		return this;
	};
	
	child.strokeColor = function(red, green, blue, opacity) {
		delete this._strokeColor;
		this._strokeColor = new jcotton.color(red, green, blue, opacity);
		return this;
	};
	
	child.strokeWidth = function(strokeWidth) {
		this._strokeWidth = strokeWidth;
		return this;
	};
	
	child._setupPath = function(context) {
		context.fillStyle = this._fillColor.getStyle();
		context.strokeStyle = this._strokeColor.getStyle();
		context.lineWidth = this._strokeWidth;	
	};
	
	child.__dispose = child._dispose;
	
	child._dispose = function() {
		delete this._verticies;
		delete this._strokeColor;
		delete this._fillColor;
		this.__dispose();
	};

	return child;
};

//jcotton.rect.js
jcotton.rect = function(x, y, width, height) {
	return jcotton.shape()
		.strait(x, y)
		.strait(x + width, y)
		.strait(x + width, y + height)
		.strait(x, y+ height);
};

//jcotton.roundrect.js
jcotton.roundrect = function(x, y, width, height, radius) {
	return jcotton.shape()
		.strait(x, y + radius)
		.quad(x + radius, y, x, y)
		.strait(x + width - radius, y)
		.quad(x + width, y + radius, x + width, y)
		.strait(x + width, y + height - radius)
		.quad(x + width - radius, y + height, x + width, y + height)
		.strait(x + radius, y + height)
		.quad(x, y + height - radius, x, y + height);
};

//jcotton.shape.js
jcotton._shape = function(isClosed) {		
	this._verticies = [];
	this._isClosed = (isClosed === undefined || isClosed);
	
	this.strait = function(x, y) {
		this._verticies.push(new jcotton.shapePrim.strait(x, y));
		return this;
	};
	
	this.bezier = function(x, y, cp1x, cp1y, cp2x, cp2y) {
		this._verticies.push(new jcotton.shapePrim.bezier(x, y, cp1x, cp1y, cp2x, cp2y));
		return this;
	};
	
	this.quad = function(x, y, cpx, cpy) {
		this._verticies.push(new jcotton.shapePrim.quadCurve(x,y, cpx, cpy));
		return this;
	};

	this._drawInternal = function(context) {
		context.beginPath();
		//set initial position
		context.moveTo(this._verticies[0].x, this._verticies[0].y);
		
		//draw all verticies
		for(var i = 1; i < this._verticies.length; i++) {
			this._verticies[i].drawTo(context);
		}
		
		this._setupPath(context);
		
		// if the shape is closed, draw a line back to the first point and fill
		if (this._isClosed && this._fillColor.isVisible()) {
			this._verticies[0].drawTo(context);
			this._verticies[1].drawTo(context);
			context.fill();
		}
		
		// draw the stroke
		if (this._strokeWidth > 0 && this._strokeColor.isVisible()) {
			context.stroke();
		}
	};
	
	this._xmin = function() {
		var minPos = this._verticies[0].x;
		for(var i = 0; i < this._verticies.length; i++) {
			if (this._verticies[i].x < minPos) { minPos = this._verticies[i].x; }
		}
		return minPos;	
	};
	this._xmax = function() {
		var maxPos = this._verticies[0].x;
		for(var i = 0; i < this._verticies.length; i++) {
			if (this._verticies[i].x > maxPos) { maxPos = this._verticies[i].x; }
		}
		return maxPos;
	};
	this._ymin = function() {
		var minPos = this._verticies[0].y;
		for(var i = 0; i < this._verticies.length; i++) {
			if (this._verticies[i].y < minPos) { minPos = this._verticies[i].y; }
		}
		return minPos;	
	};
	this._ymax = function() {
		var maxPos = this._verticies[0].y;
		for(var i = 0; i < this._verticies.length; i++) {
			if (this._verticies[i].y > maxPos) { maxPos = this._verticies[i].y; }
		}
		return maxPos;
	};
	
	this.dispose = function() {
		for(var i = 0; i < this._verticies.length; i++) {
			delete this._verticies[i];
		}
		this._dispose();
	};
};
		
jcotton.shape = function(isClosed) {
	return jcotton.path(
		new jcotton._shape(isClosed)
	);
};

jcotton.shapePrim = {
	strait: function(x, y) {
		this.x = x;
		this.y = y;
		
		this.drawTo = function(context) {
			context.lineTo(x, y);	
		};
	},
	
	bezier: function(x, y, cp1x, cp1y, cp2x, cp2y) {
		this.x = x;
		this.y = y;
		this.cp1x = cp1x;
		this.cp1y = cp1y;
		this.cp2x = cp2x;
		this.cp2y = cp2y;
		
		this.drawTo = function(context) {
			context.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.x, this.y);
		};
	},
	
	quadCurve: function(x, y, cpx, cpy) {
		this.x = x;
		this.y = y;
		this.cpx = cpx;
		this.cpy = cpy;
		
		this.drawTo = function(context) {
			context.quadraticCurveTo(this.cpx, this.cpy, this.x, this.y);
		};
	}
};


//jcotton.text.js
jcotton._text = function(textContent) {
	this._text = String(textContent);
	this._font = new jcotton.font({ });
	this._color = new jcotton.color(0, 0, 0, 1);
	
	this.text = function(textContent) {
		if (textContent === undefined) {
			return this._text;
		} else {
			this._text = String(textContent);
			return this;
		}
	};
	
	this.size = function(size) {
		if (size === undefined) {
			return this._font.description.size;
		} else {
			this._font.description.size = size;
			return this;
		}
	};
	
	this.weight = function(weight) {
		if (weight === undefined) {
			return this._font.description.weight;
		} else {
			this._font.description.weight = weight;
			return this;
		}
	};
	
	this.style = function(style) {
		if (style === undefined) {
			return this._font.description.style;
		} else {
			this._font.description.style = style;
			return this;
		}
	};
	
	this.font = function(font) {
		if (font === undefined) {
			return this._font.description.name;
		} else {
			this._font.description.name = font;
			return this;
		}
	};
	
	this.color = function(red, green, blue, opacity) {
		delete this._color;
		this._color = new jcotton.color(red, green, blue, opacity);
		return this;
	};
	
	this._setColor = function(color) {
		delete this._color;
		this._color = color;
	};
	
	this._setFont = function(font) {
		delete this._font;
		this._font = font;
	};
	
	this._drawInternal = function(context) {
		if (jcotton.config.canDrawText) {
			context.font = this._font.getFontDescription();
			context.fillStyle = this._color.getStyle();
			context.fillText(this._text, 0, this._font.description.size);
		} else {
			context.strokeStyle = this._color.getStyle();
			context.fakeDrawText('', this._font.description.size - 4, 0, this._font.description.size - 4, this._text);
		}
	};
	
	this._xmin = function() { return 0; };
	this._xmax = function() { 
		if (jcotton.config.canDrawText) {
			this._context.font = this._font.getFontDescription();
			return this._context.measureText(this._text).width;
		} else {
			return this._context.fakeMeasureText('', this._font.description.size - 4, this._text);
		}
	};
	this._ymin = function() { return 0; };
	this._ymax = function() { return this._font.description.size + 4; };
	
	this.dispose = function() {
		delete this._font;
		delete this._color;
		this._dispose();
	};
};

jcotton.text = function(textContent) {
	return jcotton.drawable(
		new jcotton._text(textContent)
	);
};

jcotton.font = function(args) {
	if (!args.style) { args.style = "normal"; }
	if (!args.weight) { args.weight = "normal"; }
	if (!args.size) { args.size = 14; }
	if (!args.name) { args.name = "sans-serif"; }
	
	this.description = args;
	
	this.getFontDescription = function() {
		return this.description.style + " " + this.description.weight + " " + this.description.size + "px " + this.description.name;
	};
	
	this.getSize = function() {
		return this.description.size;
	};
};


//jcotton.textbox.js
jcotton._textbox = function(textContent, width) {
	this._text = textContent;
	this._font = new jcotton.font({ });
	this._color = new jcotton.color(0, 0, 0, 1);
	this._width = width;
	this._dirty = true;
	this._textPieces = [];
	
	this.text = function(textContent) {
		this._text = textContent;
		this._dirty = true;
		return this;
	};
	
	this.size = function(size) {
		this._font.description.size = size;
		this._dirty = true;
		return this;
	};
	
	this.weight = function(weight) {
		this._font.description.weight = weight;
		this._dirty = true;
		return this;
	};
	
	this.style = function(style) {
		this._font.description.style = style;
		this._dirty = true;
		return this;
	};
	
	this.font = function(font) {
		this._font.description.name = font;
		this._dirty = true;
		return this;
	};
	
	this.color = function(red, green, blue, opacity) {
		delete this._color;
		this._color = new jcotton.color(red, green, blue, opacity);
		this._dirty = true;
		return this;
	};
	
	this._createTextPieces = function(context) {
		var i;
		for(i = 0; i < this._textPieces.length; i++) {
			this._textPieces[i].dispose();
			delete this._textPieces[i];
		}
		delete this._textPieces;
		this._textPieces = [];
		
		var offset = 0;
		var words = this._text.split(' ');
		var currentTextContent = words[0];
		var currentText = jcotton.text(currentTextContent).position(0, offset);
		currentText._setContext(context);
		currentText._setFont(this._font);
		currentText._setColor(this._color);
		
		for(i = 1; i < words.length; i++) {
			currentTextContent += ' ' + words[i];
			
			currentText.text(currentTextContent);
			
			if (currentText._xmax() > this._width) {
				currentText.text(currentTextContent.substr(0, currentTextContent.length - (words[i].length + 1)));
				this._textPieces.push(currentText);
				
				currentTextContent = words[i];
				offset += this._font.getSize() + 2;
				currentText = jcotton.text(currentTextContent).position(0, offset);
				currentText._setContext(context);
				currentText._setFont(this._font);
				currentText._setColor(this._color);
			}
		}
		this._textPieces.push(currentText);
		this._dirty = false;
	};
	
	this._drawInternal = function(context) {
		if (this._dirty) {
			this._createTextPieces(context);
		}
		for(var i = 0; i < this._textPieces.length; i++) {
			this._textPieces[i].draw(context);
		}
	};
	
	this._xmin = function() { return 0; };
	this._xmax = function() { 
		this._context.font = this._font.getFontDescription();
		return this._context.measureText(this.textContent).width;
	};
	this._ymin = function() { return 0; };
	this._ymax = function() { return this._font.description.size + 4; };
	
	this.dispose = function() {
		delete this._font;
		delete this._color;
		
		for(var i = 0; i < this._textPieces.length; i++) {
			this._textPieces[i].dispose();
			delete this._textPieces[i];
		}
		delete this._textPieces;
		
		this._dispose();
	};
};

jcotton.textbox = function(textContent, width) {
	return jcotton.drawable(
		new jcotton._textbox(textContent, width)
	);
};