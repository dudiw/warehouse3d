export default class Camera {
  constructor(context) {

    this.context = context;
    this.renderer = context.renderer;
    this.scene = context.scene;

    var dimension = Math.max(context.game.width, context.game.length);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, context.near, context.far);
    this.camera.position.x = -dimension;
    this.camera.position.z = dimension;
    this.camera.position.y = 1.2 * dimension;

    var OrbitControls = context.OrbitControls;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableKeys = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;
    this.controls.screenSpacePanning = false;
    this.controls.update();

    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 100;
    this.camera.lookAt(new THREE.Vector3(0,0,0));
    this.resize()
  }

  resize() {
    this.camera.aspect = this.context.aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
}