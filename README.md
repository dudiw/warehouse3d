# warehouse3d
The `warehouse3d` project is a visualization tool for inspecting Multi-agent 
dynamics in autonomous-warehouses. 

Click to see a live [Demo](https://dudiw.github.io/warehouse3d/).

<div>
  <img src="https://storage.googleapis.com/macro-fence-2015.appspot.com/lab/warehouse3d.gif" style="width:400px;clip-path: inset(1px 1px);"></img>
</div>

### Usage Notes
Coordinates are denoted by `(row, column)`.  
The floorplan is described as a 2D array, with `*` marking a blocked tile.  
For example:
```json
[
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
]
``` 
Agent-paths are described as discrete coordinates, each spanning a single timestep.
For example:
```json5
[
  [3, 1], [4, 1], [5, 1], [6, 1], //...
]
```

### Attribution
The project utilizes [THREE.js](https://threejs.org/) and 
[three.path](https://github.com/shawn0326/three.path) for managing the 3D scene.

#### Assets
The project attributes the following assets and their creators
* [Amazon Prime shipping box](https://skfb.ly/ZoZO) by [NikR](https://sketchfab.com/NikR) (licensed under [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/)).  
  
* [S9 Mini Drone](https://sketchfab.com/3d-models/s9-mini-drone-cf3ed83c1b87486d90435f54c074e16e) by [BlueMesh](https://sketchfab.com/VapTor) (licensed under [Creative Commons Attribution](http://creativecommons.org/licenses/by/4.0/)).

### Upcoming Features
* Functionality
    - [ ] Add support for plan playback (pause, seek, resume, change speed).
    - [ ] Introduce agent annotation, goal and selection highlighting.
    - [ ] Add endpoint for online position-feed (e.g. from motion capture system).
* Performance 
    - [ ] Manage agents and shelves with [THREE.InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh).
    - [ ] Enhance performance on large tasks using [THREE.LOD](https://threejs.org/docs/?q=lod#api/en/objects/LOD).
