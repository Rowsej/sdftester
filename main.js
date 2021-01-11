window.onerror = function() {
	console.error(...[arguments]);
};
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
	if(!loc) {
		console.log("could not find that thingy " + name);
		return;
	}
	var thing = `uniform${dataType}`;
	if(stuffs instanceof Array) {
		gl[thing](loc, ...stuffs);
	} else {
		gl[thing](loc, stuffs);
	}
	//console.log("passed thingy " + name + " as " + stuffs);
}

var can, gl;
var vertCode, fragCode;
var sp, il, compiled;
var translation = [0, 0], zoom = 1;
var mouse = [0, 0, 0];
var editor;
var themeSwitch, theme = 0;
var runBtn;
window.addEventListener("load", () => {
	can = selectEl("canvas");
	can.onmouseenter = function() {
		mouse[2] = 1;
		console.log("mouseenter");
	}
	can.onmousemove = function(e) {
		var box = can.getBoundingClientRect();
		var x = e.pageX - box.x;
		var y = e.pageY - box.y;
		mouse[0] = x;
		mouse[1] = y;
		console.log("mousemove", [mouse[0], mouse[1]]);
	};
	can.onmouseleave = function() {
		mouse[2] = 0;
		console.log("mouseleave");
	};
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
	
	themeSwitch = selectEl("#themeSwitch");
	themeSwitch.addEventListener("change", () => {
		theme = themeSwitch.value;
	});
	runBtn = selectEl("#runBtn");
	runBtn.addEventListener("click", () => {
		run();
	});
});

function start() {
	// The Ace Editor stuffs
	editor = ace.edit("editor");
	editor.setTheme("ace/theme/pastel_on_dark");
	editor.session.setMode("ace/mode/glsl");
	
	// The quad
	var verts = [
		-1., -1., 0.,
		-1., 1., 0.,
		1., -1., 0.,
		1., 1., 0.
	];
	var indices = [0, 1, 2, 1, 2, 3];
	il = indices.length;
	
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
	
	compiled = gl.getShaderParameter(fs, gl.COMPILE_STATUS);
	console.log("Compiled: " + compiled);
	var compilation = gl.getShaderInfoLog(fs);
	console.log("Shader log: " + compilation);
	if(!compiled) return;
	
	// Shader program
	sp = gl.createProgram();
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
	
	// Drawing!
	gl.clearColor(1., 1., 1., 1.);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0, 0, can.width, can.height);
	animate();
}
function animate() {
	passAttr(sp, "2f", "iResolution", [can.width, can.height]);
	passAttr(sp, "1f", "iTime", performance.now() / 1000);
	passAttr(sp, "1i", "theme", theme);
	
	passAttr(sp, "2f", "translation", translation);
	passAttr(sp, "1f", "zoom", zoom);
	passAttr(sp, "3f", "iMouse", mouse);
	
	gl.drawElements(gl.TRIANGLES, il, gl.UNSIGNED_SHORT, 0);
	
	if(compiled) {
		window.requestAnimationFrame(animate);
	}
}
function run() {
	// Update fragment code
	var newCode = fragCode.split("/*SDFSTART*/")[0] + "/*SDFSTART*/";
	newCode += editor.getValue();
	newCode += "/*SDFEND*/" + fragCode.split("/*SDFEND*/")[1];
	fragCode = newCode;
	
	// Vertex shader
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vertCode);
	gl.compileShader(vs);
	
	// Fragment shader
	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, fragCode);
	gl.compileShader(fs);
	
	compiled = gl.getShaderParameter(fs, gl.COMPILE_STATUS);
	console.log("Compiled: " + compiled);
	var compilation = gl.getShaderInfoLog(fs);
	console.log("Shader log: " + compilation);
	if(!compiled) return;
	
	// Shader program
	sp = null;
	sp = gl.createProgram();
	gl.attachShader(sp, vs);
	gl.attachShader(sp, fs);
	gl.linkProgram(sp);
	gl.useProgram(sp);
}
