"use client"

// From GradFlow, animated WebGL gradients for React: https://gradflow.meerbahadin.dev

import { useEffect, useRef } from "react"

export interface GlassFoldProps {
  /** The body of each glass pane. */
  color1?: string
  /** The background. */
  color2?: string
  /** The lit edges. */
  color3?: string
  /** Animation speed. 0 freezes it. */
  speed?: number
  /** How tightly the folds are packed. Higher is more, smaller folds. */
  scale?: number
  /** Film grain, 0 to 0.5. */
  noise?: number
  className?: string
}

const VERTEX = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAGMENT = `
  precision highp float;
  uniform float u_time;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_scale;
  uniform float u_noise;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float grain(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }

  mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  // Asymmetric, breathing membrane curves form the distinctive glass layers.
  float membrane(float x, float phase, float time) {
    return 0.5
      + 0.145 * sin(x * 5.0 + phase + time * 0.12)
      + 0.052 * sin(x * 10.5 - phase * 1.4 - time * 0.075)
      + 0.018 * sin(x * 19.0 + phase * 0.6 + time * 0.05);
  }

  vec3 shade(vec2 uv, float time) {
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = uv - 0.5;
    p.x *= aspect;
    p *= 1.65 * u_scale;

    float halo = exp(-length(p - vec2(-0.16, 0.02)) * 1.5);
    vec3 color = mix(u_color2, u_color1 * 0.19, halo * 0.82);
    color += u_color1 * 0.045 * exp(-length(p + vec2(0.24, 0.18)) * 2.1);

    // Four offset membranes create an uneven, flowing silhouette.
    vec2 q = rot(-0.24) * p;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float x = q.x + fi * 0.16;
      float phase = fi * 1.73;
      float ridge = membrane(x, phase, time) - 0.5;
      ridge += 0.12 * x + 0.035 * sin(x * 3.2 - time * 0.1 + phase);
      float d = q.y - ridge + (fi - 1.5) * 0.235;
      float body = exp(-abs(d) * (2.8 + fi * 0.12));
      float edge = exp(-abs(d) * 42.0);
      float fineEdge = exp(-pow((abs(d) - 0.027) / 0.012, 2.0));
      float shadow = exp(-pow((d + 0.075) / 0.055, 2.0));
      float sheen = 0.5 + 0.5 * sin(x * 3.6 - time * 0.22 + phase);
      vec3 tint = mix(u_color1, u_color3, 0.16 + 0.26 * sheen);

      color += tint * body * 0.105;
      color += u_color3 * edge * (0.10 + 0.18 * sheen);
      color += mix(u_color1, u_color3, 0.45) * fineEdge * 0.13;
      color *= 1.0 - shadow * 0.075;
    }

    // Fine molecular pathways are embedded in the glass, not pasted on top.
    for (int j = 0; j < 3; j++) {
      float fj = float(j);
      float x = (uv.x - 0.5) * aspect * 1.65 * u_scale;
      float path = membrane(x * 0.8, fj * 2.0 + 0.7, time * 0.75);
      path = (path - 0.5) * 0.82 + 0.24 + (fj - 1.0) * 0.19;
      float d = abs(uv.y - path);
      float filament = exp(-d * u_resolution.y * 0.095);
      float core = exp(-d * u_resolution.y * 0.42);
      float pulseX = fract(0.12 + uv.x * 0.72 - time * (0.045 + fj * 0.012) + fj * 0.29);
      float pulseD = abs(uv.x - pulseX);
      pulseD = min(pulseD, 1.0 - pulseD);
      float pulse = exp(-pulseD * u_resolution.x * 0.045);
      color += u_color3 * filament * (0.025 + pulse * 0.12);
      color += u_color3 * core * pulse * 0.35;
    }

    // Small moving junctions give the pathways a restrained living quality.
    for (int k = 0; k < 5; k++) {
      float fk = float(k);
      float nx = fract(0.11 + fk * 0.187 + time * (0.018 + fk * 0.002));
      float ny = membrane((nx - 0.5) * aspect * 1.32 * u_scale,
        fk * 1.9 + 0.7, time * 0.75);
      ny = (ny - 0.5) * 0.82 + 0.24 + (mod(fk, 3.0) - 1.0) * 0.19;
      vec2 delta = vec2((uv.x - nx) * aspect, uv.y - ny);
      float radius = length(delta);
      color += u_color3 * (exp(-radius * 75.0) * 0.055 + exp(-radius * 360.0) * 0.28);
    }

    vec3 coolHighlight = mix(u_color1, vec3(0.82, 0.87, 1.0), 0.38);
    float glint = pow(max(0.0, sin(q.x * 2.4 - q.y * 1.3 - time * 0.16)), 12.0);
    color += coolHighlight * glint * 0.055;

    if (u_noise > 0.001) {
      float g = grain(uv * 240.0 + time * 0.03);
      color *= 1.0 - u_noise * 0.25 + u_noise * g * 0.25;
    }
    return clamp(color, 0.0, 1.0);
  }

  void main() {
    gl_FragColor = vec4(shade(vUv, u_time), 1.0);
  }

`

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export function GlassFold({
  color1 = "#5465ff",
  color2 = "#050208",
  color3 = "#00ffd4",
  speed = 0.34,
  scale = 1,
  noise = 0.055,
  className,
}: GlassFoldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // the draw loop reads the latest props from here, so changing one never
  // rebuilds the WebGL program
  const props = useRef({ color1, color2, color3, speed, scale, noise })
  props.current = { color1, color2, color3, speed, scale, noise }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false })
    if (!gl) return

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const position = gl.getAttribLocation(program, "position")
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const uniform = (name: string) => gl.getUniformLocation(program, name)
    const u = {
      time: uniform("u_time"),
      color1: uniform("u_color1"),
      color2: uniform("u_color2"),
      color3: uniform("u_color3"),
      scale: uniform("u_scale"),
      noise: uniform("u_noise"),
      resolution: uniform("u_resolution"),
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, width, height)
    }

    let elapsed = 0
    let last: number | null = null
    let frame = 0

    const draw = (now: number) => {
      const p = props.current
      // accumulate speed over time, so changing it never makes the pattern jump
      if (last !== null) elapsed += Math.min((now - last) / 1000, 0.1) * p.speed
      last = now

      resize()
      gl.uniform1f(u.time, elapsed)
      gl.uniform3fv(u.color1, hexToVec3(p.color1))
      gl.uniform3fv(u.color2, hexToVec3(p.color2))
      gl.uniform3fv(u.color3, hexToVec3(p.color3))
      gl.uniform1f(u.scale, p.scale)
      gl.uniform1f(u.noise, p.noise)
      gl.uniform2f(u.resolution, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const loop = (now: number) => {
      draw(now)
      if (!still) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    // with motion off there is no loop, so repaint the still frame on resize
    const observer = new ResizeObserver(() => {
      if (still) draw(performance.now())
    })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  )
}
