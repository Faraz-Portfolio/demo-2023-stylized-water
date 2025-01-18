export default /* glsl */ `
vec3 RGBToHSV(vec3 rgb) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 P = mix(vec4(rgb.bg, K.wz), vec4(rgb.gb, K.xy), step(rgb.b, rgb.g));
    vec4 Q = mix(vec4(P.xyw, rgb.r), vec4(rgb.r, P.yzx), step(P.x, rgb.r));
    float D = Q.x - min(Q.w, Q.y);
    float E = 1.0e-10;
    return vec3(abs(Q.z + (Q.w - Q.y)/(6.0 * D + E)), D / (Q.x + E), Q.x);
}

vec3 HSVToRGB(vec3 hsv) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 P = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    return hsv.z * mix(K.xxx, saturate(P - K.xxx), hsv.y);
}

vec4 HSVLerp(vec4 A, vec4 B, float T) {
    A.xyz = RGBToHSV(A.xyz);
    B.xyz = RGBToHSV(B.xyz);

    float t = T; // used to mix alpha, needs to remain unchanged

    float hue;
    float d = B.x - A.x; // hue difference

    if(A.x > B.x) {
        float temp = B.x;
        B.x = A.x;
        A.x = temp;

        d = -d;
        T = 1.0 - t;
    }

    if(d > 0.5) {
        A.x = A.x + 1.0;
        hue = mod((A.x + t * (B.x - A.x)), 1.0);
    }

    if(d <= 0.5) hue = A.x + t * d;

    float sat = A.y + t * (B.y - A.y);
    float val = A.z + t * (B.z - A.z);
    float alpha = A.w + t * (B.w - A.w);

    vec3 rgb = HSVToRGB(vec3(hue,sat,val));
    
    return vec4(rgb, alpha);
}

`;
