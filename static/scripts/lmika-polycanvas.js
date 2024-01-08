class Vector {
    constructor(ox, oy, px, py) {
        this.ox = ox;
        this.oy = oy;
        this.px = px;
        this.py = py;
    }
    
    static withPos(vec, x, y) {
        return new Vector(vec.ox, vec.oy, x, y);
    }
    
    atOrigin(ox, oy) {
        return new Vector(ox, oy, (this.px - this.ox) + ox, (this.py - this.oy) + oy);
    }
    
    normal() {
        let dx = this.px-this.ox;
        let dy = this.py-this.oy;
    
        return new Vector(0, 0, -dy, dx);    
    }
    
    withMagnitude(mag) {
        let dx = this.px-this.ox;
        let dy = this.py-this.oy;
        let m = this.magnitude();
        
        return new Vector(this.ox, this.oy, this.ox +  dx * mag / m, this.oy + dy * mag / m);
    }
    
    cartesian() {
        return new Vector(0, 0, this.px-this.ox, this.py-this.oy);
    }
    
    magnitude() {
        let dx = this.px-this.ox;
        let dy = this.py-this.oy;
        
        return Math.sqrt(dx*dx + dy*dy);
    }
    
    dotProduct(otherVec) {
        let a = this.cartesian();
        let b = otherVec.cartesian();
        
        return a.px * b.px + a.py * b.py;
    }
    
    angle(otherVec) {
        // dot product = |a||b|cos theta
        let dp = this.dotProduct(otherVec);        
        return Math.acos(dp / (this.magnitude()*otherVec.magnitude()));
    }
}

function definePolygon(cx, cy, r, sides) {
    let vectors = [];
    
    let px = 0, py = 0;
    for (theta = 360; theta >= 0; theta -= 360 / sides) {
        console.log(theta);
        
        let qy = cy + r * Math.cos(theta * Math.PI / 180);
        let qx = cx + r * Math.sin(theta * Math.PI / 180);
        
        if (theta < 360) {
            vectors.push(new Vector(px, py, qx, qy));
        }
        px = qx;
        py = qy;
    }
    
    return vectors;
}

class World {    
    constructor(vectors, o) {
        let opts = {
            showNormals: false,
            showArcWithLine: false,
            showArcWithNormal: false,
            showSmallNormals: false,
            printArcAngle: false,
            arcMonoColour: false,
            printDP: false,
            showInPolygon: false,
            ...o
        }
        
        this.vectors = vectors;
        this.showNormals = opts.showNormals;
        this.trackMouse = opts.trackMouse;
        this.showArcWithLine = opts.showArcWithLine;
        this.showArcWithNormal = opts.showArcWithNormal;
        this.showSmallNormals = opts.showSmallNormals;
        this.printArcAngle = opts.printArcAngle;
        this.arcMonoColour = opts.arcMonoColour;
        this.printDP = opts.printDP;
        this.showInPolygon = opts.showInPolygon;
        
        this.mouseX = opts.mouseX;
        this.mouseY = opts.mouseY;
    }
    
    hasMousePoint() {
        return (this.mouseX !== null) && (this.mouseY !== null);
    }
    
    mouseVector(fromVec) {
        if (!this.hasMousePoint()) {
            return null;
        }
        
        return Vector.withPos(fromVec, this.mouseX, this.mouseY);
    }
    
    static worlds = {
        // Single line
        "1": (cw, ch) => {
            let gx = 50, gy = 50;
            
            return new World([
                new Vector(gx * 6, gy * 7, gx * 8, gy * 1.5),
            ], {});
        },
        
        // World 2 is just world 1 with the normals shown
        "2": (cw, ch) => {
            let w = World.worlds["1"](cw, ch);
            w.showNormals = true;
            
            return w;
        },

        // World 3 is just world 2 with mouse tracking turned on
        "3": (cw, ch) => {
            let gx = 50, gy = 50;
            
            let w = World.worlds["2"](cw, ch);
            w.trackMouse = true;
            w.showArcWithLine = true;
            w.printArcAngle = true;
            w.arcMonoColour = true;
            w.mouseX = gx * 11;
            w.mouseY = gy * 5;
            
            return w;
        },
        
        // World 4 is just world 2 with mouse tracking turned on
        "4": (cw, ch) => {
            let gx = 50, gy = 50;
            
            let w = World.worlds["2"](cw, ch);
            w.trackMouse = true;
            w.showArcWithNormal = true;
            w.printArcAngle = true;
            w.printDP = true;
            w.mouseX = gx * 4;
            w.mouseY = gy * 3;
            
            return w;
        },
        
        // World 5 is with the polygon
        "5": (cw, ch) => {
            let gx = cw / 8, gy = ch / 8;
            
            return new World(definePolygon(gx * 4, gy * 4, gx * 2, 6), {
                showSmallNormals: true,
                trackMouse: true,
                mouseX: gx * 4,
                mouseY: gy * 4,
                showInPolygon: true,
            });
        },
    }
}



class LmikaPolycanvas extends HTMLElement {
    static observedAttributes = ["world"];
    
    static canvasWidth = 700;
    static canvasHeight = 500;
    static gridStep = 50;
    
    constructor() {
        super();
    }
    
    connectedCallback() {
        // Replace the image with a canvas
        let img = this.querySelector("img");
        
        let newCanvas = document.createElement("canvas");
        
        // newCanvas.setAttribute("width", LmikaPolycanvas.canvasWidth);
        // newCanvas.setAttribute("height", LmikaPolycanvas.canvasHeight);
        newCanvas.addEventListener("click", (ev) => {
            this._canvasClick(ev);
        })
        
        this.replaceChild(newCanvas, img);        
        this._canvas = newCanvas;
        
        window.setTimeout(() => {
            // Setting up a resize observer
            if (!!window.ResizeObserver) {
                const resizeObserver = new ResizeObserver((entries) => {
                    for (let entry of entries) {
                        let r = entry.target.getBoundingClientRect();
                        entry.target.width = r.width;
                        entry.target.height = r.width * 1.5;
                    }
                });
                resizeObserver.observe(this._canvas);
            }
            
            let r = this._canvas.getBoundingClientRect();
            this._canvas.width = r.width;
            this._canvas.height = r.width * 1.5;
            this._refreshCanvas();
        }, 0);
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
        case "world":
            let worldConstr = World.worlds[newValue];
            if (worldConstr) {
                this._world = worldConstr(LmikaPolycanvas.canvasWidth, LmikaPolycanvas.canvasHeight);
                this._refreshCanvas();
            }
            break;
        }
    }
    
    exportToDataURL() {
        return this._canvas.toDataURL("image/png");
    }
    
    _refreshCanvas() {
        if ((!this._world) || (!this._canvas)) {
            return;
        }
        
        let ctx = this._canvas.getContext("2d");                
        ctx.clearRect(0, 0, LmikaPolycanvas.canvasWidth, LmikaPolycanvas.canvasHeight);


        // Draw a grid
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#AAA";
        ctx.setLineDash([5, 10]);
        
        for (let x = 50; x <= LmikaPolycanvas.canvasWidth - 50; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, LmikaPolycanvas.canvasHeight);
            ctx.stroke();        
        }
        for (let y = 50; y <= LmikaPolycanvas.canvasHeight - 50; y += 50) {            
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(LmikaPolycanvas.canvasWidth, y + 0.5);
            ctx.stroke();        
        }            
        
        
        let textY = 20;
        let inPolygon = true;
        
        ctx.font = "18px sans-serif";
        ctx.lineCap = "butt";
            
        for (let testVector of this._world.vectors) {
            // Draw the vector
            ctx.lineWidth = 3;
            ctx.strokeStyle = "black";    
            ctx.setLineDash([]);
            
            this._drawVector(ctx, testVector, false, 15);
            
            let testVectorNormal = testVector.normal();
            if (this._world.showSmallNormals) {
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = "grey";
            
                let midpoint = testVector.withMagnitude(testVector.magnitude()/2);
                let displayNormal = testVectorNormal
                    .withMagnitude(50)
                    .atOrigin(midpoint.px, midpoint.py);
                
                this._drawVector(ctx, displayNormal, false, 8);                
            } else if (this._world.showNormals) {
                ctx.strokeStyle = "grey";
                let displayNormal = testVectorNormal
                    .withMagnitude(testVectorNormal.magnitude()/2)
                    .atOrigin(testVector.ox, testVector.oy);
                
                this._drawVector(ctx, displayNormal, false, 15);
            }
            
            // Draw the mouse positions (if available)
            if ((!this._world.trackMouse) || (!this._world.hasMousePoint())) {
                continue;
            }
                        
            let mouseVector = this._world.mouseVector(testVector);            
            let dp = mouseVector.dotProduct(testVectorNormal);
            let angle = mouseVector.angle(testVectorNormal);
            let angleDeg = angle * 180 / Math.PI;
            
            ctx.lineWidth = 1.5;
            if ((dp < 0) && (!this._world.arcMonoColour)) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = "blue";
            } else {                
                ctx.strokeStyle = "green";
            }
            this._drawVector(ctx, mouseVector, true, 10);
            
            // Draw arc
            if (this._world.showArcWithLine) {
                this._drawArc(ctx, testVector, mouseVector);
            } else if (this._world.showArcWithNormal) {
                this._drawArc(ctx, testVectorNormal.atOrigin(testVector.ox, testVector.oy), mouseVector);
            }
        
            inPolygon = inPolygon & (dp > 0);
        }
        
        if (this._world.showInPolygon) {
            ctx.fillText(`In polygon? ${inPolygon ? 'yes 👍' : 'no 😞'}`, 8, 20);
        }
    }
    
    _drawVector(ctx, vec, drawCrossHair, arrowheadSize) {
        let theta = Math.atan2(vec.py-vec.oy, vec.px-vec.ox);
        
        ctx.beginPath();
        ctx.moveTo(vec.ox, vec.oy);
        ctx.lineTo(vec.px, vec.py);
        ctx.stroke();
                
        ctx.setLineDash([]);                
        if (drawCrossHair) {
            ctx.beginPath();
            ctx.moveTo(vec.px+arrowheadSize, vec.py);
            ctx.lineTo(vec.px-arrowheadSize, vec.py);
            ctx.lineTo(vec.px, vec.py);
            ctx.lineTo(vec.px, vec.py+arrowheadSize);
            ctx.lineTo(vec.px, vec.py-arrowheadSize);
            ctx.stroke();            
        } else {
            // Arrow-head
            ctx.beginPath();
            ctx.moveTo(vec.px, vec.py);
            ctx.lineTo(
                vec.px-Math.sin(Math.PI  - Math.PI/3 + theta)*arrowheadSize,
                vec.py+Math.cos(Math.PI  - Math.PI/3 + theta)*arrowheadSize
            );
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(vec.px, vec.py);
            ctx.lineTo(
                vec.px-Math.sin(Math.PI/3 + theta)*arrowheadSize,
                vec.py+Math.cos(Math.PI/3 + theta)*arrowheadSize
            );
            ctx.stroke();            
        }
    }
    
    _drawArc(ctx, vec1, vec2) {
        let horiz = (new Vector(0, 0, 1, 0)).atOrigin(vec1.ox, vec1.oy);
        let up = (new Vector(0, 0, 0, -1)).atOrigin(vec1.ox, vec1.oy);
        let dp = vec2.dotProduct(vec1.normal());
        
        let theta1 = this._normalizedAngle(horiz.angle(vec1));
        let theta2 = this._normalizedAngle(horiz.angle(vec2));
         
        if (up.dotProduct(vec1) < 0) {
            theta1 = -theta1;
        }   
        if (up.dotProduct(vec2) < 0) {
            theta2 = -theta2;
        }
        
        ctx.beginPath();
        ctx.moveTo(vec1.ox, vec1.oy);            
        ctx.arc(vec1.ox, vec1.oy, 20, -theta2, -theta1, dp > 0);
        ctx.stroke();
        
        if (this._world.printArcAngle) {
            let angleDeg = Math.abs(this._normalizedAngle(theta2 - theta1)) * 180 / Math.PI;            
            let angleDegInt = (angleDeg)|0;
            
            if (this._world.printDP) {
                ctx.fillText(`Angle = ${angleDegInt}°, Dot Product = ${vec2.dotProduct(vec1)}`, 8, 20);
            } else {
                ctx.fillText(`Angle = ${angleDegInt}°`, 8, 20);
            }
        }
    }
    
    _normalizedAngle(ang) {
        if (ang > Math.PI) {
            while (ang > Math.PI) {
                ang -= 2 * Math.PI;
            }
        } else if (ang < -Math.PI) {
            while (ang < -Math.PI) {
                ang += 2 * Math.PI;                    
            }
        }
        return ang;
    }
    
    _canvasClick(ev) {
        if ((!this._world) || (!this._world.trackMouse)) {
            return;
        }
        ev.preventDefault();
        
        this._world.mouseX = event.offsetX;
        this._world.mouseY = event.offsetY;
        this._refreshCanvas();
    }
}

customElements.define("lmika-polycanvas", LmikaPolycanvas);
