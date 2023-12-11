import "./style.css";

type ProgramInfo = {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: number;
  };
  uniformLocations: {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
  };
};

type Buffers = {
  position: WebGLBuffer | null;
};

document.querySelector<HTMLDivElement>(
  "#app"
)!.innerHTML = `<canvas id="canvas"></canvas>`;

document.addEventListener("DOMContentLoaded", main);

// Vertex shader program
const vsSource = `
  attribute vec4 aVertexPosition;
  void main(void) {
    gl_Position = aVertexPosition;
  }
`;

const fsSource = `
  precision mediump float;

  uniform vec2 uResolution;
  uniform float uTime;

  vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
  }
  
  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 4.0; i++) {
      uv = fract(uv * 1.5) - 0.5;
      float d = length(uv) * exp(-length(uv0));
      vec3 col = palette(length(uv0) + i * .4 + uTime * .4);
      d = sin(d * 8. + uTime) / 8.;
      d = abs(d);
      d = pow(0.005 / d, 1.2);

      finalColor += col * d;
    }
      
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();

  if (!shaderProgram) {
    throw new Error("No shaderProgram!");
  }

  if (!vertexShader) {
    throw new Error("No vertexShader!");
  }

  if (!fragmentShader) {
    throw new Error("No fragmentShader!");
  }

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("No shader!");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;

  const gl = canvas.getContext("webgl");

  if (!gl) {
    console.error(
      "Unable to initialize WebGL. Your browser may not support it."
    );
    return;
  }

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  if (!shaderProgram) {
    throw new Error("No shaderProgram!");
  }

  const programInfo: ProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      resolution: gl.getUniformLocation(shaderProgram, "uResolution"),
      time: gl.getUniformLocation(shaderProgram, "uTime"),
    },
  };

  const buffers = initBuffers(gl);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(programInfo.program);
  gl.uniform2f(
    programInfo.uniformLocations.resolution,
    canvas.width,
    canvas.height
  );

  let startTime = Date.now();

  function animate() {
    // Calculate elapsed time
    const currentTime = (Date.now() - startTime) / 1000.0;

    if (!gl) {
      throw new Error("No gl!");
    }

    // Pass time value to the fragment shader
    gl.uniform1f(programInfo.uniformLocations.time, currentTime);

    drawScene(gl, programInfo, buffers);

    // Request the next animation frame
    requestAnimationFrame(animate);
  }

  // drawScene(gl, programInfo, buffers)
  animate();
}

function initBuffers(gl: WebGLRenderingContext) {
  const positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  buffers: Buffers
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
