// REFERENSI: https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
//C VARIABEL DECLARASI WARNA
var Colors = {
    red:0xf25346,
    cloud:0x8B7E74,
    babi: 0xE98EAD,
    tanah: 0x472183,
    kesanHilang: 0xF3CCFF,
    kandang: 0xFFFFFF,
    koin: 0xFFD700,
};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

// FUNGSI RESET SETIP PERMAINAN
function resetGame(){
  game = {// VARIABEL TENTANG KECEPATAN
          speed:0,
          initSpeed:.0004,
          baseSpeed:.0004,
          targetBaseSpeed:.0004,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          // TENTANG STATE AWAL
          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          // STATE TERKAIT LEVEL
          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,

          // STATE TERKAIT BABI TERBANG
          babiDefaulHeight:100,
          babiAmpHeight:80,
          babiAmpWidth:75,
          babiMoveSensivity:0.005,
          babiRotXSensivity:0.0008,
          babiRotZSensivity:0.0004,
          babiFallSpeed:.001,
          babiMinSpeed:1.2,
          babiMaxSpeed:1.6,
          babiSpeed:0,
          babiCollisionDisplacementX:0,
          babiCollisionSpeedX:0,

          babiCollisionDisplacementY:0,
          babiCollisionSpeedY:0,

          // STATE TENTANG TANAH
          landRadius:600,             //
          landLength:800,             //
          // landRotationSpeed:0.006,  //
          wavesMinAmp : 30,            // before: 5
          wavesMaxAmp : 40,           // before: 20
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,

          // STATE KAMERA
          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

          // STATE TENTANG WORTEL
          wortelDistanceTolerance:15,
          wortelValue:3,
          wortelSpeed:.5,
          wortelLastSpawn:0,
          distanceForWortelSpawn:100,

          // STATE TENTANG KANDANG
          kandangDistanceTolerance:10,
          kandangValue:10,
          kandangSpeed:.6,
          kandangLastSpawn:0,
          distanceForKandangSpawn:50,

          // FLAG UNTUK BERMAIN
          status : "playing",
         };
  fieldLevel.innerHTML = Math.floor(game.level);
}

// VARIABEL TERKAIT THREE JS
var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls;

// VARIABEL SCREEN & MOUSE
var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS
// FUNGSI UNTUK MEMBUAT SCENE
function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  // KESAN MENGHILANG
  scene.fog = new THREE.Fog(Colors.kesanHilang, 100, 950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.babiDefaulHeight;
  // camera.lookAt(new THREE.Vector3(0, 100, 100));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
}

// MOUSE AND SCREEN EVENTS

// FUNGSI UNTUK MENGATUR RESIZE ukuran window
function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

// FUNSGI UNTUK MENGATUR PERGERAKAN MOUSE
function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

// FUNGSI UNTUK MENGATUR PERGERAKAN SENTUHAN dari USER
function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

// FUNGSI UNTUK MEMULAI ULANG PERMAINAN, melalui mouse
function handleMouseUp(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

// FUNGSI UNTUK MEMULAI ULANG PERMAINAN, melalui sentuhan
function handleTouchEnd(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

// LIGHTS
var ambientLight, hemisphereLight, shadowLight; // shadowLight untuk menampung directionalLight

// FUNGSI MEMBUAT PENCAHAYAAN
function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  // PENCAHAYAAN UNTUK MEMBUAT BAYANGAN
  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}

function createLambert(color) {
  return lambert = new THREE.MeshLambertMaterial({color: color});
}

function createBoxBabi(width, height, depth, widthSegments, heightSegments, depthSegments, mesh) {
  var geom = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
  var mesh = new THREE.Mesh(geom, mesh);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// FUNGSI MEMBUAT BABIK TERBANG
var BabiTerbang = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";
  
  this.pinkMat = createLambert(Colors.babi);
  this.holeMat = createLambert("#983154");
  this.whiteMat = createLambert("white");
  this.blackMat = createLambert("black");
  this.nailMat = createLambert("#48261a");

  // Create the Body
	var box = createBoxBabi(80,60,60,1,1,1,this.pinkMat);
  this.mesh.add(box);
  
  // Create Head
	var box = createBoxBabi(56,56,40,1,1,1,this.pinkMat);
  box.position.x = 65;
  box.position.y = 10;
  this.mesh.add(box);
  
  //Create Snout
	var box = createBoxBabi(22,12,18,1,1,1,this.pinkMat);
  box.position.x = 88;
  box.position.y = 5;
  this.mesh.add(box);
  
  //Create Hole
	var box = createBoxBabi(1,5,5,1,1,1,this.holeMat);
  box.position.set(100,5,-5);
  this.mesh.add(box);
  
  var box = createBoxBabi(1,5,5,1,1,1, this.holeMat);
  box.position.set(100,5,5);
	this.mesh.add(box);

  // Create EYE
  var box = createBoxBabi(14,8,11,1,1,1, this.whiteMat);
  box.position.set(88,20,-10);
  this.mesh.add(box);

  var box = createBoxBabi(14,8,11,1,1,1, this.whiteMat);
  box.position.set(88,20,10);
  this.mesh.add(box);

  // Create Retina
  var box = createBoxBabi(14,8,5.5,1,1,1, this.blackMat);
  box.position.set(90,20,12);
  this.mesh.add(box);
  
  var box = createBoxBabi(14,8,5.5,1,1,1, this.blackMat);
  box.position.set(90,20,-12);
  this.mesh.add(box);

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

  const groupingSayap = new THREE.Group();
  const wings = new createFullWing();
  wings.scale.set(4,4,4);
  wings.rotation.y = 1.7;
  wings.rotation.x = 0;
  wings.rotation.z = 0;

  groupingSayap.add(wings);
  groupingSayap.rotation.x = -0.06;
  groupingSayap.rotation.z = -0.4;
  groupingSayap.position.set(20,0,-21);
  
	this.mesh.add(groupingSayap);
};

const extrudeSettings = { 
  depth: 1, 
  bevelEnabled: true, 
  bevelSegments: 2, 
  steps: 2, 
  bevelSize: 1, 
  bevelThickness: 1
};

function createExtrude(shape, pos) {
  material = new THREE.MeshLambertMaterial({color: Colors.babi});
  geometry = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );
  mesh = new THREE.Mesh( geometry, material );
  mesh.position.copy(pos);
  mesh.rotation.z = 0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

// FUNGSI MEMBUAT SAYAP DALAM
function createSayapAwal() {
  let shape = new THREE.Shape();
  const pos = new THREE.Vector3();

  shape.moveTo(0, 0);
  shape.lineTo(5,0);
  shape.lineTo(5,10);
  shape.lineTo(0,10);
  shape.lineTo(0,0);

  mesh = createExtrude(shape, pos);

  return mesh;
}

// FUNGSI MEMBUAT SAYAP LUAR
function createSayapAkhir() {
  let shape = new THREE.Shape();
  const pos = new THREE.Vector3();

  panjang = 20;
  shape.moveTo(0, 0);
  shape.lineTo(10,-5);
  shape.lineTo(10,15);
  shape.lineTo(0,10);
  shape.lineTo(0,0);

  mesh = createExtrude(shape, pos);

  return mesh;
}

function mergeSayap(x, y, z, rotY) {
  const sayap = createSayapAkhir();
  sayap.position.x = x;
  sayap.position.y = y;
  sayap.position.z = z;
  
  sayap.rotation.y = rotY;
  return sayap;
}

// FUNGSI MEMBUAT SATU FULL SATU SISI SAYAP
function createWing() {
  const wing = new THREE.Group();
  
  const sayap = createSayapAwal();
  sayap.position.x = 0;
  sayap.position.y = 0;
  sayap.position.z = 0;
  wing.add(sayap);

  const sayap2 = mergeSayap(5,0,0,3*(360-37)/180);
  wing.add(sayap2);

  const sayap3 = mergeSayap(17,0,0,-(3*(180-53)/180));
  wing.add(sayap3);

  const sayap4 = mergeSayap(17,0,0,3*(360-37)/180);
  wing.add(sayap4);

  const sayap5 = mergeSayap(33,0,10,3);
  wing.add(sayap5);

  return wing;
}

// FUNGSI MEMBUAT SATU SET SAYAP
function createFullWing(){
  const duaSayap = new THREE.Group();
  const wing = createWing();
  wing.rotation.x = -2;
  duaSayap.add(wing);
  
  const wing2 = createWing();
  wing2.rotation.x = -2;
  wing2.rotation.z = 3;
  
  wing2.position.x = -10;
  wing2.position.z = -10;
  wing2.position.y = -5;
  duaSayap.add(wing2);

  return duaSayap;
}

// FUNGSI MEMBUAT LANGIT
Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = game.landRadius + 150 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}

// FUNGSI MENGATUR PERGERAKAN AWAN
Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;
}

// FUNGSI MEMBUAT TANAH / BUMI
Land = function(){
  var geom = new THREE.CylinderGeometry(game.landRadius,game.landRadius,game.landLength,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push({y:v.y,
                     x:v.x,
                     z:v.z,
                     ang:Math.random()*Math.PI*2,
                     amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),
                     speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)
                    });
  };
  var mat = new THREE.MeshStandardMaterial({  // phong -> standard
    color:Colors.tanah,
    transparent:true,
    opacity:1,
    shading:THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;
}

// FUNGSI MEMBUAT GELOMBANG PADA BUMI
Land.prototype.moveWaves = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.waves[i];
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    vprops.ang += vprops.speed*deltaTime;
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}

// FUNGSI MEMBUAT AWAN
Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.SphereGeometry(21.5,5,6);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.cloud,
    flatShading: true,
  });

  var map = (val, smin, smax, emin, emax) => (emax-emin)*(val-smin)/(smax-smin) + emin

  var jitter = (geom,per) => geom.vertices.forEach(v => {
    v.x += map(Math.random(),0,1,-per,per)
    v.y += map(Math.random(),0,1,-per,per)
    v.z += map(Math.random(),0,1,-per,per)
  })
  jitter(geom,0.2)

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
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;
  }
}

// FUNGSI MENGATUR ROTASI AWAN
Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

// FUNGSI MEMBUAT KANDANG
function createBox(y) {
  const geometry = new THREE.BoxGeometry( 50, 5, 50 );
  const material = new THREE.MeshLambertMaterial( {color: Colors.kandang } );
  const cube = new THREE.Mesh( geometry, material );
  
  cube.position.y = y;

  cube.castShadow = true;
  cube.receiveShadow = true;
  return cube;
}

function createCylinder(x,z) {
  const geometry = new THREE.CylinderGeometry( radiusTop=2, radiusBottom=2, height=48, radialSegments=100 );
  const material = new THREE.MeshLambertMaterial( {color: Colors.kandang} );
  const cylinder = new THREE.Mesh( geometry, material );
  
  cylinder.position.x = x;
  cylinder.position.z = z;

  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  return cylinder;
}

Kandang = function() {
  const grupKandang = new THREE.Group();

  const box = new createBox(-25);
  grupKandang.add(box);

  const box2 = new createBox(25);
  grupKandang.add(box2);

  const bar1 = new createCylinder(20,20);
  grupKandang.add(bar1);
  const bar2 = new createCylinder(-20,20);
  grupKandang.add(bar2);
  const bar3 = new createCylinder(20,-20);
  grupKandang.add(bar3);
  const bar4 = new createCylinder(-20,-20);
  grupKandang.add(bar4);
  const bar5 = new createCylinder(0,20);
  grupKandang.add(bar5);
  const bar6 = new createCylinder(-20,0);
  grupKandang.add(bar6);
  const bar7 = new createCylinder(0,-20);
  grupKandang.add(bar7);
  const bar8 = new createCylinder(20,0);
  grupKandang.add(bar8);
  const bar9 = new createCylinder(10,20);
  grupKandang.add(bar9);
  const bar10 = new createCylinder(-10,20);
  grupKandang.add(bar10);
  const bar11 = new createCylinder(20,-10);
  grupKandang.add(bar11);
  const bar12 = new createCylinder(20,10);
  grupKandang.add(bar12);
  const bar13 = new createCylinder(-20,10);
  grupKandang.add(bar13);
  const bar14 = new createCylinder(-20,-10);
  grupKandang.add(bar14);
  const bar15 = new createCylinder(10,-20);
  grupKandang.add(bar15);
  const bar16 = new createCylinder(-10,-20);
  grupKandang.add(bar16);

  this.mesh = grupKandang;
  this.mesh.scale.set(0.5,0.4,0.5);
}

// holder untuk Kandang
EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

// SPAWNING KANDANG
EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      ennemy = new Kandang();
    }

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.landRadius + game.babiDefaulHeight + (-1 + Math.random() * 2) * (game.babiAmpHeight-20);
    ennemy.mesh.position.y = -game.landRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

// ROTASI KANDANG
EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.kandangSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.landRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.03;
    ennemy.mesh.rotation.y += Math.random()*.03;

    //var globalKandangPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = babiterbang.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.kandangDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.kandang, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.babiCollisionSpeedX = 100 * diffPos.x / d;
      game.babiCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      removeEnergy();
      i--;
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

// PARTICLE HASIL TERKENA KOIN
Particle = function(){
  var geom = new THREE.TetrahedronGeometry(5,0);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.koin,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

// ANIMASI EXPLODE TERKENA KANDANG
Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

// holder untuk particle
ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

// SPAWNING PARTICLE
ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){
  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

// COIN
Coin = function(){
  var geom = new THREE.CylinderGeometry(4,4,0.8,100);  //
  
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.koin,   //
    shininess:3,      //
    specular:0xffffff,

    shading:THREE.FlatShading
  });

  this.mesh = new THREE.Mesh(geom,mat); 
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

// holder untuk COIN
CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

// SPAWNING untuk COIN
CoinsHolder.prototype.spawnCoins = function(){
  var nCoins = 1 + Math.floor(Math.random()*10);
  var d = game.landRadius + game.babiDefaulHeight + (-1 + Math.random() * 2) * (game.babiAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.landRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

// ROTASI UNTUK COIN
CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.wortelSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.landRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = babiterbang.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.wortelDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0xFFA500, .8);
      addEnergy();
      i--;
    }else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}

// 3D Models
var land;
var babiterbang;

// MEMBUAT PESAWAT
function createPlane(){
  babiterbang = new BabiTerbang();
  babiterbang.mesh.scale.set(.25,.25,.25);
  babiterbang.mesh.position.y = game.babiDefaulHeight;
  scene.add(babiterbang.mesh);
}

// MEMBUAT BUMI
function createLand(){
  land = new Land();
  land.mesh.position.y = -game.landRadius;
  scene.add(land.mesh);
}

// MEMBUAT LANGIT
function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.landRadius;
  scene.add(sky.mesh);
}

// MEMBUAT COIN
function createCoins(){
  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

// MEMBUAT KANDANG
function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Kandang();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  scene.add(ennemiesHolder.mesh)
}

// MEMBUAT PARTICLE
function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  scene.add(particlesHolder.mesh)
}

// LOOPING
function loop(){
  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game.status=="playing"){

    // Add energy coins every 100m;
    if (Math.floor(game.distance)%game.distanceForWortelSpawn == 0 && Math.floor(game.distance) > game.wortelLastSpawn){
      game.wortelLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForKandangSpawn == 0 && Math.floor(game.distance) > game.kandangLastSpawn){
      game.kandangLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }

    updateBabiTerbang();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.babiSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    babiterbang.mesh.rotation.z += (-Math.PI/2 - babiterbang.mesh.rotation.z)*.0002*deltaTime;
    babiterbang.mesh.rotation.x += 0.0003*deltaTime;
    game.babiFallSpeed *= 1.05;
    babiterbang.mesh.position.y -= game.babiFallSpeed*deltaTime;

    if (babiterbang.mesh.position.y <-200){
      showReplay();
      game.status = "waitingReplay";

    }
  }else if (game.status=="waitingReplay"){

  }


  land.mesh.rotation.z += game.speed*deltaTime; //*game.landRotationSpeed;

  if ( land.mesh.rotation.z > 2*Math.PI)  land.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  land.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// UPDATE NILAI DISTANCE
function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);
}

var blinkEnergy=false;

// UPDATE NILAI ENERGY
function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";

  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

// MENAMBAHKAN ENERGi
function addEnergy(){
  game.energy += game.wortelValue;
  game.energy = Math.min(game.energy, 100);
}

// MENGURANGI ENERGY
function removeEnergy(){
  game.energy -= game.kandangValue;
  game.energy = Math.max(0, game.energy);
}

// UPDATE KONDISI BABI
function updateBabiTerbang(){

  game.babiSpeed = normalize(mousePos.x,-.5,.5,game.babiMinSpeed, game.babiMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.babiDefaulHeight-game.babiAmpHeight, game.babiDefaulHeight+game.babiAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.babiAmpWidth*.7, -game.babiAmpWidth);

  game.babiCollisionDisplacementX += game.babiCollisionSpeedX;
  targetX += game.babiCollisionDisplacementX;


  game.babiCollisionDisplacementY += game.babiCollisionSpeedY;
  targetY += game.babiCollisionDisplacementY;

  babiterbang.mesh.position.y += (targetY-babiterbang.mesh.position.y)*deltaTime*game.babiMoveSensivity;
  babiterbang.mesh.position.x += (targetX-babiterbang.mesh.position.x)*deltaTime*game.babiMoveSensivity;

  babiterbang.mesh.rotation.z = (targetY-babiterbang.mesh.position.y)*deltaTime*game.babiRotXSensivity;
  babiterbang.mesh.rotation.x = (babiterbang.mesh.position.y-targetY)*deltaTime*game.babiRotZSensivity;
  var targetCameraZ = normalize(game.babiSpeed, game.babiMinSpeed, game.babiMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x,-1,1,40, 80);
  camera.updateProjectionMatrix ()
  camera.position.y += (babiterbang.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;

  game.babiCollisionSpeedX += (0-game.babiCollisionSpeedX)*deltaTime * 0.03;
  game.babiCollisionDisplacementX += (0-game.babiCollisionDisplacementX)*deltaTime *0.01;
  game.babiCollisionSpeedY += (0-game.babiCollisionSpeedY)*deltaTime * 0.03;
  game.babiCollisionDisplacementY += (0-game.babiCollisionDisplacementY)*deltaTime *0.01;

}

function showReplay(){
  replayMessage.style.display="block";
}

function hideReplay(){
  replayMessage.style.display="none";
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event){

  // UI

  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");

  resetGame();
  createScene();

  createLights();
  createPlane();
  createLand();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  loop();
}

window.addEventListener('load', init, false);
