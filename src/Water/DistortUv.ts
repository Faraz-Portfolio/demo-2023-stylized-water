export default /* glsl */ `
vec2 DistortUv(vec2 uv, float amount) {
    float time = uTime;

    uv.y += amount * 0.01 * (sin(uv.x * 3.5 + time * 0.35) + sin(uv.x * 4.8 + time * 1.05) + sin(uv.x * 7.3 + time * 0.45)) / 3.0;
    uv.x += amount * 0.12 * (sin(uv.y * 4.0 + time * 0.50) + sin(uv.y * 6.8 + time * 0.75) + sin(uv.y * 11.3 + time * 0.2)) / 3.0;
    uv.y += amount * 0.12 * (sin(uv.x * 4.2 + time * 0.64) + sin(uv.x * 6.3 + time * 1.65) + sin(uv.x * 8.2 + time * 0.45)) / 3.0;
    return uv;
}
`;
