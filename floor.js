export default class Floor {
  constructor(context) {
    this.context = context;
    this.map = context.map;
    this.walls = new THREE.Object3D();
    
    this.obstacles = [];
    this.shelves = new THREE.Object3D();

    const SHELF_URL = '/assets/shelf2/shelf2.gltf';

    // Instantiate a loader
    var that = this;
    const loader = new GLTFLoader();
    loader.load(SHELF_URL, function(gltf) {
      that.shelf = gltf.scene;
      that.addShelves()
    });

    var shadow = new THREE.TextureLoader().load('/assets/drop-shadow.png', undefined, function(texture) {
      var tex = texture.clone();
      tex.needsUpdate = true;
    });

    var shadowMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: shadow,
        transparent: true
      }));
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2;
    shadowMesh.scale.setScalar(24);
    this.context.scene.add(shadowMesh);
  }

  getColorUniforms(a) {
    return {
      uRed: {value: a ? 89 / 255 : 1},
      uGreen: {value: a ? 91 / 255 : 1},
      uBlue: {value: a ? 116 / 255 : 1},
      opacity: {value: 0},
      isFloor: {value: 0}
    }
  }

  addMapGeometry() {
    var start = .5 - .5 * this.context.game.width
      , end = Math.abs(start)
      , row = .5 - .5 * this.context.game.length;
    var pattern = this.context.game.pattern;
    for (var index = 0; index < pattern.length; index++) {
      var column = start;
      for (var cell of pattern[index]) {
        if ("*" === cell) {
          var horizontal = 0 === index || index === pattern.length - 1
            , vertical = column === start || column === end
            , barrier = horizontal || vertical;
          var height = barrier ? .7 : 1.5;
          
          var geometry = new THREE.BoxBufferGeometry(vertical ? .5 : 1, height, horizontal ? .5 : 1);
          var uniforms = this.getColorUniforms(barrier);
          var material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.merge([uniforms, THREE.UniformsLib.lights]),
            vertexShader: this.vertexShader(),
            fragmentShader: this.fragmentShader(),
            lights: true,
            transparent: false,
            extensions: { derivatives: true }
          });
          var wall = new THREE.Mesh(geometry, material);
          wall.castShadow = wall.receiveShadow = true;
          wall.name = "block";

          var offsetY = 0, offsetX = 0;
          column === start ? offsetX = .25 : column === end && (offsetX = -.25);
          0 === index ? offsetY = .25 : index === pattern.length - 1 && (offsetY = -.25);
          wall.position.x = column + offsetX;
          wall.position.z = row + offsetY;
          wall.position.y = .5 * height;
          
          if (!barrier) {
            this.obstacles.push(wall.position.clone());
          } else {
            this.walls.add(wall);
          }
        }
        column++;
      }
      row++;
    }
    this.walls.position.y = 0;
    this.context.scene.add(this.walls);
  }

  addShelves() {
    if (!this.obstacles || !this.shelf) return;

    if (!this.shadowMesh) {
      var shadowMat = new THREE.MeshBasicMaterial({
        map: this.context.shadowTexture,
        transparent: true,
        depthWrite: false
      });
      shadowMat.side = THREE.DoubleSide;
      shadowMat.depthFunc = THREE.LessEqualDepth;
      this.shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8, 4, 4), shadowMat);
      this.shadowMesh.name = "player-shadow";
      this.shadowMesh.position.z = -.5;
    }
    for (var obstacle of this.obstacles) {
      var shelf = this.shelf.clone();
      var shadow = this.shadowMesh.clone();
      shelf.children[0].add(shadow);
      shelf.position.set(obstacle.x, 0, obstacle.z);
      shelf.needsUpdate = true
      this.shelves.add(shelf);
    }
    this.shelves.position.y = 0;
    this.context.scene.add(this.shelves);
  }

  addFloorGeometry(width, height, depth) {
    width = width || 0;
    height = height || .2;
    depth = depth || width;
    var uniforms = {
      uRed: { value: 1 },
      uGreen: { value: 1 },
      uBlue: { value: 1 }
    };
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader(),
      fragmentShader: this.fragmentShader()
    });
    
    var floor = new THREE.Mesh(geometry, material);
    floor.name = "floor";
    floor.position.y = 0;
    floor.castShadow = floor.receiveShadow = true;
    this.context.scene.add(floor);
    return floor;
  }

  clearFloor() {
    for (; this.walls.children.length;)
      this.walls.remove(this.walls.children[0]);
  }

  createSvgElement(elem) {
    return document.createElementNS("http://www.w3.org/2000/svg", !elem ? "svg" : elem);
  }

  fragmentShader() {
    return `
      varying float vCol;
      varying vec3 vNorm;
      varying vec4 vPosition;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      
      uniform float uRed;
      uniform float uGreen;
      uniform float uBlue;
      uniform float uUseTexture;
      uniform float opacity;
      uniform float isFloor;
      uniform sampler2D uTexture;
      
      struct PointLight {
        vec3 position;
        vec3 color;
      };
      
      uniform PointLight pointLights[NUM_POINT_LIGHTS];
      
      void main() {
        float base = 0.5;
        float range = 0.2;
        
        if (vNorm.y > 0.9) {
          base = 0.7;
          range = 0.3;
        }
        float light = base + ( clamp(vCol + 0.5, 0.0, 1.0) * range);
        
        vec4 color = vec4(light * uRed, light * uGreen, light * uBlue, 1.0);
        if (isFloor==1. || uUseTexture==1.) {
          color = vec4(texture2D(uTexture, vUv).xyz, 1.0);
        }
        
        for (int l = 0; l < NUM_POINT_LIGHTS; l++) {
          vec3 lightDir = normalize(pointLights[l].position - vPosition.xyz);
          float dist = distance(pointLights[l].position, vPosition.xyz);
          float intensity = 0.7 / pow(dist, 1.1);
          color.rgb += vec3(intensity) * pointLights[l].color;
        }
        
        gl_FragColor = color;
        gl_FragColor.a = 1.;
      }
    `;
  }

  vertexShader() {
    return `
      varying float vCol;
      varying vec3 vNorm;
      varying vec4 vPosition;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      
      void main() {
        vUv = uv;
        vCol = position.y;
        vNorm = normal;
        vPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = - vPosition.xyz;
        gl_Position = projectionMatrix * vPosition;
      }
    `;
  }
}