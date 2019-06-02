import {Matrix3, Matrix4} from "../matrix";
import {Canvas, ImageSource} from "./canvas";

const positionAttributesName = "a_position",
  texcoordAttributesName = "a_texcoord",
  transformMatrixName = "u_transformMatrix",
  textureMatrixName = "u_textureMatrix";

const vertexShaderSource = `
  attribute vec4 ${positionAttributesName};
  attribute vec2 ${texcoordAttributesName};
  uniform mat4 ${transformMatrixName};
  uniform mat4 ${textureMatrixName};
  varying vec2 v_texcoord;
  void main() {
     gl_Position = ${transformMatrixName} * ${positionAttributesName};
     v_texcoord = (${textureMatrixName} * vec4(${texcoordAttributesName}, 0, 1)).xy;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;
  void main() {
     gl_FragColor = texture2D(u_texture, v_texcoord);
  }
`;

/**
 * An implementation for transforming and exporting images using WebGL
 * This implementation is adapted from {@link https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html}
 */
export class CanvasWebGL extends Canvas<Matrix3 | Matrix4> {

  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly positionBuffer: WebGLBuffer | null;
  private readonly textureBuffer: WebGLBuffer | null;

  constructor(width: number, height: number) {
    super(width, height);

    const gl = this.getCanvas().getContext("webgl");
    if (!gl) {
      throw new Error("Could not load WebGL rendering context");
    }
    this.gl = gl;

    // Setup GL program
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error("Could not create WebGL program");
    }
    this.program = program;

    // Attach shaders and link
    this.attachShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    this.attachShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    this.gl.linkProgram(this.program);

    // Check the link status
    const linked = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
    if (!linked) {
      const error = this.gl.getProgramInfoLog(this.program);
      this.gl.deleteProgram(this.program);
      throw new Error("Error linking program: " + error);
    }

    // Create two triangles filling up a unit square drawing area
    const triangles = [
      0, 0, 0, 1, 1, 0,
      1, 0, 0, 1, 1, 1
    ];

    // Create buffers
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);

    this.textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);

    // Setup the attributes to pull data from our buffers
    const positionAttributesLocation = this.gl.getAttribLocation(this.program, positionAttributesName);
    const textureAttributesLocation = this.gl.getAttribLocation(this.program, texcoordAttributesName);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(positionAttributesLocation);
    this.gl.vertexAttribPointer(positionAttributesLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureBuffer);
    this.gl.enableVertexAttribArray(textureAttributesLocation);
    this.gl.vertexAttribPointer(textureAttributesLocation, 2, this.gl.FLOAT, false, 0, 0);

  }

  private attachShader(shaderSource: string, shaderType: number) {
    // Create the shader object
    const shader = this.gl.createShader(shaderType);
    if (!shader) {
      throw new Error("Could not create Shader");
    }

    // Compile the shader
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);

    // Check the compile status
    const compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!compiled) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error("Error compiling shader: " + error);
    }

    this.gl.attachShader(this.program, shader);
  }

  protected doDrawImage(image: ImageSource, customTransform: Matrix3 | Matrix4 | null | undefined,
    srcX: number, srcY: number, srcWidth: number, srcHeight: number,
    dstX: number, dstY: number, dstWidth: number, dstHeight: number) {
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error("Failed to create texture");
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Assume that the image size is not a power of 2
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

    // Bind the image to the texture
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

    // Tell WebGL to use the shader program pair
    this.gl.useProgram(this.program);

    // Look up where the data needs to go
    const transformMatrixLocation = this.gl.getUniformLocation(this.program, transformMatrixName);
    const texMatrixLocation = this.gl.getUniformLocation(this.program, textureMatrixName);

    // The canvas dimensions are 2x2 units, with the texture placed in the upper right quadrant:
    // Translate according to the requested offset (including an additional unit to center on the canvas) and then
    // scale according to the requested (absolute) dimensions (including an inverted y-axis)
    let transformMatrix = Matrix4
      .diagonal([2 * dstWidth / this.getCanvas().width, -2 * dstHeight / this.getCanvas().height, 1, 1])
      .addTranslation(2 * dstX / this.getCanvas().width - 1, -2 * dstY / this.getCanvas().height + 1, 0);

    if (customTransform) {
      // Apply the custom transformation, if any
      if (customTransform instanceof Matrix3) {
        customTransform = customTransform.toMatrix3D();
      }
      transformMatrix = transformMatrix.multiply(customTransform);
    }

    // Set the output transformation matrix
    this.gl.uniformMatrix4fv(transformMatrixLocation, false, new Float32Array(transformMatrix.values));

    // Get the texture view by first moving to the requested origin and then scaling to the appropriate dimensions
    const texMatrix = Matrix4
      .diagonal([srcWidth / image.width, srcHeight / image.height, 1, 1])
      .addTranslation(srcX / image.width, srcY / image.height, 0);

    // Set the texture matrix
    this.gl.uniformMatrix4fv(texMatrixLocation, false, new Float32Array(texMatrix.values));

    // Draw the quad (2 triangles, 6 vertices)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.gl.deleteTexture(texture);
  }

  destroy() {
    const shaders = this.gl.getAttachedShaders(this.program);
    if (shaders) {
      shaders.forEach(shader => this.gl.deleteShader(shader));
    }

    this.gl.deleteBuffer(this.positionBuffer);
    this.gl.deleteBuffer(this.textureBuffer);
    this.gl.deleteProgram(this.program);

    super.destroy();
  }
}
