import Arena from './arena.js';
import Camera from './camera.js';

export function main(context) {
  window.GLTFLoader = context.GLTFLoader;
  const canvas = document.querySelector('#c');
  context.width = window.innerWidth;
  context.height = window.innerHeight;
  context.aspect = context.width / context.height;
  context.canvas = canvas;

  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0, 0);
  renderer.setSize(context.width, context.height);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  context.renderer = renderer;

  context.fov = 45;
  context.aspect = 2;  // the canvas default
  context.near = 0.1;
  context.far = 1000;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white');
  context.scene = scene;

  context.mouse = new THREE.Vector2();
  context.occlusionGroup = [];
  context.tags = [];
  context.active = false;
  context.resolution = new THREE.Vector2();

  var url = '';
  const loadGameData = function(url, callback) {
    // data = fetch(url);
    const data = {
      "pattern": [
        "*****************",
        "*               *",
        "*   * *****     *",
        "*   * *   *     *",
        "*   * *         *",
        "*   *     *     *",
        "*   * * ***     *",
        "*         *     *",
        "*   *     *     *",
        "*     *         *",
        "*     *** * *   *",
        "*     *     *   *",
        "*         * *   *",
        "*     *   * *   *",
        "*     ***** *   *",
        "*               *",
        "*****************"
      ],
      "width": 17,
      "length": 17,
      "paths": [
        [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [9, 10], [9, 11], [9, 12], [9, 13], [9, 14]],
        [[3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [8, 7], [8, 8], [9, 8], [9, 9], [9, 10], [9, 11], [9, 12], [9, 13], [9, 14], [9, 15]],
        [[15, 15], [15, 14], [15, 13], [15, 12], [15, 11], [15, 10], [15, 9], [15, 8], [15, 7], [15, 6], [15, 5], [15, 4], [15, 3], [15, 2], [15, 1], [14, 1], [13, 1], [12, 1], [11, 1], [10, 1], [9, 1]],
        [[15, 13], [15, 12], [15, 11], [15, 10], [15, 9], [15, 8], [15, 7], [15, 6], [15, 5], [15, 4], [15, 3], [15, 2], [15, 1], [14, 1], [13, 1], [12, 1], [11, 1], [10, 1], [9, 1], [8, 1]],
        [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1, 13], [1, 14], [1, 15], [2, 15], [3, 15], [4, 15], [5, 15], [6, 15], [7, 15], [8, 15], [8, 14], [8, 13], [9, 13], [10, 13], [10, 14], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15], [15, 15]],
      ]
    };

    callback(data);
  }

  loadGameData(url, function(data) {
    context.game = data;
    context.camera = new Camera(context); 

    context.fps = 15;
    
    const arena = new Arena(context);
    arena.load(data); 
    arena.resize()
    arena.resetTime();
    arena.update();
  });
}