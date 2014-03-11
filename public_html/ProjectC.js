//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw torus & ground plane in the 3D scene (makeTorus(), makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +  	// Inverse Transpose of ModelMatrix;
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
  '  vec3 normal = normalize(a_Normal.xyz);\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
  
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
var ANGLE_STEP = 45.0;
var currentAngle = 0;

var ROBOT_STEP = 45.0;
var current_step=0;

var u_ProjMatrix;
var u_ViewMatrix;
var viewMatrix = new Matrix4();;

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
var Z_STEP=0;

var g_EyeX = 0.0, g_EyeY = -3.25, g_EyeZ = 0.15; 
//var g_CenterX = 0.0,g_CenterY = -2.25, g_CenterZ = 0.15;
var g_CenterX = 0.0,g_CenterY = -0.71163, g_CenterZ = 0.71274;


var g_UpX = 0.0, g_UpY = 0.0, g_UpZ = 1.0;
var g_Teta = 0; 
var g_UpDown = 0;


// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   

function main() {
//==============================================================================
  // Retrieve <canvas> element
  
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex infromation');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }

  // Create the matrix to specify the view matrix
  
  // Register the event handler to be called on key press
 document.onkeydown = function(ev){ doKeyDown(ev); };
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  					// when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
											// when the mouse moves, call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  
 
	// (Note that I eliminated the 'n' argument (no longer needed)).
	
  // Create the matrix to specify the viewing volume and pass it to u_ProjMatrix
  var projMatrix = new Matrix4();
  // REPLACE this orthographic camera matrix:
  //pyramid sunxw
  
    projMatrix.setOrtho(-1.0, 1.0, 					// left,right;
  										-1.0, 1.0, 					// bottom, top;
  										-20.0, 2000.0);				// near, far; (always >=0)
	// with this perspective-camera matrix:
	// (SEE PerspectiveView.js, Chapter 7 of book)

//  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);

  // YOU TRY IT: make an equivalent camera using matrix-cuon-mod.js
  // perspective-camera matrix made by 'frustum()' function..
  
	// Send this matrix to our Vertex and Fragment shaders through the
	// 'uniform' variable u_ProjMatrix:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


    // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    current_step = animateStep(current_step);
    winResize();
    // report current angle on console
    //console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, canvas);   
    									// Request that the browser re-draw the webpage
  };
  tick();	
  
  //winResize();
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
	canvas.height = innerHeight*19/20;
        setOrthProjective(localGl);
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
        Y_STEP = Y_STEP-0.01
    }
    else if(e==38){
        Y_STEP = Y_STEP+0.01
    }
    else if(e==37){
        X_STEP = X_STEP - 0.01;
    }
    else if(e==39){
        X_STEP = X_STEP + 0.01;
    }
      else if(e==78){
        Z_STEP = Z_STEP - 0.01;
    }
    else if(e==77){
        Z_STEP = Z_STEP + 0.01;
    }
    else if(e==79){//
        Flg_OP = 0;
    }
    else if(e==80){
        Flg_OP = 1;
    }
    else if(e==65){
        g_EyeX = g_EyeX - 0.02;
        g_CenterX = g_CenterX - 0.02;
        //setVectorsForLookAt();
    }
    else if(e==68){
        g_EyeX = g_EyeX + 0.02;
        g_CenterX = g_CenterX + 0.02;
        //setVectorsForLookAt();
    }
     else if(e==87){
        g_EyeY = g_EyeY + 0.02;
        g_CenterY = g_CenterY + 0.02;
        //setVectorsForLookAt();
    }
      else if(e==83){
        g_EyeY = g_EyeY - 0.02;
        g_CenterY = g_CenterY - 0.02;
        //setVectorsForLookAt();
    }
    
     else if(e==82){
        g_EyeZ = g_EyeZ + 0.02;
        g_CenterZ = g_CenterZ + 0.02;
        //setVectorsForLookAt();
    }
      else if(e==70){
        g_EyeZ = g_EyeZ - 0.02;
        g_CenterZ = g_CenterZ - 0.02;
        //setVectorsForLookAt();
    }
    
    else if(e==74){
       xyRotateAngle += 0.5;
        xyRotateAngle %= 360;
        // console.log(xyRotateAngle);
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        // console.log(xyLookRadius);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        // console.log(g_LookX, g_LookY, g_LookZ);
        
      
                 
    }
      else if(e==76){
          xyRotateAngle -= 0.5;
        xyRotateAngle %= 360;
        // console.log(xyRotateAngle);
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        // console.log(xyLookRadius);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        // console.log(g_LookX, g_LookY, g_LookZ);
    }
     else if (e == 73) { // The up arrow key was pressed
        zRotateAngle -= 0.5;
        zRotateAngle %= 360;
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        var zLookRadius = lookRadius * Math.sin(zRotateAngle / 180 * Math.PI);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        g_CenterZ = g_EyeZ - zLookRadius;
    }
         else if (e == 75) { // The up arrow key was pressed
        zRotateAngle += 0.5;
        zRotateAngle %= 360;
        var xyLookRadius = lookRadius * Math.cos(zRotateAngle / 180 * Math.PI);
        var zLookRadius = lookRadius * Math.sin(zRotateAngle / 180 * Math.PI);
        g_CenterX = g_EyeX - xyLookRadius * Math.sin(xyRotateAngle / 180 * Math.PI);
        g_CenterY = g_EyeY + xyLookRadius * Math.cos(xyRotateAngle / 180 * Math.PI);
        g_CenterZ = g_EyeZ - zLookRadius;
    }
    
}

function setOrthProjective(gl){
	// (Note that I eliminated the 'n' argument (no longer needed)).
	
  // Create the matrix to specify the viewing volume and pass it to u_ProjMatrix
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(40, canvas.width/canvas.height,1, 100);		
                       
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
}


function initVertexBuffers(gl) {
//==============================================================================

	// make our 'forest' of triangular-shaped trees:
   // Make our 'ground plane' and 'torus' shapes too:
   
   cubeVerts  =  makeCube();
   pyramidVerts =  makePyramid();
   cylVerts = makeCylinder();
   smallSphereVerts = makeSmallSphere();
   largeSphereVerts = makeLargeSphere();
   semiSphereVerts = makeSemiSphere();
   doubleSphereVerts = makeDoubleSphere();
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
                + doubleSphereVerts.length
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
         
         doubleSphereStart = i;
         for(j=0; j< doubleSphereVerts.length; i++,j++) {verticesColors[i] = doubleSphereVerts[j];} 
         
         axesStart = i;
         for(j=0; j< axesVerts.length; i++,j++) {verticesColors[i] = axesVerts[j];} 
         
         gndStart = i;	
         for(j=0; j< gndVerts.length; i++, j++) {verticesColors[i] = gndVerts[j];}


        // Create a buffer object
        var vertexColorbuffer = gl.createBuffer();  
        if (!vertexColorbuffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }

        // Write vertex information to buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

        var FSIZE = verticesColors.BYTES_PER_ELEMENT;
        // Assign the buffer object to a_Position and enable the assignment
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if(a_Position < 0) {
          console.log('Failed to get the storage location of a_Position');
          return -1;
        }

        gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 7, 0);
        gl.enableVertexAttribArray(a_Position);
        // Assign the buffer object to a_Color and enable the assignment
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if(a_Color < 0) {
          console.log('Failed to get the storage location of a_Color');
          return -1;
        }

        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4);
        gl.enableVertexAttribArray(a_Color);

        return mySiz/floatsPerVertex;	// return # of vertices
}


// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.

function draw(gl) {
//==============================================================================
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  /** Draw in the FOURTH of several 'viewports'**/
  //Draw first, becasue I do not want the change of view and projection matrixe affects the other 3 fixed view.
  
  gl.viewport(0,  	// Viewport lower-left corner
	      0, 													// location(in pixels)
              gl.drawingBufferWidth, 		// viewport width, height.
              gl.drawingBufferHeight);
  // but use a different 'view' matrix:
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, // eye position
  		       g_CenterX, g_CenterY, g_CenterZ, 		// look-at point 
  		       g_UpX, g_UpY,g_UpZ);		// up vector
  //resetOrthFor1To3();
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  // Draw the scene:
  drawMyScene(gl, u_ViewMatrix, viewMatrix);
}

function drawMyScene(myGL) {
    //===============================================================================
    // Called ONLY from within the 'draw()' function
    // Assumes already-correctly-set View matrix and Proj matrix; 
    // draws all items in 'world' coords.
    pushMatrix(viewMatrix);
    drawGrid(myGL);


    viewMatrix = popMatrix();
    pushMatrix(viewMatrix);
    drawAxes(myGL);
    
    /*
     viewMatrix = popMatrix();
    pushMatrix(viewMatrix);
    drawCube(myGL);
    */
    viewMatrix = popMatrix();
    pushMatrix(viewMatrix);
    drawPyramid(myGL);
    
    viewMatrix = popMatrix();
    pushMatrix(viewMatrix);
    drawCH4(myGL);
    
    /*
    viewMatrix = popMatrix();
    pushMatrix(viewMatrix);
    drawDoubleSphere(myGL);
   */
    viewMatrix = popMatrix();
    pushMatrix(viewMatrix);
    drawAndroid(myGL);
    
}

function drawGrid(myGL){
   
   // viewMatrix.rotate(-90.0, 1,0,0);	// new one has "+z points upwards",    viewMatrix.translate(0.0, 0.0, -0.6);	
    viewMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes 
    myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices
                                                        
}

function drawAxes(myGL){
    viewMatrix.scale(0.3,0.3,2);
    myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							axesStart/floatsPerVertex,	// start at this vertex number, and
  							2);		// draw this many vertices
    
    myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							axesStart/floatsPerVertex + 2,	// start at this vertex number, and
  							2);		// draw this many vertices
   
   myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
   myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							axesStart/floatsPerVertex + 4,	// start at this vertex number, and
  							2);		// draw this many vertices
   
}

function drawCube(myGL){
  // NEXT, create different drawing axes, and...
  viewMatrix.translate(-0.7, 0.6, 0.70);  // 'set' means DISCARD old matrix,
  viewMatrix.scale(0.15, 0.15, 0.15);
  viewMatrix.rotate(currentAngle, 0,0,1);
                                                
  pushMatrix(viewMatrix);                                                
  viewMatrix.rotate(45, 1, 0, 0);  // Spin on XY diagonal axis
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 0,36);
  
  //second cube
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix);  
  viewMatrix.rotate(45, 0, 1, 0);  // Spin on XY diagonal axis
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 36,36);
  
  viewMatrix = popMatrix();
  viewMatrix.rotate(45, 0, 0, 1);  // Spin on XY diagonal axis
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, 72,36);
  
}


function drawPyramid(myGL){
  viewMatrix.translate(0, 0.6, 0.0);  
  viewMatrix.rotate(currentAngle, 0, 0, 1);
  viewMatrix.scale(0.4, 0.4,0.4);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, pyramidStart/floatsPerVertex,	
                                  pyramidVerts.length/floatsPerVertex);
  
  //second pyramid    
  viewMatrix.rotate(120, 0, 0, 1);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, pyramidStart/floatsPerVertex,	
                                  pyramidVerts.length/floatsPerVertex);
 //third pyramid  
  viewMatrix.rotate(120, 0, 0, 1);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES, pyramidStart/floatsPerVertex,	
                                  pyramidVerts.length/floatsPerVertex);
                                  
}

function drawCH4(myGL){
    var lenKey = 10;
    viewMatrix.translate(0.6, 0.4, 0.3);
  viewMatrix.scale(0.05, 0.05, 0.05);
  //viewMatrix.rotate(currentAngle, 0, 0, 1);
  
  //z=squr 6 /12
  //viewMatrix  = popMatrix();
  //viewMatrix.translate(0.0, 0.0, 0.204*lenKey);  // spin around y axis.
   myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							largeSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							largeSphereVerts.length/floatsPerVertex);	// draw this many vertices.

   //squr 3 /3  
   pushMatrix(viewMatrix); 
   viewMatrix.translate(0.0, 0.0, -0.204*lenKey);
   viewMatrix.translate(0.577*lenKey, 0.0, 0.0);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
    /*The second H*/ 																				// to match WebGL display canvas.
  viewMatrix  = popMatrix();
  pushMatrix(viewMatrix); 				// if you DON'T scale, cyl goes outside the CVV; clipped!
 //-squr 3 /6,  y=1/2
 viewMatrix.translate(0.0, 0.0, -0.204*lenKey);
 viewMatrix.translate(-0.289 * lenKey, 0.5*lenKey, 0);  // spin around y axis.
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.

  /*The third H*/ 																				// to match WebGL display canvas.
  viewMatrix  = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(0.0, 0.0, -0.204*lenKey);
  viewMatrix.translate(-0.289*lenKey, -0.5*lenKey, 0);  // spin around y axis.
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
  
  
   viewMatrix  = popMatrix();
  pushMatrix(viewMatrix); 
   //The fourth H r=squr 6 /4
  viewMatrix.translate(0.0, 0.0, 0.612*lenKey);  // spin around y axis.
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //first cylinder
  viewMatrix  = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(0.0, 0.0, 1.5);
  viewMatrix.scale(0.81, 0.81, 2.8);
  						// if you DON'T scale, cyl goes outside the CVV; clipped!
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  						cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //second cylinder
  viewMatrix  = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.rotate(109.5, 0,1, 0);
  viewMatrix.translate(0.0, 0.0, 1.5);
  viewMatrix.scale(0.81, 0.81, 2.8);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //third cylinder
  viewMatrix  = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.rotate(120, 0,0, 1);
  viewMatrix.rotate(109.5, 0,1, 0);
  viewMatrix.translate(0.0, 0.0, 1.5);
  viewMatrix.scale(0.81, 0.81, 2.8);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  //fourth cylinder
  viewMatrix  = popMatrix();
  viewMatrix.rotate(-120, 0,0, 1);
  viewMatrix.rotate(109.5, 0,1, 0);
  viewMatrix.translate(0.0, 0.0, 1.5);
  viewMatrix.scale(0.81, 0.81, 2.8);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
                                                        
}


function drawDoubleSphere(myGL){
    //--------Draw Spinning Sphere
  viewMatrix.translate( -0.6, -0.8, 0.2); // 'set' means DISCARD old matrix,
  viewMatrix.rotate(currentAngle, 0, 1, 0);
  
  viewMatrix.scale(0.2, 0.2, 0.2);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							doubleSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							doubleSphereVerts.length/floatsPerVertex);	// draw this many vertices.
  
}


function drawAndroid(myGL){
    //modelMatrix.setScale(0.1, 0.1, 0.1);
    viewMatrix.translate( X_STEP, Y_STEP-0.4, Z_STEP+0.5);
  viewMatrix.rotate(180, 0, 1, 0);
  
  viewMatrix.scale(0.6, 0.6, 0.6);
  pushMatrix(viewMatrix); 
  
  //body
  viewMatrix.scale(1.2, 1.0, 0.2);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //leg1
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(0.15, 0.0, 0.3);
  viewMatrix.rotate(current_step, 1, 0, 0);
  viewMatrix.scale(0.2, 0.2, 0.2);
  
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
   //leg2
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(-0.15, 0.0, 0.3);
  viewMatrix.rotate(-current_step, 1, 0, 0);
  viewMatrix.scale(0.2, 0.2, 0.2);
  
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  
  //arm
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(-0.3, 0.0, 0.0);
  viewMatrix.scale(0.2, 0.2, 0.15);
  viewMatrix.rotate(current_step, 1, 0, 0);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 
  viewMatrix.translate(0.0, 0.0, 2.0);
  //viewMatrix.scale(0.2, 0.2, 0.15);
  viewMatrix.rotate(current_step+1, 1, 0, 0);
   viewMatrix.scale(0.8, 0.8, 0.6);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 

  viewMatrix.translate(0.0, 0.0, 2.0);
  //viewMatrix.scale(0.2, 0.2, 0.15);
  viewMatrix.rotate(current_step+1, 1, 0, 0);
   viewMatrix.scale(0.7, 0.7, 0.4);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 

  //another arm
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(0.3, 0.0, 0.0);
  viewMatrix.scale(0.2, 0.2, 0.15);
  viewMatrix.rotate(-current_step, 1, 0, 0);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.

  viewMatrix.translate(0.0, 0.0, 2.0);
  //viewMatrix.scale(0.2, 0.2, 0.15);
  viewMatrix.rotate(-current_step-1, 1, 0, 0);
   viewMatrix.scale(0.8, 0.8, 0.6);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 
 
 
 
 viewMatrix.translate(0.0, 0.0, 2.0);
  //viewMatrix.scale(0.2, 0.2, 0.15);
  viewMatrix.rotate(current_step+1, 1, 0, 0);
   viewMatrix.scale(0.7, 0.7, 0.4);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.
 


 
viewMatrix.scale( 8.2, 8.2,20.0);
 drawAxes(myGL);
  //head
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.translate(0.0, 0.0, -0.05);			
  viewMatrix.scale(0.23, 0.20, 0.20);				// shrink by 10X:
  viewMatrix.rotate(180,1,0,0);				// shrink by 10X:
  viewMatrix.rotate(currentAngle, 0, 0,1);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							semiSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							semiSphereVerts.length/floatsPerVertex);	// draw this many vertices.


 //eye
 viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.rotate(currentAngle, 0, 0,1);
   viewMatrix.translate(0.11, 0.14, -0.15);	
   viewMatrix.scale(0.03, 0.03, 0.03);	
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
    
    
  viewMatrix = popMatrix();
  pushMatrix(viewMatrix); 
  viewMatrix.rotate(currentAngle, 0, 0,1);
   viewMatrix.translate(-0.11, 0.14, -0.15);	
   viewMatrix.scale(0.03, 0.03, 0.03);	
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							smallSphereStart/floatsPerVertex,	// start at this vertex number, and 
  							smallSphereVerts.length/floatsPerVertex);	// draw this many vertices.
    
    
 //antena.
 viewMatrix = popMatrix();
 pushMatrix(viewMatrix); 
 viewMatrix.rotate(currentAngle, 0, 0,1);
 viewMatrix.translate(0.15, 0.0, -0.35);
 viewMatrix.scale(0.06, 0.06, 0.09);
 viewMatrix.rotate(-30,0,1,0);
  myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.

 viewMatrix = popMatrix();
 viewMatrix.rotate(currentAngle, 0, 0,1);
 viewMatrix.translate(-0.15, 0.0, -0.35);
 viewMatrix.scale(0.06, 0.06, 0.09);
 viewMatrix.rotate(30,0,1,0);
 
 myGL.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
 myGL.drawArrays(myGL.TRIANGLE_STRIP,				// use this drawing primitive, and
  							cylStart/floatsPerVertex, // start at this vertex number, and
  							cylVerts.length/floatsPerVertex);	// draw this many vertices.

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
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
 var capVerts =10;	// # of vertices around the topmost 'cap' of the shape
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
			cylVerts[j+4]=0.49; 
			cylVerts[j+5]=0.82; 
			cylVerts[j+6]=0.0;
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
                        
			cylVerts[j+4]=0.27; 
			cylVerts[j+5]=0.27; 
			cylVerts[j+6]=0.12;			
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
				cylVerts[j+4]=0.49; 
			cylVerts[j+5]=0.82; 
			cylVerts[j+6]=0.0;			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] = 0.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=0.27; 
			cylVerts[j+5]=0.27; 
			cylVerts[j+6]=0.12;		
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
			cylVerts[j+4]=0.49; 
			cylVerts[j+5]=0.82; 
			cylVerts[j+6]=0.0;		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =0.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=0.27; 
			cylVerts[j+5]=0.27; 
			cylVerts[j+6]=0.12;
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
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=0.2; 
				sphVerts[j+5]=0.48; 
				sphVerts[j+6]=0.72;	
				}
			else if(s==slices-1) {
				sphVerts[j+4]=0.2; 
				sphVerts[j+5]=0.48; 
				sphVerts[j+6]=0.72;
			}
			else {
						sphVerts[j+4]=0.2; 
				sphVerts[j+5]=0.48; 
				sphVerts[j+6]=0.72;				
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
				sphVerts[j  ] = 1.5*sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = 1.5*sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = 1.5*cos0;		
				sphVerts[j+3] = 1.0;			
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = 1.5*sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = 1.5*sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = 1.5*cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
                                
				sphVerts[j+4]=0.0; 
				sphVerts[j+5]=0.0; 
				sphVerts[j+6]=0.0;	
				}
			else if(s==slices-1) {
				sphVerts[j+4]=0.0; 
				sphVerts[j+5]=0.0; 
				sphVerts[j+6]=0.0;	
			}
			else {
					sphVerts[j+4]=1.0;// equColr[0]; 
					sphVerts[j+5]=0.0;// equColr[1]; 
					sphVerts[j+6]=0.0;// equColr[2];					
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
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
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
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=0.49;  
				sphVerts[j+5]=0.82;
				sphVerts[j+6]=0;
				}
			else if(s==slices-1) {
					sphVerts[j+4]=0.49;  
				sphVerts[j+5]=0.82;
				sphVerts[j+6]=0;	
			}
			else {
						sphVerts[j+4]=0.49;  
				sphVerts[j+5]=0.82;
				sphVerts[j+6]=0;					
			}
		}
	}
        
        return sphVerts;
}

function makeDoubleSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 100;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 100;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  var sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex * 2);
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
		for(v=isFirst; v< (2*sliceVerts-isLast)/2; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;			
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
                        
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0]; 
				sphVerts[j+5]=topColr[1]; 
				sphVerts[j+6]=topColr[2];	
				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0]; 
				sphVerts[j+5]=botColr[1]; 
				sphVerts[j+6]=botColr[2];	
			}
			else {
					sphVerts[j+4]=Math.random();// equColr[0]; 
					sphVerts[j+5]=Math.random();// equColr[1]; 
					sphVerts[j+6]=Math.random();// equColr[2];					
			}
                        
		}
	}
        
        
        
        
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
				sphVerts[j  ] = 0.5*sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = 0.5*sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = 0.5*cos0;		
				sphVerts[j+3] = 1.0;			
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = 0.5*sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = 0.5*sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = 0.5*cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=1.0; 
				sphVerts[j+5]=0; 
				sphVerts[j+6]=0;	
				}
			else if(s==slices-1) {
				sphVerts[j+4]=1.0; 
				sphVerts[j+5]=0; 
				sphVerts[j+6]=0;	
			}
			else {
					sphVerts[j+4]=1.0; 
				sphVerts[j+5]=0; 
				sphVerts[j+6]=0;;					
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
 