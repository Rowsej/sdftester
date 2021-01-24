//"use strict";

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
function compile(shader) {
	var startT = performance.now();
	gl.compileShader(shader);
	var elapsed = performance.now() - startT;
	
	var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	console.log("Compiled: " + compiled);
	hasCompiledEl.innerHTML = "<span class='" + (compiled? "green" : "red") + "'>" + compiled + "</span>";
	
	console.log("Compilation time: " + elapsed);
	compilationTimeEl.innerHTML = displayTimeInMillis? elapsed + "ms" : (elapsed / 1000).toFixed(2) + "s";
	
	var compilation = gl.getShaderInfoLog(shader);
	console.log("Shader log: " + compilation);
	compilationNotesEl.innerText = compilation.length? compilation : "<none>";
	if(compilationNotesEl.innerText != "<none>") {
		compilationNotesEl.innerHTML = "<span class='red'>" + compilationNotesEl.innerHTML + "</span>";
	}
	return compiled;
}

var can, gl;
var vertCode, fragCode;
var sp, il, compiled;
var translation = [0, 0], zoom = 1;
var mouse = [0, 0, 0];
var editor;
var texture;
var themeSwitch, theme = 0;
var pixelatedNumsEl;
var iTime = 0, startTime = 0, timeEl, displayTimeInMillis = false;
var restartBtn, playPauseBtn, play = true;
var fpsEl, lastFramerateCheckTime = 0, frames = 0;
var editorFontSizeInput;
var hasCompiledEl, compilationTimeEl, compilationNotesEl;
var runBtn;
window.addEventListener("load", () => {
	can = selectEl("canvas");
	can.onmouseenter = function() {
		mouse[2] = 1;
		console.log("mouseenter");
	}
	can.onmousemove = function(e) {
		var box = can.getBoundingClientRect();
		var x = (e.pageX - box.x) / box.width * can.width;
		var y = (e.pageY - box.y) / box.height * can.height;
		mouse[0] = x;
		mouse[1] = y;
		if(!play) {
			animate();
		}
		console.log("mousemove", [mouse[0], mouse[1]]);
	};
	can.onmouseleave = function() {
		mouse[2] = 0;
		if(!play) {
			animate();
		}
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
		startTime = performance.now() - iTime;
		if(!play) {
			animate();
		}
	});
	pixelatedNumsEl = selectEl("#pixelatedEl");
	pixelatedNumsEl.addEventListener("change", () => {
		var y = pixelatedNumsEl.checked;
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, y? gl.NEAREST : gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, y? gl.NEAREST : gl.LINEAR);
	});
	timeEl = selectEl("#timeEl");
	timeEl.addEventListener("click", () => {
		displayTimeInMillis = !displayTimeInMillis;
		startTime = performance.now() - iTime;
		if(!play) {
			animate();
		}
	});
	restartBtn = selectEl("#restartBtn");
	restartBtn.addEventListener("click", () => {
		startTime = performance.now();
		if(!play) {
			animate();
		}
	});
	playPauseBtn = selectEl("#playPauseBtn");
	playPauseBtn.addEventListener("click", () => {
		playPauseBtn.innerHTML = (play = !play)? "&#9208;" : "&#9654;";
		if(play) {
			startTime = performance.now() - iTime;
			animate();
		}
	});
	fpsEl = selectEl("#fpsEl");
	editorFontSizeInput = selectEl("#editorFontSizeInput");
	editorFontSizeInput.addEventListener("input", () => {
		editor.setOption("fontSize", editorFontSizeInput.value + "px");
	});
	hasCompiledEl = selectEl("#hasCompiledEl");
	compilationTimeEl = selectEl("#compilationTimeEl");
	compilationNotesEl = selectEl("#compilationNotesEl");
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
	editor.setOption("fontSize", "16px");
	
	// The font texture!!
	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	var defaultPixel = new Uint8Array([0, 0, 0, 255]);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, defaultPixel);
	var img = new Image();
	img.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		
		// Settings??
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	};
	img.onerror = function() {
		console.log("Aww, snap! The font texture failed to load.");
		
	};
	img.src = "font.png";
	
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
	
	var compiled = compile(fs);
	play == play && compiled;
	if(!compiled) {
		return;
	}
	
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
	if(play) {
		updateEls();
	}
	
	passAttr(sp, "2f", "iResolution", [can.width, can.height]);
	passAttr(sp, "1f", "iTime", iTime / 1000);
	passAttr(sp, "1i", "theme", theme);
	
	passAttr(sp, "2f", "translation", translation);
	passAttr(sp, "1f", "zoom", zoom);
	passAttr(sp, "3f", "iMouse", mouse);
	
	gl.drawElements(gl.TRIANGLES, il, gl.UNSIGNED_SHORT, 0);
	
	if(play) {
		window.requestAnimationFrame(animate);
	}
}
function updateEls() {
	iTime = performance.now() - startTime;
	timeEl.innerHTML = displayTimeInMillis? ~~iTime + "ms" : (iTime / 1000).toFixed(2) + "s";
	
	frames++;
	var n = performance.now();
	var t = n - lastFramerateCheckTime;
	if(t > 500) {
		fpsEl.innerHTML = (frames / t * 1000).toFixed(2) + " FPS";
		frames = 0;
		lastFramerateCheckTime = n;
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
	
	var compiled = compile(fs);
	play == play && compiled;
	if(!compiled) {
		return;
	}
	
	// Shader program
	sp = null;
	sp = gl.createProgram();
	gl.attachShader(sp, vs);
	gl.attachShader(sp, fs);
	gl.linkProgram(sp);
	gl.useProgram(sp);
}
