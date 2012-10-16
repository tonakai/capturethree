(function(exports) {

	exports.piece = function(owner, value) {
		this.owner = owner;
		this.value = value;
	}
	
	exports.captureThree = function() {
		this.maxx = 6;
		this.maxy = 6;
		this.area = new Array(this.maxx);
		for (var i = 0; i < this.maxx; i++) {
			this.area[i] = new Array(this.maxy);
		}
		this.area[0][0] = new exports.piece(0, 0);
		this.area[0][1] = new exports.piece(1, 0);
		this.area[3][1] = new exports.piece(1, 1);
	}


	exports.test = function() {
		return 'hello world'
	};

})( typeof exports === 'undefined' ? this['ct'] = {} : exports);

