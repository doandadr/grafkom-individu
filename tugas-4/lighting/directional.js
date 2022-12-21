"use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var normalLocation = gl.getAttribLocation(program, "a_normal");

  // lookup uniforms
  var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var reverseLightDirectionLocation =
      gl.getUniformLocation(program, "u_reverseLightDirection");

  // Create a buffer to put positions in
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put geometry data into buffer
  setGeometry(gl);

  // Create a buffer to put normals in
  var normalBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  // Put normals data into buffer
  setNormals(gl);

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var translation = [0,0,0];
  var fieldOfViewRadians = degToRad(60);
  var rotationRadians = 0;

  drawScene();

  // Setup a ui.
  webglLessonsUI.setupSlider("#rotation", {value: radToDeg(rotationRadians), slide: updateRotation, min: -360, max: 360});
  webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), min: -200, max: 200});

  function updateRotation(event, ui) {
    rotationRadians = degToRad(ui.value);
    drawScene();
  }
  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }
  // Draw the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the normal attribute
    gl.enableVertexAttribArray(normalLocation);

    // Bind the normal buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floating point values
    var normalize = false; // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        normalLocation, size, type, normalize, stride, offset);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the camera's matrix
    var camera = [100, 150, 200];
    var target = [0, 35, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(camera, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Draw a F at the origin
    var worldMatrix = m4.yRotation(rotationRadians);
    worldMatrix = m4.translate(worldMatrix, translation[0], translation[1], translation[2])

    // Multiply the matrices.
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    var worldInverseMatrix = m4.inverse(worldMatrix);
    var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    // Set the matrices
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

    // Set the color to use
    gl.uniform4fv(colorLocation, [1, 0.1, 0.5, 1]); // green

    // set the light direction.
    gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 24 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

// Fill the buffer with the values that define a letter 'D'.
function setGeometry(gl) {
  var positions = new Float32Array([
          // left column front
        0,   0,  0,
        0, 150,  0,
        30,   0,  0,
        0, 150,  0,
        30, 150,  0,
        30,   0,  0,

        // top rung front
        30,   0,  0,
        30,  30,  0,
        70,   0,  0,
        30,  30,  0,
        70,  30,  0,
        70,   0,  0,

        // right column front
        70,  50,  0,
        70,  100,  0,
        100,  50,  0,
        70,  100,  0,
        100,  100,  0,
        100,  50,  0,

        // top diagonal front
        50,  30,  0,
        70,  60,  0,
        70,  30,  0,
        70,   0,  0,
        70,  50,  0,
        100,  50,  0,

        // bottom diagonal front
        50,  120,  0,
        70,  120,  0,
        70,  90,  0,
        70,  100,  0,
        70,   150,  0,
        100,  100,  0,

        // bottom rung front
        30,  120,  0,
        30,  150,  0,
        70,  150,  0,
        70,  120,  0,
        30,  120,  0,
        70,  150,  0,      

        // left column back
        0,   0,  30,
        30,   0,  30,
        0, 150,  30,
        0, 150,  30,
        30,   0,  30,
        30, 150,  30,

        // top rung back
        30,   0,  30,
        70,   0,  30,
        30,  30,  30,
        30,  30,  30,
        70,   0,  30,
        70,  30,  30,

        // right column back
        70,  50,  30,
        100,  50,  30,
        70,  100,  30,
        70,  100,  30,
        100,  50,  30,
        100,  100,  30,

        
        // top diagonal back
        70,  60,  30,
        50,  30,  30,
        70,  30,  30,
        70,  50,  30,
        70,   0,  30,
        100,  50,  30,

        // bottom diagonal back
        70,  120,  30,
        50,  120,  30,
        70,  90,  30,
        70,   150,  30,
        70,  100,  30,
        100,  100,  30,

        // bottom rung back
        30,  150,  30,
        30,  120,  30,
        70,  150,  30,
        30,  120,  30,
        70,  120,  30,
        70,  150,  30,    

        // top
        0,   0,   0,
        70,   0,   0,
        70,   0,  30,
        0,   0,   0,
        70,   0,  30,
        0,   0,  30,

        // top diagonal right
        70,   0,   0,
        100,  50,   0,
        100,  50,  30,
        70,   0,   0,
        100,  50,  30,
        70,   0,  30,

        // bottom diagonal right
        100,  100,   0,
        70,   150,   0,
        100,  100,  30,
        100,  100,  30,
        70,   150,   0,
        70,   150,  30,

        // under top rung
        30,   30,   0,
        30,   30,  30,
        50,  30,  30,
        30,   30,   0,
        50,  30,  30,
        50,  30,   0,

        // top of bottom rung
        30,   120,   0,
        50,   120,  30,
        30,   120,  30,
        30,   120,   0,
        50,   120,   0,
        50,   120,  30,

        // right of right column
        100,   50,   0,
        100,   100,  30,
        100,   50,   30,
        100,   50,   0,
        100,   100,   0,
        100,   100,  30,

        // right of left column
        30,   30,   0,
        30,  120,  30,
        30,   30,  30,
        30,   30,   0,
        30,  120,   0,
        30,  120,  30,

        // bottom
        0,   150,   0,
        0,   150,  30,
        70,  150,  30,
        0,   150,   0,
        70,  150,  30,
        70,  150,   0,

        // left of left column
        0,   0,   0,
        0,   0,  30,
        0, 150,  30,
        0,   0,   0,
        0, 150,  30,
        0, 150,   0,

        // left of right column
        70,   60,   0,
        70,   60,  30,
        70,   90,  30,
        70,   60,   0,
        70,   90,  30,
        70,   90,   0,        
                
        // top diagonal left
        70,  60,   0,
        50,   30,   0,
        70,  60,  30,
        70,  60,  30,
        50,   30,   0,
        50,   30,  30,

        // bottom diagonal left
        50,   120,   0,
        70,  90,   0,
        70,  90,  30,
        50,   120,   0,
        70,  90,  30,
        50,   120,  30,]);

  // Center the F around the origin and Flip it around. We do this because
  // we're in 3D now with and +Y is up where as before when we started with 2D
  // we had +Y as down.

  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = m4.xRotation(Math.PI);
  matrix = m4.translate(matrix, -50, -75, -15);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function setNormals(gl) {
  var normals = new Float32Array([
        // left column front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // top rung front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        
        // right column front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // top diagonal front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        
        // bottom diagonal front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // bottom rung front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // left column back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        
        // top rung back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // right column back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        
        // top diagonal back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        
        // bottom diagonal back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // bottom rung back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // top
        0, 1, 0,        
        0, 1, 0,        
        0, 1, 0,        
        0, 1, 0,        
        0, 1, 0,        
        0, 1, 0,        

        // top diagonal right
        1, 1, 0,        
        1, 1, 0,        
        1, 1, 0,        
        1, 1, 0,        
        1, 1, 0,        
        1, 1, 0,        

        // bottom diagonal right
        1, -1, 0,
        1, -1, 0,
        1, -1, 0,
        1, -1, 0,
        1, -1, 0,
        1, -1, 0,

        // under top rung
        0, -1, 0,        
        0, -1, 0,        
        0, -1, 0,        
        0, -1, 0,        
        0, -1, 0,        
        0, -1, 0,        

        // top of bottom rung
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        
        // right of right column !!!
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        

        // right of left column !!!
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        1, 0, 0,        
        
        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // left of left column 
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // left of right column
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
                
        // top diagonal left
        -1, -1, 0,
        -1, -1, 0,
        -1, -1, 0,
        -1, -1, 0,
        -1, -1, 0,
        -1, -1, 0,

        // bottom diagonal left
        -1, 1, 0,
        -1, 1, 0,
        -1, 1, 0,
        -1, 1, 0,
        -1, 1, 0,
        -1, 1, 0,
        ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

main();
