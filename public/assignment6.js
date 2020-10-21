const RED_HEX = "#FF0000"
const RED_RGB = webglUtils.hexToRgb(RED_HEX)
const BLUE_HEX = "#0000FF"
const BLUE_RGB = webglUtils.hexToRgb(BLUE_HEX)
const GREEN_HEX = "#00FF00"
const GREEN_RGB = webglUtils.hexToRgb(GREEN_HEX)

const RECTANGLE = "RECTANGLE"
const TRIANGLE = "TRIANGLE"
const CIRCLE = "CIRCLE"
const STAR = "STAR"
const CUBE = "CUBE"


const up = [0, 1, 0]
let target = [0, 0, 0]
let lookAt = true
let camera = {translation: {x: 0, y: 0, z: 10},rotation: {x: 0, y: 0, z: 0}}

const origin = {x: 0, y: 0, z: 0}
const sizeOne = {width: 1, height: 1, depth: 1}
let shapes = [
  {
    type: RECTANGLE,
    position: origin,
    dimensions: sizeOne,
    color: BLUE_RGB,
    translation: {x: -15, y:  0, z: -20},
    scale:       {x:  10, y: 10, z:  10},
    rotation:    {x:   0, y:  0, z:   0}
  },
  {
    type: TRIANGLE,
    position: origin,
    dimensions: sizeOne,
    color: RED_RGB,
    translation: {x: 15, y:  0, z: -20},
    scale:       {x: 10, y: 10, z:  10},
    rotation:    {x:  0, y:  0, z: 180}
  },
  {
    type: CUBE,
    position: origin,
    dimensions: sizeOne,
	color: GREEN_RGB,
    translation: {x: -15, y: -15, z: -75},
    scale:       {x:   1, y:   1, z:   1},
    rotation:    {x:   0, y:  45, z:   0},
  }
]

let gl
let attributeCoords
let uniformMatrix
let uniformColor
let bufferCoords

const init = () => {
  webglUtils.selectShape(0)

  const canvas = document.querySelector("#canvas");
  gl = canvas.getContext("webgl");

  canvas.addEventListener(
    "mousedown",
    webglUtils.doMouseDown,
    false);

  const program = webglUtils.createProgramFromScripts(gl, "#vertex-shader-3d", "#fragment-shader-3d");
  gl.useProgram(program);

  // get reference to GLSL attributes and uniforms
  attributeCoords = gl.getAttribLocation(program, "a_coords");
  const uniformResolution = gl.getUniformLocation(program, "u_resolution");
  uniformColor = gl.getUniformLocation(program, "u_color");
  
  uniformMatrix = gl.getUniformLocation(program, "u_matrix");

  // initialize coordinate attribute
  gl.enableVertexAttribArray(attributeCoords);

  // initialize coordinate buffer
  bufferCoords = gl.createBuffer();

  // configure canvas resolution
  gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  document.getElementById("tx").onchange = event => webglUtils.updateTranslation(event, "x");
  document.getElementById("ty").onchange = event => webglUtils.updateTranslation(event, "y");
  document.getElementById("tz").onchange = event => webglUtils.updateTranslation(event, "z")

  document.getElementById("sx").onchange = event => webglUtils.updateScale(event, "x");
  document.getElementById("sy").onchange = event => webglUtils.updateScale(event, "y");
  document.getElementById("sz").onchange = event => webglUtils.updateScale(event, "z")

  document.getElementById("rx").onchange = event => webglUtils.updateRotation(event, "x")
  document.getElementById("ry").onchange = event => webglUtils.updateRotation(event, "y")
  document.getElementById("rz").onchange = event => webglUtils.updateRotation(event, "z");

  document.getElementById("fv").onchange = event => webglUtils.updateFieldOfView(event)

  document.getElementById("color").onchange = event => webglUtils.updateColor(event);
    
  document.getElementById("lookAt").onchange = event => webglUtils.toggleLookAt(event)
  document.getElementById("ctx").onchange = event => webglUtils.updateCameraTranslation(event, "x")
  document.getElementById("cty").onchange = event => webglUtils.updateCameraTranslation(event, "y")
  document.getElementById("ctz").onchange = event => webglUtils.updateCameraTranslation(event, "z")
  document.getElementById("crx").onchange = event => webglUtils.updateCameraRotation(event, "x")
  document.getElementById("cry").onchange = event => webglUtils.updateCameraRotation(event, "y")
  document.getElementById("crz").onchange = event => webglUtils.updateCameraRotation(event, "z")
  document.getElementById("ltx").onchange = event => webglUtils.updateLookAtTranslation(event, 0)
  document.getElementById("lty").onchange = event => webglUtils.updateLookAtTranslation(event, 1)
  document.getElementById("ltz").onchange = event => webglUtils.updateLookAtTranslation(event, 2)

  document.getElementById("lookAt").checked = lookAt
  document.getElementById("ctx").value = camera.translation.x
  document.getElementById("cty").value = camera.translation.y
  document.getElementById("ctz").value = camera.translation.z
  document.getElementById("crx").value = camera.rotation.x
  document.getElementById("cry").value = camera.rotation.y
  document.getElementById("crz").value = camera.rotation.z
}

let selectedShapeIndex = 0

const render = () => {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
  gl.vertexAttribPointer(
    attributeCoords,
    3,           // size = 3 floats per vertex
    gl.FLOAT,    // type = gl.FLOAT; i.e., the data is 32bit floats
    false,       // normalize = false; i.e., don't normalize the data
    0,           // stride = 0; ==> move forward size * sizeof(type)
    // each iteration to get the next position
    0);          // offset = 0; i.e., start at the beginning of the buffer
	
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;
  let cameraMatrix = m4.identity()
  let viewProjectionMatrix = m4.identity()

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
	
 const $shapeList = $("#object-list")
 $shapeList.empty()
 shapes.forEach((shape, index) => {
   const $li = $(`
    <li>
		<button onclick="webglUtils.deleteShape(${index})">
			Delete
		</button>
		<input
			type="radio"
			id="${shape.type}-${index}"
			name="shape-index"
			${index === selectedShapeIndex ? "checked": ""}
			onclick="webglUtils.selectShape(${index})"
			value="${index}"/>
		<label>
			${shape.type};
			X: ${shape.translation.x};
			Y: ${shape.translation.y}
		</label>
    </li>
 `)
 $shapeList.append($li)})

  
  if(lookAt) {
        cameraMatrix = m4.translate(
            cameraMatrix,
            camera.translation.x,
            camera.translation.y,
            camera.translation.z)
        const cameraPosition = [
            cameraMatrix[12],
            cameraMatrix[13],
            cameraMatrix[14]]
        cameraMatrix = m4.lookAt(
            cameraPosition,
            target,
            up)
        cameraMatrix = m4.inverse(cameraMatrix)
	} else {
    cameraMatrix = m4.zRotate(
        cameraMatrix,
        m4.degToRad(camera.rotation.z));
    cameraMatrix = m4.xRotate(
        cameraMatrix,
        m4.degToRad(camera.rotation.x));
    cameraMatrix = m4.yRotate(
        cameraMatrix,
        m4.degToRad(camera.rotation.y));
    cameraMatrix = m4.translate(
        cameraMatrix,
        camera.translation.x,
        camera.translation.y,
        camera.translation.z);
	}
	
	const projectionMatrix = m4.perspective(
        fieldOfViewRadians, aspect, zNear, zFar)
    viewProjectionMatrix = m4.multiply(
        projectionMatrix, cameraMatrix)

  shapes.forEach(shape => {
    gl.uniform4f(uniformColor,
      shape.color.red,
      shape.color.green,
      shape.color.blue, 1);
	
	let M = computeModelViewMatrix(shape, viewProjectionMatrix)
	gl.uniformMatrix4fv(uniformMatrix, false, M)

    if(shape.type === RECTANGLE) {
      webglUtils.renderRectangle(shape)
    } else if(shape.type === TRIANGLE) {
      webglUtils.renderTriangle(shape)
    } else if(shape.type === CIRCLE) {
	  renderCircle(shape)
	} else if(shape.type === STAR) {
	  renderStar(shape)
	} else if(shape.type === CUBE) {
	  webglUtils.renderCube(shape)
	}
  })
  
  //Needed because I was experiencing a glitch where deleting the last shape
  // deleted it from the array but not the render
  if(shapes.length === 0){
	gl.clear(gl.COLOR_BUFFER_BIT);
  }
}

let fieldOfViewRadians = m4.degToRad(60)


const computeModelViewMatrix = (shape, viewProjectionMatrix) => {
 M = m4.translate(viewProjectionMatrix,
                                 shape.translation.x,
                                 shape.translation.y,
                                 shape.translation.z)
 M = m4.xRotate(M, m4.degToRad(shape.rotation.x))
 M = m4.yRotate(M, m4.degToRad(shape.rotation.y))
 M = m4.zRotate(M, m4.degToRad(shape.rotation.z))
 M = m4.scale(M, shape.scale.x, shape.scale.y, shape.scale.z)
 return M
}


const renderCircle = (circle) => {
	let coordinates = []
	const degreeStep = 8
	const degreeRadians = degreeStep * Math.PI / 180
			
	for (let degrees = 0; degrees < 360; degrees+=degreeStep){
		const radians = degrees * Math.PI / 180;
		const x1 = Math.sin(radians)
		const y1 = Math.cos(radians)
		const x2 = Math.sin(radians + degreeRadians)
		const y2 = Math.cos(radians + degreeRadians)
		coordinates.push(0)
		coordinates.push(0)
		coordinates.push(0)
		coordinates.push(x2)
		coordinates.push(y2)
		coordinates.push(0)
		coordinates.push(x1)
		coordinates.push(y1)
		coordinates.push(0)
	}

	var Fpoints = new Float32Array(coordinates);
	const Cverticies = Fpoints.length / 3

	gl.bufferData(gl.ARRAY_BUFFER, Fpoints, gl.STATIC_DRAW);
	gl.drawArrays(gl.TRIANGLES, 0, Cverticies);
}

const renderStar = (star) => {
	let coordinates = []
	const degreeStep = 72
	const degreeRadians = degreeStep * Math.PI / 180
			
	for (let degrees = 0; degrees < 360; degrees+=degreeStep){
		const radians = degrees * Math.PI / 180;
		const x1 = -Math.sin(radians)
		const y1 = -Math.cos(radians)
		const x2 = -.3 * Math.cos(radians)
		const y2 = .3 * Math.sin(radians)
		const x3 = .3 * Math.cos(radians)
		const y3 = -.3 * Math.sin(radians)
		coordinates.push(x1)
		coordinates.push(y1)
		coordinates.push(0)
		coordinates.push(x3)
		coordinates.push(y3)
		coordinates.push(0)
		coordinates.push(x2)
		coordinates.push(y2)
		coordinates.push(0)
	}

	var Fpoints = new Float32Array(coordinates);
	const Sverticies = Fpoints.length / 3
	
	console.log(Sverticies)

	gl.bufferData(gl.ARRAY_BUFFER, Fpoints, gl.STATIC_DRAW);
	gl.drawArrays(gl.TRIANGLES, 0, Sverticies);
}

