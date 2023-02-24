import Konva from "konva";
import { useCallback, useEffect, useMemo, useState } from "react";

enum UniformLocations {
  "effectPower" = "effectPower",
  "centerX" = "centerX",
  "centerY" = "centerY",
  "rotateY" = "rotateY",
  "rotateZ" = "rotateZ",
  "zoom" = "zoom",
}
export const useCreateRealtimePreview = () => {
  const [canvas, setCanvasEle] = useState<HTMLCanvasElement | null>();
  const [effectPower, setEffectPower] = useState(500);
  const [centerX, setCenterX] = useState(500);
  const [centerY, setCenterY] = useState(500);
  const [rotateY, setRotateY] = useState(500);
  const [rotateZ, setRotateZ] = useState(500);
  const [zoom, setZoom] = useState(500);

  const gl = useMemo(() => canvas?.getContext("webgl"), [canvas]);
  const pid = useMemo(() => gl?.createProgram(), [gl]);

  const shader = useCallback(
    (src: string, type: number) => {
      if (!gl || !pid) {
        return;
      }
      const sid = gl.createShader(type);
      if (!sid) {
        return;
      }
      gl.shaderSource(sid, src);
      gl.compileShader(sid);
      gl.attachShader(pid, sid);
    },
    [gl, pid]
  );
  useEffect(() => {
    if (!canvas || !gl || !pid) {
      return;
    }
    shader(
      `
          float perspective = 1.0;          
  
          attribute vec2 coords;
          uniform float rotateY; 
          varying vec2 uv;
  
          void main(void) {
            mat3 rotY = mat3(vec3( cos(rotateY),  0.0, sin(rotateY)), 
                             vec3( 0.0,           1.0,          0.0),
                             vec3( -sin(rotateY), 0.0, cos(rotateY)));
  
            vec3 p =  vec3(coords.xy, 0.) * rotY;
            uv = coords.xy*0.5 + 0.5;   
            gl_Position = vec4(p, 1.0 + p.z * perspective);
          }
      `,
      gl.VERTEX_SHADER
    );

    shader(
      `
        precision highp float;
  
        const vec2 res = vec2(${canvas.width}., ${canvas.height}.);  
        varying vec2 uv;
        uniform float effectPower;
        uniform float centerX;
        uniform float centerY;
        uniform float rotateZ; 
        uniform float zoom; 
        uniform sampler2D texture;
  
        // http://stackoverflow.com/questions/6030814
        void main(void) {
          float prop = res.x / res.y;        
          vec2 center = vec2(centerX, centerY);
          vec2 p = vec2(uv.x,uv.y/prop);     // normalized coords with some cheat (assume 1:1 prop)
          
          vec2 m = vec2(0.5, 0.5 / prop);    // center coords
          vec2 d = p - m;                    // vector from center to current fragment
          float r = sqrt(dot(d, d));         // distance of pixel from center
  
          // amount of effect
          float power = (2.0 * 3.141592 / (2.0 * sqrt(dot(m, m)))) * effectPower; 
  
          float bind;                        // radius of 1:1 effect
          if (power > 0.0) {                 // stick to corners
            bind = sqrt(dot(m, m)); 
          } else {                           // stick to borders
            if (prop < 1.0) bind = m.x; 
            else bind = m.y; 
          } 
  
          vec2 uv = p;                       // no effect for power = 1.0
  
          if (power > 0.0) {                 // fisheye
            uv = m + normalize(d) * tan(r * power) * bind / tan( bind * power);
          } else if (power < 0.0) {          // antifisheye
            uv = m + normalize(d) * atan(r * -power * 10.0) * bind / atan(-power * bind * 10.0);
          }
  
          // shift uv to center
          uv -= vec2(0.5, 0.5/prop); 
  
          // apply rotation
          vec2 sc = vec2( sin(rotateZ), cos(rotateZ) );
          uv *= mat2(sc.y, -sc.x, sc.xy);
  
          // apply zoom
          uv *= zoom+1.; 
  
          // apply shift center
          uv -= center;
  
          // shift uv back from center
          uv += vec2(0.5, 0.5/prop);
  
          // fix uv ???
          //uv.y -= 1./prop;
        
          // Second part of cheat for round effect, not elliptical
          uv = vec2(uv.x, 1.-uv.y * prop);
               
          gl_FragColor = texture2D(texture, uv);
        }
      `,
      gl.FRAGMENT_SHADER
    );
    gl.linkProgram(pid);
    gl.useProgram(pid);

    const array = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

    const al = gl.getAttribLocation(pid, "coords");
    gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(al);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(pid, "texture"), 0);
    const uniforms = {
      [UniformLocations.effectPower]: gl.getUniformLocation(
        pid,
        UniformLocations.effectPower
      )!,
      [UniformLocations.centerX]: gl.getUniformLocation(
        pid,
        UniformLocations.centerX
      )!,
      [UniformLocations.centerY]: gl.getUniformLocation(
        pid,
        UniformLocations.centerY
      )!,
      [UniformLocations.rotateY]: gl.getUniformLocation(
        pid,
        UniformLocations.rotateY
      )!,
      [UniformLocations.rotateZ]: gl.getUniformLocation(
        pid,
        UniformLocations.rotateZ
      )!,
      [UniformLocations.zoom]: gl.getUniformLocation(
        pid,
        UniformLocations.zoom
      )!,
    };
    gl.uniform1f(
      uniforms[UniformLocations.effectPower],
      effectPower / 1000 - 0.5
    );
    gl.uniform1f(uniforms[UniformLocations.centerX], centerX / 1000 - 0.5);
    gl.uniform1f(uniforms[UniformLocations.centerY], centerY / 1000 - 0.5);
    gl.uniform1f(uniforms[UniformLocations.rotateY], rotateY / 1000 - 0.5);
    gl.uniform1f(uniforms[UniformLocations.rotateZ], rotateZ / 1000 - 0.5);
    gl.uniform1f(uniforms[UniformLocations.zoom], zoom / 1000 - 0.5);
  }, [
    canvas,
    centerX,
    centerY,
    effectPower,
    gl,
    pid,
    rotateY,
    rotateZ,
    shader,
    zoom,
  ]);
  const draw = useCallback(() => {
    if (!gl) {
      return;
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [gl]);

  const drawFunctionFisheye = useCallback(
    async (stage: Konva.Stage) => {
      if (!canvas || !gl || !pid) {
        return;
      }
      const image: HTMLCanvasElement = stage.toCanvas();
      canvas.width = image.width;
      canvas.height = image.height;

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );

      draw();
    },
    [canvas, draw, gl, pid]
  );
  return {
    drawFunctionFisheye,
    effectPower,
    setEffectPower,
    zoom,
    setZoom,
    setCanvasEle,
  };
};
