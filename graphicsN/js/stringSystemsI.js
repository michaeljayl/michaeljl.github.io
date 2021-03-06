/***********
 * stringSystemsE.js
 * M. Laszlo
 * November 2020
 ***********/


import * as THREE from '../build/three.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { MyUtils } from '../lib/utilities.js';
import * as dat from '../lib/dat.gui.module.js';

let camera, scene, renderer;
let cameraControls;
let clock = new THREE.Clock();
let stringSystem;
let transformer, digitsGraph;
let len = 1;
let maxLevels = 4;
let materials;
let randomMats = null;
let geom;
let models;
let curBase = 0;
let globalMat = new THREE.MeshPhongMaterial({shininess: 80});



function createScene() {
    let n = controls.n;
    let base = controls.base;
    makeModelsMap();
    update();
    let light = new THREE.PointLight(0xFFFFFF, 1.0, 1000 );
    light.position.set(10, 20, 20);
    let light2 = new THREE.PointLight(0xFFFFFF, 1.0, 1000 );
    light2.position.set(-10, -20, -20);
    let ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(light);
    scene.add(light2);
    scene.add(ambientLight);
    scene.add(stringSystem);

    // let axes = new THREE.AxesHelper(10);
    // scene.add(axes);
}

function makeStringSystem(n, base, transformer, digitsGraph, includeSet) {
    let root = new THREE.Object3D();
    root.add(digitsGraph.clone());
    if (n > 1) {
        let s = makeStringSystem(n-1, base, transformer, digitsGraph, includeSet);
        for (let i of includeSet) {
            root.add(transformer(i, base, s.clone(), n));
        }
    }
    return root;
}



function makeModelsMap() {
    // keyboard width along z-axis, grows with n along +x-axis
    // keyboard parameters:
    let h = 1; // length along x-axis
    let w = 1; // width of keyboard is w * base
    let d = 0.25;  // depth of keys (height along vertical y-axis)
    let depthOf2n = 2 * d; // lofted: depth of key at 2^{n-1}
    let epsilon = 0.0001;
    models = new Map();
    models.set('keyboard', {
        'transformer': function(i, base, stringSystem) {
            let minx = -0.5 * (base - 1) * w;
            let root = new THREE.Object3D();
            root.position.x = h;
            root.position.z = minx + i * w;
            root.scale.set(1, 1, 1 / base);
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let geom = new THREE.BoxGeometry(h, d, w);
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let minx = -0.5 * (base - 1) * w;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.y = 0.5 * d;
                mesh.position.z = minx + i * w;
                root.add(mesh);
            }
            return root;
        }
    });
    models.set('keyboard lengthened', {
        'transformer': function(i, base, stringSystem) {
            let minx = -0.5 * (base - 1) * w;
            let root = new THREE.Object3D();
            root.position.x = h * i + epsilon;
            root.position.z = minx + i * w;
            stringSystem.scale.set(1 / base, 1, 1 / base);
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let minx = -0.5 * (base - 1) * w;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.BoxGeometry(h * i + epsilon, d, w);
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.x = 0.5 * (h * i + epsilon);
                mesh.position.y = 0.5 * d;
                mesh.position.z = minx + i * w;
                root.add(mesh);
            }
            return root;
        }
    });
    models.set('keyboard lofted', {
        'transformer': function(i, base, stringSystem) {
            let minx = -0.5 * (base - 1) * w;
            let root = new THREE.Object3D();
            root.position.z = minx + i * w;
            root.position.y = 2 * i * d;
            root.scale.set(1, 1, 1 / base);
            stringSystem.position.x = h;
            stringSystem.scale.y = 1 / base + epsilon;
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let minx = -0.5 * (base - 1) * w;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.BoxGeometry(h, i * depthOf2n + epsilon, w);
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.y = i * d;
                mesh.position.z = minx + i * w;
                root.add(mesh);
            }
            return root;
        }
    });
    let sxb = 1;  // side of box x-axis
    let szb = 3;  // side of box z-axis
    let offb = 0.5 // offset between boxes
    models.set('boxes', {
        'transformer': function(i, base, stringSystem) {
            let minx = -0.5 * (base - 1) * (szb + offb);
            let root = new THREE.Object3D();
            root.position.y = d;
            root.position.z = minx + i * (szb + offb);
            root.scale.set(0.8, 1, 1 / (base + 2 * offb));
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let geom = new THREE.BoxGeometry(sxb, d, szb);
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let minx = -0.5 * (base - 1) * (szb + offb);
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.y = 0.5 * d;
                mesh.position.z = minx + i * (szb + offb);
                root.add(mesh);
            }
            return root;
        }
    });
    models.set('boxes lofted', {
        'transformer': function(i, base, stringSystem) {
            let minx = -0.5 * (base - 1) * (szb + offb);
            let root = new THREE.Object3D();
            root.position.y = i * d + epsilon;
            root.position.z = minx + i * (szb + offb);
            root.scale.set(0.8, 1 / base + epsilon, 1 / (base + 2 * offb));
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let minx = -0.5 * (base - 1) * (szb + offb);
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.BoxGeometry(sxb, d * i + epsilon, szb);
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.y = 0.5 * d * i;
                mesh.position.z = minx + i * (szb + offb);
                root.add(mesh);
            }
            return root;
        }
    });
    let bxz = 1;  // side of square in xz-plane
    let bd = 0.2;  // height
    models.set('squares', {
        'transformer': function(i, base, stringSystem) {
            let nrows = Math.floor(Math.sqrt(base));
            let ncols = Math.floor((base - 1) / nrows) + 1;
            let minz = -0.5 * (nrows - 1) * (bxz);
            let root = new THREE.Object3D();
            let row = i % nrows;
            let col = Math.floor(i / nrows);
            root.position.y = bd;
            root.position.z = minz + (row * bxz);
            root.position.x = col * bxz - (0.5 * bxz) + (0.5 / ncols) * bxz; 
            root.scale.set(1/ncols, 1, 1/nrows);
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let geom = new THREE.BoxGeometry(bxz, bd, bxz);
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let nrows = Math.floor(Math.sqrt(base));
            let minz = -0.5 * (nrows - 1) * bxz;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.y = 0.5 * bd;
                let row = i % nrows;
                let col = Math.floor(i / nrows);
                mesh.position.z = minz + (row * bxz);
                mesh.position.x = col * bxz;
                root.add(mesh);
            }
            return root;
        }
    });
    // analogy with boxes lofted
    models.set('squares lofted', {
        'transformer': function(i, base, stringSystem) {
            let nrows = Math.floor(Math.sqrt(base));
            let ncols = Math.floor((base - 1) / nrows) + 1;
            let minz = -0.5 * (nrows - 1) * (bxz);
            let root = new THREE.Object3D();
            let row = i % nrows;
            let col = Math.floor(i / nrows);
            // root.position.y = bd;
            root.position.y = i * bd + epsilon;
            root.position.z = minz + (row * bxz);
            root.position.x = col * bxz - (0.5 * bxz) + (0.5 / ncols) * bxz; 
            root.scale.set(1/ncols, 1 / base + epsilon, 1/nrows);
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let nrows = Math.floor(Math.sqrt(base));
            let minz = -0.5 * (nrows - 1) * bxz;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.BoxGeometry(bxz, bd * i + epsilon, bxz);
                let mesh = new THREE.Mesh(geom, mat);
                // mesh.position.y = 0.5 * bd;
                let row = i % nrows;
                let col = Math.floor(i / nrows);
                mesh.position.y = 0.5 * bd * i;
                mesh.position.z = minz + (row * bxz);
                mesh.position.x = col * bxz;
                root.add(mesh);
            }
            return root;
        }
    });
    // disks models
    let dd = 0.05;  // depth of disks along y-axis
    let r = 0.5;    // radius of disks
    let offset = 3;  // offset of disks
    let sf = 0.25; // scale factor
    let rl = 2.0;   // radius (lofted)
    let hl = 1;     // height of disk y-axis (lofted)
    let offsetl = 6;  // offset (lofted)
    let twopi = 2 * Math.PI;
    models.set('disks', {
        'transformer': function(i, base, stringSystem, n) {
            let angleinc = twopi / base;
            let root = new THREE.Object3D();
            // root.position.y = dd;
            root.rotation.y = i * angleinc;
            stringSystem.scale.set(sf, 1 / base, sf);
            stringSystem.position.x = offset;
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let angleinc = twopi / base;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.CylinderGeometry(r, r, dd, 24);
                let mesh = new THREE.Mesh(geom, mat);
                let root2 = new THREE.Object3D();
                root2.rotation.y = i * angleinc;
                mesh.position.x = offset;
                root2.add(mesh);
                root.add(root2);
            }
            return root;
        }
    });
    models.set('disks lofted', {
        'transformer': function(i, base, stringSystem, n) {
            let angleinc = twopi / base;
            let root = new THREE.Object3D();
            root.position.y = i * hl + epsilon;
            root.rotation.y = i * angleinc;
            stringSystem.scale.set(sf, 1 / base, sf);
            stringSystem.position.x = offsetl;
            root.add(stringSystem);
            return root;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let angleinc = twopi / base;
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.CylinderGeometry(rl, rl, hl * i + epsilon, 24);
                let mesh = new THREE.Mesh(geom, mat);
                mesh.position.y = 0.5 * hl * i;
                let root2 = new THREE.Object3D();
                root2.rotation.y = i * angleinc;
                mesh.position.x = offsetl;
                root2.add(mesh);
                root.add(root2);
            }
            return root;
        }
    });
    let rs = 1;   // sphere radius
    let offsets = 5;  // sphere offset
    let sfs = 0.4;  // sphere scale factor
    let spherePositions = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 2, 0], [0, -2, 0], [2, 0, 0], [-2, 0, 0], [0, 0, 2], [0, 0, -2]];
    spherePositions = spherePositions.map(xyz => new THREE.Vector3(...xyz).multiplyScalar(offsets));
    models.set('spheres', {
        'transformer': function(i, base, stringSystem, n) {
            let p = spherePositions[i];
            stringSystem.position.set(p.x, p.y, p.z);
            stringSystem.scale.set(sfs, sfs, sfs);
            return stringSystem;
        },
        'digitsGraph': function(base, includeSet, mat) {
            let matArgs = {shininess: 80};
            let root = new THREE.Object3D();
            let matflag = mat;
            for (let i of includeSet) {
                if (!matflag) {
                    mat = new THREE.MeshPhongMaterial(matArgs);
                    mat.color = new THREE.Color().setHSL(i / base, 1.0, 0.5);
                }
                let geom = new THREE.SphereGeometry(rs, 24, 24);
                let mesh = new THREE.Mesh(geom, mat);
                let p = spherePositions[i];
                mesh.position.set(p.x, p.y, p.z);
                root.add(mesh);
            }
            return root;
        }
    });
}


let gui;
let maxBase = 10;

let controls = new function() {
    this.n = 1;
    this.base = 2;
    this.model = 'keyboard';
    this.color = '#3366ff';
    this.onecolor = false;
    for (let i = 0; i < maxBase; i++)
        this[i.toString()] = true;
}



function initGui() {
    gui = new dat.GUI();
    gui.add(controls, 'base', 2, maxBase).step(1).onChange(update);
    gui.add(controls, 'n', 1, maxLevels).step(1).onChange(update);
    let modelTypes = ['keyboard', 'keyboard lengthened', 'keyboard lofted', 'boxes', 'boxes lofted', 'squares', 'squares lofted', 'disks', 'disks lofted', 'spheres'];
    gui.add(controls, 'model', modelTypes).onChange(update);
    gui.addColor(controls, 'color');
    gui.add(controls, 'onecolor').name('one color').onChange(update);
}

let baseControls;

function update() {
    let base = controls.base;
    if (base != curBase) {
        for (let i = 0; i < curBase; i++)
            gui.remove(baseControls[i]);
        curBase = base;
        baseControls = [];
        for (let i = 0; i < base; i++) {
            controls[i.toString()] = true;
            baseControls.push(gui.add(controls, i.toString()).onChange(update));
        }
    }
    let includeSet = new Set();
    for (let i = 0; i < base; i++) {
        if (controls[i.toString()]) {
            includeSet.add(i);
        }
    }
    let mat = false;
    if (controls.onecolor) {
        // globalMat.color = new THREE.Color(controls.color);
        mat = globalMat;
    }
    if (stringSystem)
        scene.remove(stringSystem);
    let n = controls.n;
    let model = models.get(controls.model);
    let transformer = model.transformer;
    let digitsGraph = model.digitsGraph(base, includeSet, mat);
    stringSystem = makeStringSystem(n, base, transformer, digitsGraph, includeSet);
    scene.add(stringSystem);
}





function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
    renderer.setAnimationLoop(function () {
        if (controls.onecolor)
            globalMat.color = new THREE.Color(controls.color)
        let delta = clock.getDelta();
        cameraControls.update();
        renderer.render(scene, camera);
    });
    let canvasRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera( 40, canvasRatio, 1, 1000);
    camera.position.set(0, 0, 8);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.enableDamping = true; 
    cameraControls.dampingFactor = 0.03;
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


init();
initGui();
createScene();
// initGui();


