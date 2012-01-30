function captureThree() {
    this.maxx = 6;
    this.maxy = 6;
    this.area = new Array(this.maxx);
    for (var i=0;i<this.maxx;i++) {
        this.area[i] = new Array(this.maxy);
    }   
}