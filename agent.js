import { PathGeometry, PathPointList, PathTubeGeometry } from './lib/three.path.js';

var colors = [
  '#ed6a5a',
  '#f4f1bb',
  '#9bc1bc',
  '#5ca4a9',
  '#e6ebe0',
  '#f0b67f',
  '#fe5f55',
  '#d6d1b1',
  '#c7efcf',
  '#eef5db',
  '#50514f',
  '#f25f5c',
  '#ffe066',
  '#247ba0',
  '#70c1b3'
];

export default class Agent {
  constructor(context, info) {
    this.context = context;
    this.scene = context.scene;
    this.info = info;
    this.width = this.context.game.width;

    this.color = 1 === info.team ? 15996251 : 1404148;

    var model = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 0.29, 16, 1),
                              new THREE.MeshPhongMaterial({ color: this.color }));
    model.name = "player-model";
    model.castShadow = model.receiveShadow = true;

    var shadowMat = new THREE.MeshBasicMaterial({
      map: this.context.shadowTexture,
      transparent: true
    });
    shadowMat.side = THREE.DoubleSide;
    shadowMat.depthFunc = THREE.LessEqualDepth;
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 4, 4), shadowMat);
    shadow.name = "player-shadow";
    
    var selectMat = new THREE.MeshBasicMaterial({
      map: this.context.selectionTexture,
      transparent: true,
      color: 16711935
    });
    selectMat.polygonOffset = true;
    selectMat.polygonOffsetFactor = -4;
    selectMat.depthTest = true;
    selectMat.depthWrite = false;
    var selection = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), selectMat);
    selection.name = "player-selection";
    selection.visible = false;

    // agent light intensity
    var light = new THREE.PointLight(this.color, 0.4, 10, 10); // TODO: was 0.2
    light.castShadow = true;
    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    var body = new THREE.Object3D();
    body.add(model);
    body.add(light);

    var object = new THREE.Object3D();
    object.add(shadow);
    object.add(selection);
    object.add(body);
    info.model = {
      body: body,
      shadow: shadow,
      selection: selection,
      light: light,
      decal: null,
      selectionDecal: null,
      selected: false,
      selectionColor: "#ffffff"
    };
    shadow.rotation.x = -.5 * Math.PI;
    selection.rotation.x = -.5 * Math.PI;
    this.updateAgentState(info);
    this.scene.add(object);
    model.userData.id = info.agent_id;
  }

  setModel(model) {
    this.scene.add(model);
    this.roomba = model;
  }

  updateAgentState(state) {
    var location = state.location
      , x = location.x
      , y = location.y
      , z = location.z;
    this.info.model.body.position.set(x, y, z);
    this.info.model.shadow.position.set(x, .15, z);
    this.info.model.selection.position.set(x, .15, z);
    
    var orientation = state.orientation.yaw;

    if (this.flag && state.hasShelf) {
      this.info.model.body.add(this.flag.model),
      this.flag.model.position.x = .2;
      this.flag.model.position.y = -.8;
      this.flag.model.position.z = 0;
      this.flag.model.rotation.y = orientation;
      this.flag.captured = true;
    }

    if (!this.roomba) return;
    this.roomba.position.set(x, y, z);
    this.roomba.rotation.y = orientation;
  }

  removeTrajectory() {
    if (this.pathPointList) this.pathPointList.clear();
    const object = this.scene.getObjectByName(this.info.agent_id);
    if (!object) return;

    object.geometry.dispose();
    object.material.dispose();
    this.scene.remove(object);
  }

  showTrajectory(progress) {
    if (!this.geometry || !this.pathPointList) return;
    this.geometry.update(this.pathPointList, {progress: progress});
  }

  setTrajectory(points) {
    if (!points || points.length < 2) {
      this.removeTrajectory();
      return;
    }
    
    var cornerRadius = 0.2;
    var cornerSplit = 10;
    this.pathPointList = new PathPointList();
    var up = new THREE.Vector3(0, 1, 0); // force up
    
    this.pathPointList.set(points, cornerRadius, cornerSplit, up);

    this.geometry = new PathGeometry(128);
    this.geometry.update(this.pathPointList);

    var material = new THREE.MeshBasicMaterial({
      color: this.color,
      depthWrite: true,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    var line = new THREE.Mesh(this.geometry, material);
    line.frustumCulled = false;
    line.name = this.info.agent_id;
    this.scene.add(line);
  }
}