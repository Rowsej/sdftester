attribute vec2 coords;

void main(void) {
	gl_Position = vec4(coords, 0., 1.);
}