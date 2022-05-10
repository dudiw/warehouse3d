export default class Drone {
  constructor(context, info) {
    this.context = context;
    this.scene = context.scene;

    this.clock = new THREE.Clock();

    var shadowMat = new THREE.MeshBasicMaterial({
      map: this.context.shadowTexture,
      transparent: true
    });
    shadowMat.side = THREE.DoubleSide;
    shadowMat.depthFunc = THREE.LessEqualDepth;
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 4, 4), shadowMat);
    shadow.name = "player-shadow";
    shadow.rotation.x = -.5 * Math.PI;
    
    this.model = {
      body: '',
      shadow: shadow
    };
    const DRONE = './assets/drone/scene.gltf';

    var that = this;
    const loader = new GLTFLoader();
    loader.load(DRONE, function(gltf) {
      let body = gltf.scene;
      body.scale.set(0.3, 0.3, 0.3);
      that.scene.add(body);
      that.model.body = body;
      that.scene.add(that.model.shadow);

      that.mixer = new THREE.AnimationMixer(body);

      // Play a specific animation
      let start = 2;
      const clip = THREE.AnimationClip.findByName(gltf.animations, 'Take 01');
      const action = that.mixer.clipAction(clip);
      action.time = start;
      action.play();

      that.mixer.addEventListener('loop', function(_e) {action.time = start; });
    });

    // initialize motion curve
    this.initCurve();
    this.update();
  }

  initCurve() {
    this.direction = new THREE.Vector3();
    this.binormal = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.lookAt = new THREE.Vector3();

    var spline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(- 10, 3, - 10),
      new THREE.Vector3(10, 5, - 10),
      new THREE.Vector3(15, 6, - 5),
      new THREE.Vector3(10, 4, 10),
      new THREE.Vector3(- 10, 5, 10)
    ]);
    spline.curveType = 'catmullrom';
    spline.closed = true;

    this.tubeGeometry = new THREE.TubeGeometry(spline, 
                                          100 /* extrusionSegments */, 
                                          0.1, 
                                          5 /* radiusSegments */, 
                                          true /*params.closed */);
    
    // tube
    let wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.3, wireframe: true, transparent: true});
    let wireframe = new THREE.Mesh(this.tubeGeometry, wireframeMaterial);
    
    let material = new THREE.MeshLambertMaterial({color: 0xff00ff, opacity: 0.3, transparent: true});
    let mesh = new THREE.Mesh(this.tubeGeometry, material);
    mesh.add(wireframe);

    let parent = new THREE.Object3D();
    parent.add(mesh);
    this.scene.add(parent);
  }

  update() {
    // animate camera along spline
    const looptime = 15 * 1000;
    const t = (Date.now() % looptime) / looptime;

    let path = this.tubeGeometry.parameters.path;
    path.getPointAt(t, this.position);

    // interpolation
    const segments = this.tubeGeometry.tangents.length;
    const pickt = t * segments;
    const pick = Math.floor(pickt);
    const pickNext = (pick + 1) % segments;

    let binormals = this.tubeGeometry.binormals;
    this.binormal.subVectors(binormals[pickNext], binormals[pick]);
    this.binormal.multiplyScalar(pickt - pick).add(binormals[pick]);

    path.getTangentAt(t, this.direction);
    this.normal.copy(this.binormal).cross(this.direction);

    // we move on a offset on its binormal
    this.position.add(this.normal.clone());

    // using arc-length for stabilization in look ahead
    path.getPointAt((t + 30 / path.getLength()) % 1, this.lookAt);

    // camera orientation 2 - up orientation via normal
    this.lookAt.copy(this.position).add(this.direction);
    let body = this.model.body;
    if (!body) return;
    
    let norm = new THREE.Vector3(this.normal.x, -this.normal.y, this.normal.z);
    body.position.copy(this.position);
    body.matrix.lookAt(body.position, this.lookAt, norm);
    body.quaternion.setFromRotationMatrix(body.matrix);

    this.model.shadow.position.set(this.position.x, .15, this.position.z);

    // update animation
    this.mixer.update(this.clock.getDelta());
  }
}