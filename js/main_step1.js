//COLORS
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0,
};

// THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer, container;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 100;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

// HANDLE SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}


// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
}


var AirPlane = function(){
	this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";
  
  this.pinkMat = new THREE.MeshLambertMaterial({color: "#F48FB1", shading: THREE.FlatShading,});

  this.holeMat = new THREE.MeshLambertMaterial({color: "#983154", shading: THREE.FlatShading});

  this.whiteMat = new THREE.MeshLambertMaterial({color: "white", shading: THREE.FlatShading});

  this.blackMat = new THREE.MeshLambertMaterial({color: "black", shading: THREE.FlatShading});

  this.nailMat = new THREE.MeshLambertMaterial({color: "#48261a", shading: THREE.FlatShading});
  // Create the Body
	var geomBody = new THREE.BoxGeometry(80,60,60,1,1,1);
  var Body = new THREE.Mesh(geomBody, this.pinkMat);
  Body.castShadow = true;
  Body.receiveShadow = true;
  this.mesh.add(Body);

  // Create Head
  var geomHead = new THREE.BoxGeometry(56,56,40,1,1,1);
  var Head = new THREE.Mesh(geomHead, this.pinkMat);
  Head.position.x = 65;
  Head.position.y = 10;
  Head.castShadow = true;
  Head.receiveShadow = true;
	this.mesh.add(Head);

  //Create Snout
  var geomSnout = new THREE.BoxGeometry(22,12,18,1,1,1);
  var Snout = new THREE.Mesh(geomSnout, this.pinkMat);
  Snout.position.x = 88;
  Snout.position.y = 5;
  Snout.castShadow = true;
  Snout.receiveShadow = true;
	this.mesh.add(Snout);
  
  //Create Hole
  var geomSnout = new THREE.BoxGeometry(1,5,5,1,1,1);
  var leftSnout = new THREE.Mesh(geomSnout, this.holeMat);
  leftSnout.position.set(100,5,-5);
	this.mesh.add(leftSnout);

  var rightSnout = new THREE.Mesh(geomSnout, this.holeMat);
  rightSnout.position.set(100,5,5);
	this.mesh.add(rightSnout);

  // Create EYE
  var geomeye = new THREE.BoxGeometry(14,8,11,1,1,1);
  var eyeRight = new THREE.Mesh(geomeye, this.whiteMat);
  eyeRight.position.set(88,20,-10);
  this.mesh.add(eyeRight);

  var eyeRight = new THREE.Mesh(geomeye, this.whiteMat);
  eyeRight.position.set(88,20,10);
  this.mesh.add(eyeRight);

  // Create Retina
  var geomeye = new THREE.BoxGeometry(14,8,5.5,1,1,1);
  var eyeRight = new THREE.Mesh(geomeye, this.blackMat);
  eyeRight.position.set(90,20,12);
  this.mesh.add(eyeRight);

  var eyeRight = new THREE.Mesh(geomeye, this.blackMat);
  eyeRight.position.set(90,20,-12);
  this.mesh.add(eyeRight);


  // Create LeftLeg
  var geomLeg= new THREE.BoxGeometry(25,35,20,1,1,1);
  var LeftLeg = new THREE.Mesh(geomLeg, this.pinkMat);
  LeftLeg.position.set(20,-45,-17);
	this.mesh.add(LeftLeg);

  //Create Right Legs
  var RightLeg = new THREE.Mesh(geomLeg, this.pinkMat);
  RightLeg.position.set(20,-45,17);

	this.mesh.add(RightLeg);

  //Backleg
  // Create LeftLeg
  var LeftLegBack = new THREE.Mesh(geomLeg, this.pinkMat);
  LeftLegBack.position.set(-35,-45,-17);

	this.mesh.add(LeftLegBack);

  //Create Right Legs
  var RightLegBack = new THREE.Mesh(geomLeg, this.pinkMat);
  RightLegBack.position.set(-35,-45,17);

	this.mesh.add(RightLegBack);
};

Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = 750 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -400-Math.random()*400;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}

Sea = function(){
  var geom = new THREE.CylinderGeometry(600,600,800,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.6,
    shading:THREE.FlatShading,
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.receiveShadow = true;
}

Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20,20,20);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,
  });

  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    m.castShadow = true;
    m.receiveShadow = true;
    this.mesh.add(m);
  }
}

// 3D Models
var sea;
var airplane;

function createPlane(){
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

function loop(){
  updatePlane();
  sea.mesh.rotation.z += .005;
  sky.mesh.rotation.z += .01;
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updatePlane(){
  var targetY = normalize(mousePos.y,-.75,.75,25, 175);
  var targetX = normalize(mousePos.x,-.75,.75,-100, 100);
  airplane.mesh.position.y = targetY;
  airplane.mesh.position.x = targetX;
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

function init(event){
  document.addEventListener('mousemove', handleMouseMove, false);
  createScene();
  createLights();
  createPlane();
  createSea();
  createSky();
  loop();
}

// HANDLE MOUSE EVENTS

var mousePos = { x: 0, y: 0 };

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

window.addEventListener('load', init, false);
