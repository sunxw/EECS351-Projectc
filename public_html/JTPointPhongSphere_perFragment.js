//23456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//
// PointLightedSphere_perFragment.js (c) 2012 matsuda and kanda
//
// MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin
//		Multiple light-sources: 'lamp0, lamp1, lamp2, etc
//			 RENAME: ambientLight --> lamp0amb, lightColor --> lamp0diff,
//							 lightPosition --> lamp0pos
//		Complete the Phong lighting model: add emissive and specular:
//		--Ke, Ka, Kd, Ks: K==Reflectance; emissive, ambient, diffuse, specular 
//		--    Ia, Id, Is:	I==Illumination:          ambient, diffuse, specular.
//		-- Kshiny: specular exponent for 'shinyness'.
//		-- Implemented Blinn-Phong 'half-angle' specular term (from class)
//
  	// 
  	//		JT:  HOW would we compute the REFLECTED direction R? Which shader
  	//		JT:  HOW would we find the 'view' direction, to the eye? Which shader?
  	//

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
																				// Phong diffuse reflectance.
  'uniform vec4 u_Ke;' + //	Instead, we'll use this 'uniform'
  'uniform vec4 u_Ka;' + 
  'uniform vec4 u_Kd;' + 
  'uniform vec4 u_Ks;' + 
  'uniform float u_Kshiny;' + 
 																				// value for the entire shape
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix;\n' +  	// Inverse Transpose of ModelMatrix;
  																			// (doesn't distort normal directions)
  'varying vec4 v_Ke; \n' +
  'varying vec4 v_Ka; \n' +
  'varying vec4 v_Kd; \n' +
  'varying vec4 v_Ks; \n' +
  'varying float v_Kshiny; \n' +
    
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position & normal in the world coordinate system
     // and then save a 'varying', so that fragment shader will get per-pixel
     // values (interpolated between vertices of our drawing prim. (triangle).
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Ke = u_Ke; \n' + 	// diffuse reflectance
  '  v_Ka = u_Ka; \n' + 	// diffuse reflectance
  '  v_Kd = u_Kd; \n' + 	// diffuse reflectance
  '  v_Ks = u_Ks; \n' + 	// diffuse reflectance
  '  v_Kshiny = u_Kshiny; \n' + 	// diffuse reflectance
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  // first light source:
  'uniform vec3 u_Lamp0Pos;\n' + 			// Phong Illum: position
  'uniform vec3 u_Lamp0Amb;\n' +   		// Phong Illum: ambient
  'uniform vec3 u_Lamp0Diff;\n' +     // Phong Illum: diffuse
  'uniform vec3 u_Lamp0Spec;\n' +			// Phong Illum: specular
  //second light
  'uniform vec3 u_Lamp0Pos1;\n' + 			// Phong Illum: position
  'uniform vec3 u_Lamp0Amb1;\n' +   		// Phong Illum: ambient
  'uniform vec3 u_Lamp0Diff1;\n' +     // Phong Illum: diffuse
  'uniform vec3 u_Lamp0Spec1;\n' +			// Phong Illum: specular
  
  'uniform int u_FixedLightFlg;\n' +			//light flag
  'uniform int u_MoveLightFlg;\n' +                         //light flag
  //
	// YOU write a second one...
//  'uniform vec3 u_Ke;\n' +							// Phong Reflectance: emissive
//  'uniform vec3 u_Ka;\n' +							// Phong Reflectance: ambient
//  'uniform vec3 u_Kd;\n' +							// Phong Reflectance: diffuse
//  'uniform vec3 u_Ks;\n' +							// Phong Reflectance: specular
//  'uniform int u_Kshiny;\n' +						// Phong Reflectance: 1 < shiny < 200	

  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec3 v_Position;\n' +			// and 3D position too -- in 'world' coords
  'varying vec4 v_Ke;	\n' +						// Find diffuse reflectance K_d per pix
  'varying vec4 v_Ka;	\n' +
    'varying vec4 v_Kd;	\n' +
    'varying vec4 v_Ks;	\n' +
    'varying float v_Kshiny;\n' +
  																		// Ambient? Emissive? Specular? almost
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make it 1.0 in length
  '  vec3 lightDirection = normalize(u_Lamp0Pos - v_Position);\n' +
     // The dot product of the light direction and the normal
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
   
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 emissive = vec3(v_Ke.rgb);' +
  '  vec3 ambient = u_Lamp0Amb * v_Ka.rgb;\n' +
  '  vec3 diffuse = u_Lamp0Diff * v_Kd.rgb * nDotL;\n' +
  '  vec3 specular = vec3(0.0,0.0,0.0);\n' +
  '  if (nDotL > 0.0) {\n' +
    '    vec3 reflectVec = reflect(-lightDirection, normal);\n' +
  '    specular = u_Lamp0Spec * v_Ks.rgb * pow(max(dot(reflectVec, normalize(u_Lamp0Pos1)), 0.0),v_Kshiny);\n' +
  '  }\n' +
  
  //light in the head
   '  vec3 lightDirection1 = normalize(u_Lamp0Pos1 - v_Position);\n' +
     // The dot product of the light direction and the normal
  '  float nDotL1 = max(dot(lightDirection1, normal), 0.0);\n' +
   
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 emissive1 = vec3(v_Ke.rgb);' +
  '  vec3 ambient1 = u_Lamp0Amb1 * v_Ka.rgb;\n' +
  '  vec3 diffuse1 = u_Lamp0Diff1 * v_Kd.rgb * nDotL1;\n' +
  '  vec3 specular1 = vec3(0.0,0.0,0.0);\n' +
  '  if (nDotL1 > 0.0) {\n' +
    '    vec3 reflectVec = reflect(-lightDirection1, normal);\n' +
    '    specular1 = u_Lamp0Spec1 * v_Ks.rgb * pow(max(dot(reflectVec, normalize(u_Lamp0Pos1)), 0.0),v_Kshiny);\n' +
  '  }\n' +
  
  '  if (u_FixedLightFlg == 0 && u_MoveLightFlg == 0) {\n' +
    '      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n' +
    '}\n' +
  
    '  if (u_FixedLightFlg == 1 && u_MoveLightFlg == 1) {\n' +
    '     gl_FragColor = vec4(emissive + ambient + diffuse + specular + emissive1 + ambient1 + diffuse1 + specular1, 1.0);\n' +
    '}\n' +

    '  if (u_FixedLightFlg == 1 && u_MoveLightFlg == 0) {\n' +
    '     gl_FragColor = vec4(emissive + ambient + diffuse + specular, 1.0);\n' +
    '}\n' +
    
    '  if (u_FixedLightFlg == 0 && u_MoveLightFlg == 1) {\n' +
    '     gl_FragColor = vec4(emissive1 + ambient1 + diffuse1 + specular1, 1.0);\n' +
    '}\n' +
    
  '}\n';

//pow(max(dot(reflctive, normailize(v_VRP))), 0.0), 

var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
var ANGLE_STEP = 45.0;
var currentAngle = 0;

var ROBOT_STEP = 45.0;
var current_step=0;

var canvas;

var cubeVerts;
var cubeStart;

var pyramidVerts;
var pyramidStart;

var cylVerts;
var cylStart;

var smallSphereVerts;
var smallSphereStart;

var largeSphereVerts;
var largeSphereStart;

var semiSphereVerts;
var semiSphereStart;

var doubleSphereVerts;
var doubleSphereStart;

var axesVerts;
var axesStart;

var gndVerts;
var gndStart;

var X_STEP=0;
var Y_STEP=0;

var X_Light=0;
var Y_Light=0;
var Z_Light=0;

var g_EyeX = 0.0, g_EyeY = -3.25, g_EyeZ = 0.15; 
//var g_CenterX = 0.0,g_CenterY = -2.25, g_CenterZ = 0.15;
var g_CenterX = 0.0,g_CenterY = -0.71163, g_CenterZ = 0.71274;


var g_UpX = 0.0, g_UpY = 0.0, g_UpZ = 1.0;
var g_Teta = 0; 
var g_UpDown = 0;

  // Get the storage locations of uniform variables: for matrices
  var u_ModelMatrix;
  var u_MvpMatrix;
  var u_NormalMatrix;
  
  	
  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
  
// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   

var u_Lamp0Pos;
  var u_Lamp0Amb;
  var u_Lamp0Diff;
  var u_Lamp0Spec;
  
  
var u_Lamp0Pos1;
  var u_Lamp0Amb1;
  var u_Lamp0Diff1;
  var u_Lamp0Spec1;
  
  	// ... for Phong material/reflectance:
	var u_Ke;
	var u_Ka;
	var u_Kd;
	var u_Ks;
	var u_Kshiny;
        
  
  var u_FixedLightFlg;			//light flag
  var u_MoveLightFlg;                         //light flag
  var gl;
  
function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables: for matrices
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_MvpMatrix = gl.getUniformLocation(gl.program, 	'u_MvpMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program,'u_NormalMatrix');
  if (!u_ModelMatrix	|| !u_MvpMatrix || !u_NormalMatrix) {
  	console.log('Failed to get matrix storage locations');
  	return;
  	}
	//  ... for Phong light source:
  u_Lamp0Pos  = gl.getUniformLocation(gl.program, 	'u_Lamp0Pos');
  u_Lamp0Amb  = gl.getUniformLocation(gl.program, 	'u_Lamp0Amb');
  u_Lamp0Diff = gl.getUniformLocation(gl.program, 	'u_Lamp0Diff');
  u_Lamp0Spec	= gl.getUniformLocation(gl.program,		'u_Lamp0Spec');
  if( !u_Lamp0Pos || !u_Lamp0Amb	) {//|| !u_Lamp0Diff	) { // || !u_Lamp0Spec	) {
    console.log('Failed to get the Lamp0 storage locations');
    return;
  }
	// ... for Phong material/reflectance:
	u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
	u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
	u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
	u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
	u_Kshiny = gl.getUniformLocation(gl.program, 'u_Kshiny');
	
	if(!u_Ke || !u_Ka || 
		 !u_Kd 
		 || !u_Ks || !u_Kshiny
		 ) {
		console.log('Failed to get the Phong Reflectance storage locations');
	}

  // Position the first light source in World coords: 

  //gl.uniform3f(u_Lamp0Pos, 50.0, 50.0, 500.0);
	// Set its light output:  
  gl.uniform3f(u_Lamp0Amb, 0.5, 0.5, 0.5);		// ambient
  gl.uniform3f(u_Lamp0Diff, 2, 2, 2);		// diffuse
  gl.uniform3f(u_Lamp0Spec, 0.0, 0.9, 0.0);		// Specular


  
  //sencond light
  u_Lamp0Pos1  = gl.getUniformLocation(gl.program, 	'u_Lamp0Pos1');
  u_Lamp0Amb1  = gl.getUniformLocation(gl.program, 	'u_Lamp0Amb1');
  u_Lamp0Diff1 = gl.getUniformLocation(gl.program, 	'u_Lamp0Diff1');
  u_Lamp0Spec1	= gl.getUniformLocation(gl.program,	'u_Lamp0Spec1');
  
  	// Set its light output:  
  gl.uniform3f(u_Lamp0Amb1, 0.0, 0.0, 0.0);		// ambient
  gl.uniform3f(u_Lamp0Diff1, 2, 2, 2);		// diffuse
  gl.uniform3f(u_Lamp0Spec1, 0.0, 0.9, 0.0);		// Specular

//light flag
u_FixedLightFlg = gl.getUniformLocation(gl.program, 	'u_FixedLightFlg');
  u_MoveLightFlg=gl.getUniformLocation(gl.program, 	'u_MoveLightFlg');
  

  // Register the event handler to be called on key press
 document.onkeydown = function(ev){ doKeyDown(ev); };
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  					// when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
											// when the mouse moves, call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  
  
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
      current_step = animateStep(current_step);
        // Calculate the model matrix
        winResize();
        requestAnimationFrame(tick, canvas);   
    						
  };
  tick();	
}

function winResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

	var localCanvas = document.getElementById('webgl');	// get current canvas
	var localGl = getWebGLContext(localCanvas);							// and context:
	//Make canvas fill the top 3/4 of our browser window:
	//canvas.width = innerWidth*3/4;
        canvas.width = innerWidth*3/4;
	canvas.height = innerHeight*9/10;
        localGl.uniform3f(u_Lamp0Pos, 5.0+X_Light, 8.0+Y_Light, 7.0+Z_Light);
         localGl.uniform3f(u_Lamp0Pos1,g_EyeX, g_EyeY, g_EyeZ);
        draw(localGl);
}

var lookRadius = Math.sqrt((g_EyeX - g_CenterX) * (g_EyeX - g_CenterX) + (g_EyeY - g_CenterY) * (g_EyeY - g_CenterY) + (g_EyeZ - g_CenterY) * (g_EyeZ - g_CenterY));
console.log(lookRadius);
var xyRotateAngle = Math.asin((g_EyeX - g_CenterX) / lookRadius) / Math.PI * 180;
xyRotateAngle %= 360;
console.log(xyRotateAngle);
var zRotateAngle = Math.asin((g_EyeZ - g_CenterZ) / lookRadius) / Math.PI * 180;
zRotateAngle %= 360;

function doKeyDown(event) {
    var e = event.keyCode;
    
    if(e==40){
        Y_Light = Y_Light-5;
    }
    else if(e==38){
        Y_Light = Y_Light+5
    }
    else if(e==37){
        X_Light = X_Light -5;
    }
    else if(e==39){
        X_Light = X_Light +5;
    }
      else if(e==78){
        Z_Light = Z_Light - 5;
    }
    else if(e==77){
        Z_Light = Z_Light + 5;
    }
     else if (e == 68) { // D
        g_EyeX += Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterX += Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        g_EyeY += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterY += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_EyeZ += Math.sin(zRotateAngle / 180 * Math.PI) / 5;
        //g_CenterZ += Math.sin(zRotateAngle / 180 * Math.PI) / 5;
    }
    else if (e == 65) { // A
        g_EyeX -= Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterX -= Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        g_EyeY -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterY -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_EyeZ -= Math.sin(zRotateAngle / 180 * Math.PI) / 5;
        //g_CenterZ -= Math.sin(zRotateAngle / 180 * Math.PI) / 5;
    }
    else if (e == 83) { // S
        g_EyeX += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterX += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_EyeY -= Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterY -= Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        //g_EyeZ += Math.sin(zRotateAngle / 180 * Math.PI) / 5;
        //g_CenterZ += Math.sin(zRotateAngle / 180 * Math.PI) / 5;
    }
    else if (e == 87) { // W
        g_EyeX -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterX -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_EyeY += Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        g_CenterY += Math.cos(xyRotateAngle / 180 * Math.PI) / 5;
        //g_EyeZ -= Math.sin(zRotateAngle / 180 * Math.PI) / 5;
        //g_CenterZ -= Math.sin(zRotateAngle / 180 * Math.PI) / 5;
    }
    else if (e == 70) { // F
        //g_EyeX -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_CenterX -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_EyeY += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_CenterY += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_EyeZ -= Math.cos(zRotateAngle / 180 * Math.PI) / 5;
        g_CenterZ -= Math.cos(zRotateAngle / 180 * Math.PI) / 5;
    }
    else if (e == 82) { // R
        //g_EyeX += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_CenterX += Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_EyeY -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        //g_CenterY -= Math.sin(xyRotateAngle / 180 * Math.PI) / 5;
        g_EyeZ += Math.cos(zRotateAngle / 180 * Math.PI) / 5;
        g_CenterZ += Math.cos(zRotateAngle / 180 * Math.PI) / 5;
    }
    
    else if(e==74){
       xyRotateAngle += 0.8;
        xyRotateAngle %= 360;
        // console.log(xyRotateAngle);
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        // console.log(xyLookRadius);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        // console.log(g_CenterX, g_CenterY, g_CenterZ);
        
      
                 
    }
      else if(e==76){
          xyRotateAngle -= 0.8;
        xyRotateAngle %= 360;
        // console.log(xyRotateAngle);
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        // console.log(xyLookRadius);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        // console.log(g_CenterX, g_CenterY, g_CenterZ);
    }
     else if (e == 73) { // The up arrow key was pressed
        zRotateAngle -= 0.8;
        zRotateAngle %= 360;
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        var zLookRadius = lookRadius * Math.sin(zRotateAngle / 180 * Math.PI);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        g_CenterZ = g_EyeZ - zLookRadius;
    }
         else if (e == 75) { // The up arrow key was pressed
        zRotateAngle += 0.8;
        zRotateAngle %= 360;
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        var zLookRadius = lookRadius * Math.sin(zRotateAngle / 180 * Math.PI);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        g_CenterZ = g_EyeZ - zLookRadius;
    }
    
}

function draw(gl) {
//==============================================================================
  /** Draw in the FOURTH of several 'viewports'**/
  //Draw first, becasue I do not want the change of view and projection matrixe affects the other 3 fixed view.
          // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0,  	// Viewport lower-left corner
                0, 													// location(in pixels)
                gl.drawingBufferWidth, 		// viewport width, height.
                gl.drawingBufferHeight);

 
        drawMyScene(gl);
}

function drawMyScene(myGL) {
    //===============================================================================
    pushMatrix(modelMatrix);
    drawGrid(myGL);


    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    drawPyramid(myGL);
    
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    drawCH4(myGL);
   

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    drawAndroid(myGL);
}


function drawGrid(myGL){
   
   // modelMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",    modelMatrix.translate(0.0, 0.0, -0.6);	
    modelMatrix.setScale(0.4, 0.4,0.4);		// shrink the drawing axes 
    setMatrix(myGL);
    myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices
                                                        
}


function drawPyramid(myGL){
    	// Set the Phong materials' reflectance:
	myGL.uniform4f(u_Ke, 0.0,     0.0,    0.0,    1.0);		// Ke emissive
	myGL.uniform4f(u_Ka,0.1,     0.1,    0.1,    1.0);		// Ka ambient
	myGL.uniform4f(u_Kd, 0.6,     0.0,    0.0,    1.0);		// Kd	diffuse
	myGL.uniform4f(u_Ks, 0.6,     0.6,    0.6,    1.0);		// Ks specular
	myGL.uniform1f(u_Kshiny, 100.0);	
        
  modelMatrix.setTranslate(0, 0.6, 0.2);  
  modelMatrix.rotate(currentAngle, 0, 0, 1);
  modelMatrix.scale(0.4, 0.4,0.4);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLES, pyramidStart/floatsPerVertex,	
                                  pyramidVerts.length/floatsPerVertex);
  
  //second pyramid    
  modelMatrix.rotate(120, 0, 0, 1);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLES, pyramidStart/floatsPerVertex,	
                                  pyramidVerts.length/floatsPerVertex);
 //third pyramid  
  modelMatrix.rotate(120, 0, 0, 1);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLES, pyramidStart/floatsPerVertex,	
                                  pyramidVerts.length/floatsPerVertex);
                                  
}

function drawCH4(myGL){
        	// Set the Phong materials' reflectance:
	myGL.uniform4f(u_Ke, 0.1, 0.1, 0.1,1.0);		// Ke emissive
	myGL.uniform4f(u_Ka, 0.8, 0.8, 0.8,1.0);		// Ka ambient
	myGL.uniform4f(u_Kd, 0.0, 1.0, 0.0, 1.0);		// Kd	diffuse
	myGL.uniform4f(u_Ks, 0.7, 0.7, 0.7,1.0);		// Ks specular
	myGL.uniform1f(u_Kshiny, 100.0);
        
    var lenKey = 10;
    modelMatrix.setTranslate(0.9, 0.2, 0.3);
     modelMatrix.rotate(currentAngle, 0, 0, 1);
  modelMatrix.scale(0.05, 0.05, 0.05);
  //modelMatrix.rotate(currentAngle, 0, 0, 1);
  
  //z=squr 6 /12
  //modelMatrix  = popMatrix();
  //modelMatrix.translate(0.0, 0.0, 0.204*lenKey);  // spin around y axis.
   setMatrix(myGL);
   myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							largeSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							largeSphereVerts.length/floatsPerVertex);	// draw this many vertices.

   //squr 3 /3  
   pushMatrix(modelMatrix); 
   modelMatrix.translate(0.0, 0.0, -0.204*lenKey);
   modelMatrix.translate(0.577*lenKey, 0.0, 0.0);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
    /*The second H*/ 																				// to match WebGL display canvas.
  modelMatrix  = popMatrix();
  pushMatrix(modelMatrix); 				// if you DON'T scale, cyl goes outside the CVV; clipped!
 //-squr 3 /6,  y=1/2
 modelMatrix.translate(0.0, 0.0, -0.204*lenKey);
 modelMatrix.translate(-0.289 * lenKey, 0.5*lenKey, 0);  // spin around y axis.
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.

  /*The third H*/ 																				// to match WebGL display canvas.
  modelMatrix  = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(0.0, 0.0, -0.204*lenKey);
  modelMatrix.translate(-0.289*lenKey, -0.5*lenKey, 0);  // spin around y axis.
  setMatrix(myGL);
   myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
  
  
   modelMatrix  = popMatrix();
  pushMatrix(modelMatrix); 
   //The fourth H r=squr 6 /4
  modelMatrix.translate(0.0, 0.0, 0.612*lenKey);  // spin around y axis.
  setMatrix(myGL);
   myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //first cylinder
  modelMatrix  = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(0.0, 0.0, 1.5);
  modelMatrix.scale(0.81, 0.81, 2.8);
  						// if you DON'T scale, cyl goes outside the CVV; clipped!
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  						cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //second cylinder
  modelMatrix  = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.rotate(109.5, 0,1, 0);
  modelMatrix.translate(0.0, 0.0, 1.5);
  modelMatrix.scale(0.81, 0.81, 2.8);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //third cylinder
  modelMatrix  = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.rotate(120, 0,0, 1);
  modelMatrix.rotate(109.5, 0,1, 0);
  modelMatrix.translate(0.0, 0.0, 1.5);
  modelMatrix.scale(0.81, 0.81, 2.8);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  //fourth cylinder
  modelMatrix  = popMatrix();
  modelMatrix.rotate(-120, 0,0, 1);
  modelMatrix.rotate(109.5, 0,1, 0);
  modelMatrix.translate(0.0, 0.0, 1.5);
  modelMatrix.scale(0.81, 0.81, 2.8);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
        						cylVerts.length/floatsPerVertex);	// draw this many vertices.
                                                        
}


function drawAndroid(myGL){
     	// Set the Phong materials' reflectance:
	myGL.uniform4f(u_Ke,0.0,      0.0,      0.0,      1.0);		// Ke emissive
	myGL.uniform4f(u_Ka,0.25,     0.148,    0.06475,  1.0);		// Ka ambient
	myGL.uniform4f(u_Kd, 0.4,      0.2368,   0.1036,   1.0);		// Kd	diffuse
	myGL.uniform4f(u_Ks, 0.774597, 0.458561, 0.200621, 1.0);		// Ks specular
	myGL.uniform1f(u_Kshiny,  76.8);						// Kshiny shinyness exponent
  
    //modelMatrix.setScale(0.1, 0.1, 0.1);
    //modelMatrix.setTranslate( X_STEP, Y_STEP-0.4, Z_STEP+0.5);
  modelMatrix.setTranslate( -0.9, 0.4, 0.5);
  modelMatrix.rotate(180, 0, 1, 0);
  
  //modelMatrix.scale(0.6, 0.6, 0.6);
  //modelMatrix.scale(1.5, 1.5, 1.5);
  pushMatrix(modelMatrix); 
  
  //body
  modelMatrix.scale(1.2, 1.0, 0.2);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 
  //leg1
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(0.15, 0.0, 0.3);
  modelMatrix.rotate(current_step, 1, 0, 0);
  modelMatrix.scale(0.2, 0.2, 0.2);
  
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
   
   //leg2
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(-0.15, 0.0, 0.3);
  modelMatrix.rotate(-current_step, 1, 0, 0);
  modelMatrix.scale(0.2, 0.2, 0.2);
  
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //arm
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(-0.3, 0.0, 0.0);
  modelMatrix.scale(0.2, 0.2, 0.15);
  modelMatrix.rotate(current_step, 1, 0, 0);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 
  modelMatrix.translate(0.0, 0.0, 2.0);
  //modelMatrix.scale(0.2, 0.2, 0.15);
  modelMatrix.rotate(current_step+1, 1, 0, 0);
   modelMatrix.scale(0.8, 0.8, 0.6);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 

  modelMatrix.translate(0.0, 0.0, 2.0);
  //modelMatrix.scale(0.2, 0.2, 0.15);
  modelMatrix.rotate(current_step+1, 1, 0, 0);
   modelMatrix.scale(0.7, 0.7, 0.4);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 

  //another arm
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(0.3, 0.0, 0.0);
  modelMatrix.scale(0.2, 0.2, 0.15);
  modelMatrix.rotate(-current_step, 1, 0, 0);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.

  modelMatrix.translate(0.0, 0.0, 2.0);
  //modelMatrix.scale(0.2, 0.2, 0.15);
  modelMatrix.rotate(-current_step-1, 1, 0, 0);
   modelMatrix.scale(0.8, 0.8, 0.6);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 
 
 
 
 modelMatrix.translate(0.0, 0.0, 2.0);
  //modelMatrix.scale(0.2, 0.2, 0.15);
  modelMatrix.rotate(current_step+1, 1, 0, 0);
   modelMatrix.scale(0.7, 0.7, 0.4);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
modelMatrix.scale( 8.2, 8.2,20.0);
  //head
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.translate(0.0, 0.0, -0.05);			
  modelMatrix.scale(0.23, 0.20, 0.20);				// shrink by 10X:
  modelMatrix.rotate(180,1,0,0);				// shrink by 10X:
  modelMatrix.rotate(currentAngle, 0, 0,1);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							semiSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							semiSphereVerts.length/floatsPerVertex);	// draw this many vertices.


 //eye
 modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.rotate(currentAngle, 0, 0,1);
   modelMatrix.translate(0.11, 0.14, -0.15);	
   modelMatrix.scale(0.03, 0.03, 0.03);	
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
    
    
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix); 
  modelMatrix.rotate(currentAngle, 0, 0,1);
   modelMatrix.translate(-0.11, 0.14, -0.15);	
   modelMatrix.scale(0.03, 0.03, 0.03);	
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
    
 //antena.
 modelMatrix = popMatrix();
 pushMatrix(modelMatrix); 
 modelMatrix.rotate(currentAngle, 0, 0,1);
 modelMatrix.translate(0.15, 0.0, -0.35);
 modelMatrix.scale(0.06, 0.06, 0.09);
 modelMatrix.rotate(-30,0,1,0);
  setMatrix(myGL);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.

 modelMatrix = popMatrix();
 modelMatrix.rotate(currentAngle, 0, 0,1);
 modelMatrix.translate(-0.15, 0.0, -0.35);
 modelMatrix.scale(0.06, 0.06, 0.09);
 modelMatrix.rotate(30,0,1,0);
 
 setMatrix(myGL);
 myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.

}



function initVertexBuffers(gl) { // Create a sphere


  cubeVerts  =  makeCube();
   pyramidVerts =  makePyramid();
   cylVerts = makeCylinder();
   smallSphereVerts = makeSmallSphere();
   largeSphereVerts = makeLargeSphere();
   semiSphereVerts = makeSemiSphere();
   
   axesVerts = makeAxes();
   
   gndVerts =  makeGroundGrid();

	// How much space to store all the shapes in one array?
	// (no 'var' means this is a global variable)
	var mySiz = pyramidVerts.length 
                + cubeVerts.length 
                + cylVerts.length  
                + smallSphereVerts.length 
                + largeSphereVerts.length 
                + semiSphereVerts.length
                
                + axesVerts.length
                + gndVerts.length;

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
        console.log('cubeVerts.length is', cubeVerts.length);
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

	// Copy all shapes into one big Float32 array:
        var verticesColors = new Float32Array(mySiz);
              // Copy them:  remember where to start for each shape:
        cubeStart = 0;							// we store the forest first.
        for(i=0,j=0; j< cubeVerts.length; i++,j++) {verticesColors[i] = cubeVerts[j];} 
        
         pyramidStart = i;
         for(j=0; j< pyramidVerts.length; i++,j++) {verticesColors[i] = pyramidVerts[j];} 
         
        cylStart = i;
         for(j=0; j< cylVerts.length; i++,j++) {verticesColors[i] = cylVerts[j];} 
         
         smallSphereStart = i;
         for(j=0; j< smallSphereVerts.length; i++,j++) {verticesColors[i] = smallSphereVerts[j];} 
         
         largeSphereStart = i;
         for(j=0; j< largeSphereVerts.length; i++,j++) {verticesColors[i] = largeSphereVerts[j];} 
         
         semiSphereStart=i;
         for(j=0; j< semiSphereVerts.length; i++,j++) {verticesColors[i] = semiSphereVerts[j];} 
         
         
         axesStart = i;
         for(j=0; j< axesVerts.length; i++,j++) {verticesColors[i] = axesVerts[j];} 
         
         gndStart = i;	
         for(j=0; j< gndVerts.length; i++, j++) {verticesColors[i] = gndVerts[j];}
         
         
        
        
  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', verticesColors, gl.FLOAT, 0, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', verticesColors, gl.FLOAT, 4, 3))  return -1;
  
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return mySiz/floatsPerVertex;	// return # of vertices
}

function initArrayBuffer(gl, attribute, data, type, start, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  var FSIZE = data.BYTES_PER_ELEMENT;
  console.log('FFSIZE= ' + FSIZE);
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false,  FSIZE * 7, start);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function setMatrix(gl){
                   
   //
    // Calculate the view projection matrix
    mvpMatrix.setPerspective(40, canvas.width/canvas.height, 1, 100);
    /*
    mvpMatrix.lookAt(0, 0, 6, 				// eye
                     0, 0, 0, 				// aim-point
                     0, 1, 0);				// up.
*/
    mvpMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, // eye position
  		       g_CenterX, g_CenterY, g_CenterZ, 		// look-at point 
  		       g_UpX, g_UpY,g_UpZ);				// up.
    //set the second light 
        
    mvpMatrix.multiply(modelMatrix);
    // Calculate the matrix to transform the normal based on the model matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Pass the model view projection matrix to u_mvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the transformation matrix for normals to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  
}


var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

var g_lastforwalk = Date.now();
function animateStep(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_lastforwalk;
  g_lastforwalk = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >  40.0 && ROBOT_STEP > 0) ROBOT_STEP = ROBOT_STEP * (-1);
  if(angle < -40.0 && ROBOT_STEP < 0) ROBOT_STEP = ROBOT_STEP * (-1);
  
  var newAngle = angle + (ROBOT_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function changeLightParam(paramFlag) {
    
    if (paramFlag == 0) {//fixed light
        if (X_STEP == 0) {
            
            gl.uniform1i(u_FixedLightFlg,  1);	
            X_STEP = 1;
        }else{
            gl.uniform1i(u_FixedLightFlg,  0);	
            X_STEP = 0;
        }
    }else{
        if (Y_STEP == 0) {
            
            gl.uniform1i(u_MoveLightFlg,  1);	
                        Y_STEP = 1;
        }else{
            gl.uniform1i(u_MoveLightFlg,  0);	
                        Y_STEP = 0;
        }
    }
}
/*
function changeLightPos(direction){
    if(direction = 0){
         gl.uniform3f(u_Lamp0Pos, 50.0, 50.0, 500.0);
    }else if(direction = 1){
         gl.uniform3f(u_Lamp0Pos, 50.0, 50.0, 500.0);
         
    }else if(direction = 2){
         gl.uniform3f(u_Lamp0Pos, 50.0, 50.0, 500.0);
    }else if(direction = 3){
         gl.uniform3f(u_Lamp0Pos, 50.0, 50.0, 500.0);
    }
}*/
/*Data*/
function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 500;			// # of lines to draw in x,y to make the grid.
	var ycount = 500;		
	var xymax	= 100.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	var floatsPerVertex = 7;
	// Create an (global) array to hold this ground-plane's vertices:
	var gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
                        gndVerts[j+3] = 1.0;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
                        gndVerts[j+3] = 1.0;									// z
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
                        gndVerts[j+3] = 1.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
                        gndVerts[j+3] = 1.0;									// z
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
        
        
        return gndVerts;
}


function makeCube(){
    // Create a (global) array to hold this cylinder's vertices;
     var cubeVerts = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
/*
 * red cube
*/
    // +x face: 
     1.0, -1.0, -1.0, 1.0,		  1.0,  0.0,  0.0,	// Node 3
     1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 2
     1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,  // Node 4

     1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 4
     1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 7
     1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 3
     
		// +y face: 
    -1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 1
    -1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 5
     1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 4
     
     1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 4
     1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 2 
    -1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 1
     
		// +z face: 
    -1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 5
    -1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 6
     1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 7
     
     1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 7
     1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 4
    -1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 5
     
		// -x face: 
    -1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 6	
    -1.0,  1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 5 
    -1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 1
     
    -1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 1
    -1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 0  
    -1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 6  
     
		// -y face: 
     1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 3
     1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 7
    -1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 6
     
    -1.0, -1.0,  1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 6
    -1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 0
     1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 3
     
     // -z face: 
     1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 2
     1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 3
    -1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 0		
     
    -1.0, -1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 0
    -1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 1
     1.0,  1.0, -1.0, 1.0,	  1.0,  0.0,  0.0,	// Node 2
     
     
/*
 * blue cube
*/
     1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 3
     1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 2
     1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,  // Node 4
     
     1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 4
     1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 7
     1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 3
     
		// +y face: 
    -1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 1
    -1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 5
     1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 4
        
     1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 4
     1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 2 
    -1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 1
        
		// +z face: 
    -1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 5
    -1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 6
     1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 7
        
     1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 7
     1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 4
    -1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 5
                              
		// -x face: 
    -1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 6	
    -1.0,  1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 5 
    -1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 1
                              
    -1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 1
    -1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 0  
    -1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 6  
                              
		// -y face: 
     1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 3
     1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 7
    -1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 6
                              
    -1.0, -1.0,  1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 6
    -1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 0
     1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 3
                              
     // -z face: 
     1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 2
     1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 3
    -1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 0		
                              
    -1.0, -1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 0
    -1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 1
     1.0,  1.0, -1.0, 1.0,	  1.0,  1.0,  0.0,	// Node 2
     
/*
 * yellow cube
*/   
     1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 3
     1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 2
     1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,  // Node 4
                              
     1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 4
     1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 7
     1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 3
                              
		// +y face: 
    -1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 1
    -1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 5
     1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 4
                              
     1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 4
     1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 2 
    -1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 1
                              
		// +z face: 
    -1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 5
    -1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 6
     1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 7
                              
     1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 7
     1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 4
    -1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 5
                              
		// -x face: 
    -1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 6	
    -1.0,  1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 5 
    -1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 1
                              
    -1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 1
    -1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 0  
    -1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 6  
                              
		// -y face: 
     1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 3
     1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 7
    -1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 6
                              
    -1.0, -1.0,  1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 6
    -1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 0
     1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 3
                              
     // -z face: 
     1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 2
     1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 3
    -1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 0		
                              
    -1.0, -1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 0
    -1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0,	// Node 1
     1.0,  1.0, -1.0, 1.0,	  0.0,  0.0,  1.0	// Node 2
 
  ]);
  return cubeVerts;
  
}

function makePyramid(){
     var pyramidVerts = new Float32Array([
			// Face 0: (left side)
     -0.866, -0.5, 0, 1.0,		0.0, 	1.0,	0.0,	// Node 0
     0.0, 0.0, 0.2, 1.0, 		1.0,  0.0,  0.0, 	// Node 1
     -0.16, 0.09, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
			// Face 1: (right side)
    -0.866, -0.5, 0, 1.0,		0.0, 	1.0,	0.0,	// Node 0
     0.0,  -0.184, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    0, 0, 0.2, 1.0,                     1.0,  0.0,  0.0, 	// Node 3
    
    	// back face
    -0.866, -0.5, 0, 1.0,		0.0, 	1.0,	0.0,	// Node 0
     0.0,  -0.184, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
     -0.16, 0.09, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
     
         	// back face
     0.0,  -0.184, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
     -0.16, 0.09, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
     0, 0, 0.2, 1.0,                     1.0,  0.0,  0.0 	// Node 3

  ]);
  return pyramidVerts;
}


function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var capVerts =50;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 0.2;		// radius of bottom of cylinder (top always 1.0)
 var floatsPerVertex = 7;
 // Create a (global) array to hold this cylinder's vertices;
 var cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 2.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
                        
			cylVerts[j+4]=0.0; 
			cylVerts[j+5]=0.0; 
			cylVerts[j+6]=2.0;
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 2.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
                        
			cylVerts[j+4]=botRadius * Math.cos(Math.PI*(v-1)/capVerts);
			cylVerts[j+5]=botRadius * Math.sin(Math.PI*(v-1)/capVerts);
			cylVerts[j+6]=2.0;			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 2.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botRadius * Math.cos(Math.PI*(v)/capVerts); 
			cylVerts[j+5]=botRadius * Math.sin(Math.PI*(v)/capVerts); 
			cylVerts[j+6]=0.0;			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] = 0.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botRadius * Math.cos(Math.PI*(v-1)/capVerts); 
			cylVerts[j+5]=botRadius * Math.sin(Math.PI*(v-1)/capVerts);
			cylVerts[j+6]=0.0;		
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =0.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=botRadius * Math.cos(Math.PI*(v)/capVerts);
			cylVerts[j+5]=botRadius * Math.sin(Math.PI*(v)/capVerts);
			cylVerts[j+6]=0.0;		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =0.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=0.0; 
			cylVerts[j+5]=0.0; 
			cylVerts[j+6]=0.0;
		}
	}
    return cylVerts;
}


function makeSmallSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 20;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 50;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
  var floatsPerVertex = 7;
  
	// Create a (global) array to hold this sphere's vertices:
  var sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;	
                                
                                	sphVerts[j+4]=sin0 * Math.cos(Math.PI*(v)/sliceVerts);
				sphVerts[j+5]=sin0 * Math.sin(Math.PI*(v)/sliceVerts);
				sphVerts[j+6]=cos0;	
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;	
                                
                                	sphVerts[j+4]=sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);
				sphVerts[j+5]=sin1 * Math.sin(Math.PI*(v-1)/sliceVerts); 
				sphVerts[j+6]=cos1;	
                            }
                        
		}
	}
        
        return sphVerts;
}


function makeLargeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 20;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 50;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
   var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
  var floatsPerVertex = 7;
  
	// Create a (global) array to hold this sphere's vertices:
  var sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = 1.5*sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = 1.5*sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = 1.5*cos0;		
				sphVerts[j+3] = 1.0;	
                                
                                sphVerts[j+4]=1.5*sin0 * Math.cos(Math.PI*(v)/sliceVerts); // equColr[0]; 
					sphVerts[j+5]=1.5*sin0 * Math.sin(Math.PI*(v)/sliceVerts);// equColr[1]; 
					sphVerts[j+6]=1.5*cos0;// equColr[2];
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = 1.5*sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = 1.5*sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = 1.5*cos1;																				// z
				sphVerts[j+3] = 1.0;	
                                
                                sphVerts[j+4]=1.5*sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);// equColr[0]; 
					sphVerts[j+5]=1.5*sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);// equColr[1]; 
					sphVerts[j+6]=1.5*cos1;// equColr[2];
			}
		}
	}
        
        return sphVerts;
}


function makeSemiSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 20;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 50;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var sliceAngle = Math.PI/slices/2;	// lattitude angle spanned by one slice.
  var floatsPerVertex = 7;
  
	// Create a (global) array to hold this sphere's vertices:
  var sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;	
                                
                                
                                		sphVerts[j+4]=sin0 * Math.cos(Math.PI*(v)/sliceVerts);   
				sphVerts[j+5]=sin0 * Math.sin(Math.PI*(v)/sliceVerts);
				sphVerts[j+6]=cos0;
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;	
                                
                
                		sphVerts[j+4]=sin1 * Math.cos(Math.PI*(v-1)/sliceVerts); 
				sphVerts[j+5]=sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);
				sphVerts[j+6]=cos1;		
			}
		}
	}
        
        return sphVerts;
}

function makeAxes(){
    // Create a (global) array to hold this cylinder's vertices;
     var axesVerts = new Float32Array([
    // +x face: 
     0.0, 0.0, 0.0, 1.0,	  1.0,  0.0,  0.0,	// Node 3
     1.0,  0.0, 0.0, 1.0,	  1.0,  0.0,  0.0,	// Node 2
     
     0.0,  0.0,  0.0, 1.0,	  1.0,  1.0,  0.0,  // Node 4
     0.0,  1.0, 0.0,  1.0,	  1.0,  1.0,  0.0,	// Node 2
     
     0.0,  0.0,  0.0, 1.0,	  0.0,  0.0,  1.0,  // Node 4
     0.0,  0.0, 0.1,  1.0,	  0.0,  0.0,  1.0   // Node 2
  ]);
  return axesVerts;
     
 }


function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);

};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

};
