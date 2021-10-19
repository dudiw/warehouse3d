import Floor from "./floor.js";
import Agent from './agent.js';

export default class Arena {
  constructor(context) {
    this.context = context;
    this.scene = context.scene;
    this.tagModels = new Map();
    this.tags = context.tags;
    this.timeInternal = 0;
    this.fps = context.fps;
    this.lastTime = window.performance.now();
    this.frame = 0; //TODO this.timeInternal = a / (this.fps / 1E3);
    this.camera = context.camera;

    this.agents = new Map();

    window.addEventListener('resize', this.resize.bind(this), false);
  }

  resize() {
    var canvas = this.context.renderer.domElement.parentElement;
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight - 88;
    this.context.aspect = this.width / this.height;

    this.context.camera.resize()
    this.context.resolution.set(this.width, this.height);
    this.context.renderer.setSize(this.width, this.height);
  }

  update() {
    requestAnimationFrame(this.update.bind(this));
    if (!this.context.camera) return;

    this.context.resolution.set(this.width, this.height);

    this.processGameState();
    
    this.camera.update();
  }

  load(data) {
    this.map = data;

    this.clearScene();
    this.addLights();
    this.floor = new Floor(this.context);

    if (!data.paths.length) return;

    this.addAgents(data);
    
    this.floor.addMapGeometry();
    this.floor.addFloorGeometry(this.map.width + 1.6);
  }

  addAgents(data) {
    var shadow = new Image();
    shadow.src = this.createBlurCircle();
    this.context.shadowTexture = new THREE.Texture(shadow);
    this.context.shadowTexture.needsUpdate = true;

    var selection = new Image();
    selection.src = this.createFloorMarker("#ffffff");
    var texture = new THREE.Texture(selection);
    texture.needsUpdate = true;
    texture.anisotropy = this.context.renderer.capabilities.getMaxAnisotropy();
    this.context.selectionTexture = texture;

    this.playback = new Playback(data);
    var states = this.playback.getStates(0);
    this.playback.reset();

    for (var agent_id in states) {
      var agent = new Agent(this.context, states[agent_id]);

      var trajectory = this.playback.getTrajectory(agent_id);
      agent.setTrajectory(trajectory);
      this.agents.set(agent_id, agent);
    }

    const ROOMBA = '../assets/roomba2/roomba2.gltf';

    var that = this;
    const loader = new GLTFLoader();
    loader.load(ROOMBA, function(gltf) {
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      for (var agent of that.agents.values()) {
        agent.setModel(gltf.scene.clone());
      }
    });

    this.isReady = true;
  }

  createFloorMarker(color) {
    color = color || "#333333";
    var canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    var marker = canvas.getContext("2d");
    if (!marker) return "";

    marker.beginPath();
    marker.arc(64, 64, 40, 0, 2 * Math.PI);
    marker.closePath();
    marker.lineWidth = 12;
    marker.strokeStyle = color;
    marker.stroke();
    return canvas.toDataURL("image/png")
  }

  addLights() {
    var directed = new THREE.DirectionalLight(16777215, .2); // was .1
    directed.position.set(0, 100, 0);
    directed.shadow.camera.left = -15;
    directed.shadow.camera.top = 15;
    directed.shadow.camera.right = 15;
    directed.shadow.camera.bottom = -15;
    this.scene.add(directed);

    var ambient = new THREE.AmbientLight(16775930, .8);
    this.scene.add(ambient);

    var spot = new THREE.SpotLight(16777215, .2);
    spot.position.set(100, 100, 100);
    spot.target.position.set(0, 0, 0);
    this.scene.add(spot.target);
    spot.castShadow = true;
    spot.angle = 5 * Math.PI / 180;

    spot.shadow.near = 50;
    spot.shadow.far = 200;
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    this.scene.add(spot)
  }

  processGameState() {
    // var color = i ? '#f4155b' : '#156cf4';
    var states = this.playback.getStates();
    
    for (var agent_id of this.agents.keys()) {
      var state = states[agent_id];
      var agent = this.agents.get(agent_id);
      agent.updateAgentState(state);
      agent.showTrajectory(state.progress);
    }
  }

  resetTime() {
    this.lastTime = window.performance.now();
    this.timeInternal = 0
  }

  selectPlayer(a, b) {
    b = void 0 === b ? "#333333" : b;
    if (void 0 !== this.selectedPlayerInternal) {
      var c = this.agents.get(this.selectedPlayerInternal);
      if (c) {
        c.model.selected = false;
        c.model.selection.visible = false;
      }
    }
    this.selectedPlayerInternal = a;
    if (this.selectedPlayerInternal) {
      a = this.agents.get(this.selectedPlayerInternal);
      a.model.selection.visible = true;
      a.model.selected = true,
      a.model.selectionColor = b,
      a.model.selection.material.color = new THREE.Color(b);
    }
  }

  createBlurCircle() {
    var canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    var context = canvas.getContext("2d");
    if (!context) return "";

    context.beginPath();
    context.arc(16, 16, 16, 0, 2 * Math.PI);
    context.closePath();
    var gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
    gradient.addColorStop(.5, "rgba(0, 0, 0, 0.3)");
    gradient.addColorStop(.7, "rgba(0, 0, 0, 0.18)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fill();
    return canvas.toDataURL("image/png");
  };

  clearScene() {
    for (; this.scene.children.length;)
      this.scene.remove(this.scene.children[0]);
    if (this.floor) this.floor.clearFloor();
    this.tagModels.clear();
    this.tags.length = 0
  }
}

class Playback {
  constructor(data, duration, fps) {
    this.paths = data.paths;
    this.offsetColumn = .5 - .5 * data.width;
    this.offsetRow = .5 - .5 * data.length;

    this.trajectories = new Map();
    this.hits = {};
    
    // longest path span
    this.span = 0;
    for (var path of this.paths) {
      this.span = Math.max(this.span, path.length - 1);
    }

    this.duration = duration || 10;
    this.fps = fps || 15;
    
    this.total = this.span * this.fps;
  }

  reset() { 
    this.startTime = 0;
    this.trajectories = new Map();
    this.hits = {};
  }

  getTrajectory(agent) {
    if (!this.trajectories.size) this.getTrajectories();
    return this.trajectories.get(agent) || [];
  }

  getTrajectories() {
    if (this.trajectories.size) return this.trajectories;

    for (var t = 0; t <= this.span; t++) {
      for (var agent in this.paths) {
        var path = this.paths[agent];
        if (t >= path.length) continue;

        var point = path[t];
        var x = this.offsetColumn + point[1]
          , z = this.offsetRow + point[0];

        var row = this.hits[z] || {};
        this.hits[z] = row;

        var cell = row[x] || new Set();
        row[x] = cell;

        cell.add(agent);
        var y = 1 + 0.15 * (cell.size - 1);

        var trajectory = this.trajectories.get(agent) || [];
        trajectory.push(new THREE.Vector3(x, y, z));
        this.trajectories.set(agent, trajectory);
      }
    }
    return this.trajectories;
  }

  getStates(fraction) {
    if (!this.startTime) {
      this.startTime = window.performance.now() / 1E3;
    }

    if (fraction === undefined) {
      var interval = window.performance.now() / 1E3 - this.startTime;
      fraction = interval / this.duration;
    } else if (fraction >= 0) {
      var now = window.performance.now() / 1E3;
      this.startTime = now - fraction * this.duration;
    }
    fraction = Math.min(Math.abs(fraction), 1);
    var progress = fraction * this.span;
    var factor = progress % 1;
    var index = Math.floor(progress);

    if (fraction === 1) {
      this.reset();
    }
    var result = new Map();
    for (var agent = 0; agent < this.paths.length; agent++) {
      var path = this.paths[agent];
      var last = path.length - 1;
      var current = path[Math.min(index, last)];
      var next = path[Math.min(index + 1, last)];

      var x = current[1]
        , z = current[0]
        , dx = next[1] - x
        , dz = next[0] - z;

      // heading in radians.
      var angle = Math.atan2(dx, dz);
      if (index >= last) {
        var previous = path[last - 1];
        angle = Math.atan2(x - previous[1], z - previous[0]);
      }

      var location = {
        x: this.offsetColumn + x + dx * factor,
        y: 0.5,
        z: this.offsetRow + z + dz * factor
      };
      result[agent] = {
        agent_id: agent,
        team: agent % 2,
        location: location,
        orientation: {
          yaw: angle
        },
        carry: false,
        progress: Math.min(1, progress / last)
      }
    }

    return result;
  }
}