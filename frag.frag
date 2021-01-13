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

vec3 themeClassic(vec2 uv, float d, vec4 mouse) {
	if(d < 0. && d > -.02) {
		return vec3(.6, .6, 1.);
	} else if(mouse.x > 0. && ((mouse.y < 0. && mouse.y > -.02) || length(uv - mouse.zw) < .02)) {
		return vec3(.3);
	} else {
		float lineSize = .005;
		float gridSquareSize = .1;
		vec3 bg = vec3(1.);
		if(min(mod(uv.x + lineSize / 2., gridSquareSize), mod(uv.y + lineSize / 2., gridSquareSize)) < lineSize) {
			bg = vec3(.5);
		}
		if(sign(d) == -1.) {
			return mix(bg, vec3(.6, .6, 1.), .5);
		} else if(mouse.x > 0. && sign(mouse.y) == -1.) {
			return mix(bg, vec3(.2), .5);
		} else {
			return bg;
		}
	}
}
vec3 themeIQ(vec2 uv, float d, vec4 mouse) {
	if(mouse.x > 0. && abs(mouse.y) < .01) {
		return vec3(.3);
	} else {
		if(mouse.x > 0.) {
			d = min(d, mouse.y);
		}
		vec3 col = vec3(1.) - sign(d) * vec3(.1, .4, .7);
		col *= 1. - exp(-4. * abs(d));
		col *= .8 + .2 * cos(140. * d);
		col = mix(col, vec3(1.), 1. - smoothstep(0., .015, abs(d)));
		return col;
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
	vec2 actualMouseCoords;
	if(iMouse.z > 0.) {
		actualMouseCoords = iMouse.xy / iResolution - .5;
		actualMouseCoords *= vec2(2., -2.);
		mouseD = length(actualMouseCoords - uv) - sdf(actualMouseCoords);
	}
	vec4 m = vec4(iMouse.z, mouseD, actualMouseCoords);
	vec3 col;
	if(theme == 0) {
		col = themeClassic(uv, d, m);
	} else if(theme == 1) {
		col = themeIQ(uv, d, m);
	}
	//col = .5 + .5 * cos(iTime + uv.xyx + vec3(0., 2., 4.));
	gl_FragColor = vec4(col, 1.);
}
