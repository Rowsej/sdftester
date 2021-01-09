const selectEl = document.querySelector.bind(document);
function GET(url, callback) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState == 4) {
			if(this.status == 200) {
				callback(this.response);
			} else {
				console.log(`Oh no! Resource ${url} failed to load!\nError code: ${this.status} ${this.statusText}`);
			}
		}
	};
	req.open("GET", url, true);
	req.send();
}
function passAttr(program, dataType, name, stuffs) {
	var loc = gl.getUniformLocation(program, name);
	var thing = `uniform${dataType}`;
	alert(gl[thing]);
	gl[thing](loc, ...stuffs);
}

var can, gl;
var vertCode, fragCode;
window.addEventListener("load", () => {
	can = selectEl("canvas");
	gl = can.getContext("webgl") || can.getContext("experimental-webgl");
	
	GET("vert.vert", function(t) {
		vertCode = t;
		if(vertCode && fragCode) {
			start();
		}
	});
	GET("frag.frag", function(t) {
		fragCode = t;
		if(vertCode && fragCode) {
			start();
		}
	});
});

function start() {
	//alert(vertCode);
	//alert(fragCode);
	
	// The quad
	var verts = [
		-1., -1., 0.,
		-1., 1., 0.,
		1., -1., 0.,
		1., 1., 0.
	];
	var indices = [0, 1, 2, 1, 2, 3];
	
	// Vertices buffer
	var vb = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vb);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	// Index buffer
	var ib = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	
	// Vertex shader
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vertCode);
	gl.compileShader(vs);
	
	// Fragment shader
	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, fragCode);
	gl.compileShader(fs);
	
	// Shader program
	var sp = gl.createProgram();
	gl.attachShader(sp, vs);
	gl.attachShader(sp, fs);
	gl.linkProgram(sp);
	gl.useProgram(sp);
	
	// Attributes...?
	gl.bindBuffer(gl.ARRAY_BUFFER, vb);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
	var coordsAttr = gl.getAttribLocation(sp, "coords");
	gl.vertexAttribPointer(coordsAttr, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(coordsAttr);
	
	passAttr(sp, "1f", "iTime", 0.0);
	passAttr(sp, "2f", "screenRes", [can.width, can.height]);
	setTimeout(function() {
		passAttr(sp, "1f", "iTime", 1.0);
	}, 2000);
	
	// Drawing!
	gl.clearColor(1., 1., 1., 1.);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0, 0, can.width, can.height);
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
	//gl.drawArrays(gl.TRIANGLES, 0, 3);
}