function captureThree() {
    this.maxx = 6;
    this.maxy = 6;
    this.area = new Array(this.maxx);
    for (var i=0;i<this.maxx;i++) {
        this.area[i] = new Array(this.maxy);
    }
    this.area[0][0] = new piece(0,0);
    this.area[0][1] = new piece(1,0);
    this.area[3][1] = new piece(1,1);
}

function piece(owner, value) {
    this.owner = owner;
    this.value = value;
}