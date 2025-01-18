export default /* glsl */ `
vec4 Overwrite(vec4 Base, vec4 Blend, float Opacity) {
    return mix(Base, Blend, Opacity);
}

vec4 LinearDodge(vec4 Base, vec4 Blend, float Opacity) {
    vec4 Out = Base + Blend;
    Out = mix(Base, Out, Opacity);
    return Out;
}
`;
