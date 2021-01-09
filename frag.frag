precision mediump float;
uniform vec2 screenRes;
uniform float iTime;

void main(void) {
	vec2 uv = gl_FragCoord.xy / screenRes;
	/*vec3 col = vec3(.6, .4, .2);
	if(uv.x < .2) {
		col = vec3(1., 0., 0.);
	}*/
	vec3 col = 0.5 + 0.5*cos(uv.xyx+vec3(0.,2.,4.));
	gl_FragColor = vec4(col, 1.);
}