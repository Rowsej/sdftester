precision highp float;

uniform highp vec2 iResolution;
uniform highp float iTime;
uniform int theme;

uniform mediump vec2 translation;
uniform highp float zoom;
uniform highp vec3 iMouse; // xy: mouse coordinates; z: over/not over canvas

uniform sampler2D iFont;

#define FONT_THRESHOLD .4
//#define FONT_THRESHOLD mod(iTime, 10.) / 10.

#define NUMBER_0 0.
#define NUMBER_1 1.
#define NUMBER_2 2.
#define NUMBER_3 3.
#define NUMBER_4 4.
#define NUMBER_5 5.
#define NUMBER_6 6.
#define NUMBER_7 7.
#define NUMBER_8 8.
#define NUMBER_9 9.
#define NUMBER_MINUS_SIGN 10.
#define NUMBER_DECIMAL_PLACE 11.

/*SDFSTART*/
float sdf(vec2 uv) {
	return length(uv) - (.3 + sin(iTime) * .2);
}
/*SDFEND*/

float number(float n, vec2 b, vec2 dims, vec2 p) {
	p = (p - b) / dims;
	if(min(p.x, p.y) < 0. || max(p.x, p.y) > 1.) {
		return 0.;
	}
	p /= vec2(4., 1.);
	p.y = 1. - p.y;
	vec2 offset = vec2(0.);
	if(n > NUMBER_2) {
		offset.x += .25;
	}
	if(n > NUMBER_5) {
		offset.x += .25;
	}
	if(n > NUMBER_8) {
		offset.x += .25;
	}
	vec2 finalP = p + offset;
	vec3 stuffs = texture2D(iFont, finalP).xyz;
	if(n == NUMBER_0 || n == NUMBER_3 || n == NUMBER_6 || n == NUMBER_9) {
		return stuffs.x;
	} else if(n == NUMBER_1 || n == NUMBER_4 || n == NUMBER_7 || n == NUMBER_MINUS_SIGN) {
		return stuffs.y;
	} else {
		return stuffs.z;
	}
}

vec3 themeClassic(vec2 uv, float d, vec4 mouse) {
	//if(mouse.x > 0.) {
		float n = number(/*mod(floor(iTime), 12.)*/ NUMBER_4, mouse.zw, vec2(0.1, 0.2), uv);
		if(n > FONT_THRESHOLD) {
			return vec3(0.);
		}
	//}
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
	
	// Texture testing
	//col = vec3(texture2D(iFont, vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y) / iResolution / vec2(4., 1.)).y);
	
	gl_FragColor = vec4(col, 1.);
}
