precision highp float;

uniform highp vec2 iResolution;
uniform highp float iTime;
uniform int theme;

uniform mediump vec2 translation;
uniform highp float zoom;
uniform highp vec3 iMouse;

/*SDFSTART*/
float sdf(vec2 uv) {
	return length(uv) - (.3 + sin(iTime) * .2);
}
/*SDFEND*/

void themeClassic(out vec3 col, vec2 uv, float d, vec2 mouse) {
	if(mouse.x > 0. && abs(mouse.y) < .01) {
		col = vec3(.3);
	} else {
		if(abs(d) < .01) {
			col = vec3(.6, .6, 1.);
		} else {
			float lineSize = .005;
			float gridSquareSize = .1;
			vec3 bg = vec3(1.);
			if(min(mod(uv.x + lineSize / 2., gridSquareSize), mod(uv.y + lineSize / 2., gridSquareSize)) < lineSize) {
				bg = vec3(.5);
			}
			if(sign(d) == -1.) {
				col = mix(bg, vec3(.6, .6, 1.), .5);
			} else {
				col = bg;
			}
		}
	}
}
void themeIQ(out vec3 col, vec2 uv, float d, vec2 mouse) {
	if(mouse.x > 0. && abs(mouse.y) < .01) {
		col = vec3(.3);
	} else {
		if(mouse.x > 0.) {
			d = min(d, mouse.y);
		}
		col = vec3(1.) - sign(d) * vec3(.1, .4, .7);
		col *= 1. - exp(-4. * abs(d));
		col *= .8 + .2 * cos(140. * d);
		col = mix(col, vec3(1.), 1. - smoothstep(0., .015, abs(d)));
	}
}

void main(void) {
	iTime; // I dunno but for some reason I need to reference this for it to work
	
	float mind = min(iResolution.x, iResolution.y);
	vec2 uv = gl_FragCoord.xy / mind * 2. - 1.;
	uv -= (iResolution - mind) / mind;
	
	uv -= translation;
	uv /= zoom;
	
	float d = sdf(uv);
	float mouseD = 0.;
	if(iMouse.z > 0.) {
		vec2 actualMouseCoords = iMouse.xy / iResolution - .5;
		actualMouseCoords *= vec2(2., -2.);
		mouseD = length(actualMouseCoords - uv) - sdf(actualMouseCoords);
	}
	vec3 col;
	if(theme == 0) {
		themeClassic(col, uv, d, vec2(iMouse.z, mouseD));
	} else if(theme == 1) {
		themeIQ(col, uv, d, vec2(iMouse.z, mouseD));
	}
	/*if(iMouse.z > 0.) {
		vec2 actualMouseCoords = iMouse.xy / iResolution - .5;
		actualMouseCoords *= vec2(2., -2.);
		float mouseD = length(actualMouseCoords - uv) - sdf(actualMouseCoords);
		if(mouseD < 0.) {
			col = vec3(.7);
		}
	}*/
	//col = .5 + .5 * cos(iTime + uv.xyx + vec3(0., 2., 4.));
	gl_FragColor = vec4(col, 1.);
}
