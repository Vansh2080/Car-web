
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ─── PHANTOM X1 ENGINE SETUP ──────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 768 ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 8, 40);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4.2, 1.6, 6.0);
camera.lookAt(0, 0.4, 0);

// ─── Lighting ─────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(5, 6, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 20;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
keyLight.shadow.bias = -0.0001;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xe0eaff, 1.5);
fillLight.position.set(-5, 3, -4);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xfff0dd, 2.5);
rimLight.position.set(0, 4, -6);
scene.add(rimLight);
const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
topLight.position.set(0, 8, 0);
scene.add(topLight);

// ─── Ground ───────────────────────────────────────
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.4, metalness: 0.3 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.5;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.PolarGridHelper(6, 32, 24, 128, 0x444466, 0x333355);
grid.position.y = -1.49;
scene.add(grid);

// ─── Orbit Controls ──────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.4, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI * 0.75;
controls.minPolarAngle = 0.3;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.update();

// ─── State & Animation Targets ────────────────────
let carModel = null;
let carParts = {};
const paintColors = [
  { main: 0x991111, accent: 0xcc2222, interior: 0x1a1414, name: 'Carmine Candy' },
  { main: 0xe8e0d0, accent: 0xf5f0e8, interior: 0x2a2520, name: 'Pearly Swirly' },
  { main: 0x333333, accent: 0x555555, interior: 0x1a1a1a, name: 'Torched Graphite' }
];
let currentVariant = 0;

let state = {
  turntable: true,
  doorLeft: false, doorRight: false,
  hood: false, hatch: false,
  spinWheels: false, drive: false,
  explode: false, wireframe: false
};

let stateAnim = { doorLeft: 0, doorRight: 0, hood: 0, hatch: 0 };
const animTargets = {
  doorLeftAngle: 0, doorRightAngle: 0,
  hoodAngle: 0, hatchAngle: 0,
  wheelRotation: 0,
  driveOffset: 0
};


// ??? LIGHTING MODES ????????????????????????????????
const lightingModes = {
  'studio': { ambient: 0.6, key: {c: 0xffffff, i: 3.5, p: [5, 5, 5]}, fill: {c: 0xe0eaff, i: 1.5, p: [-5, 3, 5]}, rim: {c: 0xfff0dd, i: 2.5, p: [0, 4, -5]}, top: {c: 0xffffff, i: 1.5, p: [0, 8, 0]}, exp: 1.2, ambC: 0xffffff },
  'day': { ambient: 1.2, key: {c: 0xfffaed, i: 5.0, p: [5, 8, 5]}, fill: {c: 0xaaccff, i: 2.0, p: [-5, 2, 5]}, rim: {c: 0xffffff, i: 1.0, p: [0, 3, -5]}, top: {c: 0xddeeff, i: 2.0, p: [0, 8, 0]}, exp: 1.0, ambC: 0xddeeff },
  'sunset': { ambient: 1.0, key: {c: 0xff6622, i: 4.0, p: [8, 2, 5]}, fill: {c: 0x221144, i: 1.5, p: [-5, 2, -2]}, rim: {c: 0xff9944, i: 2.0, p: [0, 3, -5]}, top: {c: 0x664444, i: 1.0, p: [0, 8, 0]}, exp: 1.1, ambC: 0x442222 },
  'night': { ambient: 0.3, key: {c: 0x334466, i: 1.5, p: [5, 5, 5]}, fill: {c: 0x111122, i: 0.5, p: [-5, 3, 5]}, rim: {c: 0xffddaa, i: 3.0, p: [-3, 2, -5]}, top: {c: 0x222244, i: 0.5, p: [0, 8, 0]}, exp: 0.8, ambC: 0x111122 }
};
let activeLightMode = 'studio';

function applyLightingMode(mode) {
  if (!lightingModes[mode]) return;
  activeLightMode = mode;
  const cfg = lightingModes[mode];
  
  ambientLight.color.setHex(cfg.ambC);
  keyLight.color.setHex(cfg.key.c); keyLight.position.set(...cfg.key.p);
  fillLight.color.setHex(cfg.fill.c); fillLight.position.set(...cfg.fill.p);
  rimLight.color.setHex(cfg.rim.c); rimLight.position.set(...cfg.rim.p);
  topLight.color.setHex(cfg.top.c); topLight.position.set(...cfg.top.p);
  
  document.querySelectorAll('.btn-light-mode').forEach(b => {
      if(b.dataset.mode) b.classList.toggle('active', b.dataset.mode === mode);
  });
  
  const slider = document.getElementById('light-slider');
  if (slider) slider.dispatchEvent(new Event('input'));
}

document.querySelectorAll('.btn-light-mode').forEach(b => {
    b.addEventListener('click', (e) => {
        if(e.target.dataset.mode) applyLightingMode(e.target.dataset.mode);
    });
});

// ??? PERFORMANCE MODE ??????????????????????????????
let perfModeActive = false;
function setPerfMode(active) {
  perfModeActive = active;
  const def = document.getElementById('default-specs');
  const perf = document.getElementById('perf-specs');
  if(def) def.style.display = active ? 'none' : 'block';
  if(perf) perf.style.display = active ? 'block' : 'none';
  
  const title = document.querySelector('#right-panel .section-title');
  if(title) title.textContent = active ? 'Engineering Data' : 'Vehicle Specs';
  
  const btnPerf1 = document.getElementById('btn-perf-mode');
  if(btnPerf1) btnPerf1.classList.toggle('active', active);
  const btnPerf2 = document.getElementById('mobile-btn-perf-mode');
  if(btnPerf2) btnPerf2.classList.toggle('active', active);
}

const btnPerf1 = document.getElementById('btn-perf-mode');
if(btnPerf1) btnPerf1.addEventListener('click', () => setPerfMode(!perfModeActive));
const btnPerf2 = document.getElementById('mobile-btn-perf-mode');
if(btnPerf2) btnPerf2.addEventListener('click', () => setPerfMode(!perfModeActive));

// ??? WALKAROUND ????????????????????????????????????
let walkaroundActive = false;
let walkaroundStep = 0;
let walkaroundTimeout = null;

function startWalkaround() {
  if (walkaroundActive) return;
  walkaroundActive = true;
  walkaroundStep = 0;
  
  if (typeof controls !== 'undefined') {
      controls.enableZoom = false;
      controls.enableRotate = false;
      controls.enablePan = false;
  }
  
  const b1 = document.getElementById('btn-walkaround');
  if (b1) b1.classList.add('active');
  const b2 = document.getElementById('mobile-btn-walkaround');
  if (b2) b2.classList.add('active');
  
  nextWalkaroundStep();
}

function stopWalkaround() {
  if (!walkaroundActive) return;
  walkaroundActive = false;
  
  if (walkaroundTimeout) clearTimeout(walkaroundTimeout);
  
  if (typeof controls !== 'undefined' && typeof origControlsState !== 'undefined') {
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = origControlsState.enablePan;
  }
  
  const b1 = document.getElementById('btn-walkaround');
  if (b1) b1.classList.remove('active');
  const b2 = document.getElementById('mobile-btn-walkaround');
  if (b2) b2.classList.remove('active');
}

function nextWalkaroundStep() {
  if (!walkaroundActive) return;
  
  const steps = [
    { pos: new THREE.Vector3(4.2, 1.6, 6.0), target: new THREE.Vector3(0, 0.4, 0), dur: 1500, mode: 'hero' },
    { pos: new THREE.Vector3(0, 0.4, 4.5), target: new THREE.Vector3(0, 0.3, 0), dur: 1500, mode: 'front' },
    { pos: new THREE.Vector3(-4.5, 0.5, 0), target: new THREE.Vector3(0, 0.3, 0), dur: 1500, mode: 'side' },
    { pos: new THREE.Vector3(0, 0.6, -4.0), target: new THREE.Vector3(0, 0.3, 0), dur: 1500, mode: 'back' },
    { mode: 'interior', dur: 1500 },
    { pos: new THREE.Vector3(4.2, 1.6, 6.0), target: new THREE.Vector3(0, 0.4, 0), dur: 1800, mode: 'hero_end' }
  ];
  
  if (walkaroundStep >= steps.length) {
    stopWalkaround();
    return;
  }
  
  const step = steps[walkaroundStep];
  walkaroundStep++;
  
  // Cleanup any highlights before the next step
  if (typeof highlightComponent === 'function') {
      if (typeof selectedComponentId !== 'undefined' && selectedComponentId !== null) {
          highlightComponent(selectedComponentId, false);
      }
      highlightComponent('interior', false);
  }
  
  // Clear selection cleanly without triggering walkaround abort
  if (window.PhantomEngine && typeof window.PhantomEngine.clearSelection === 'function') {
      let temp = walkaroundActive;
      walkaroundActive = false; // Temporarily bypass the safety abort in selectComponent
      window.PhantomEngine.clearSelection();
      walkaroundActive = temp;
  }

  if (step.mode === 'interior') {
     // Explicitly reuse the existing working Interior Showcase function!
     if (typeof focusOnComponent === 'function') {
         focusOnComponent('interior');
         if (typeof highlightComponent === 'function') highlightComponent('interior', true);
     }
     
     // focusOnComponent takes 1500ms. Wait that + 1200ms pause.
     walkaroundTimeout = setTimeout(() => {
         if (walkaroundActive) nextWalkaroundStep();
     }, 2700);
     return;
  }
  
  let endPos = step.pos;
  let endTarget = step.target;
  
  if (typeof animateCameraTransition === 'function') {
      animateCameraTransition(endPos, endTarget, step.dur, () => {
        if (walkaroundActive) {
           walkaroundTimeout = setTimeout(() => {
               if (walkaroundActive) nextWalkaroundStep();
           }, 1200);
        }
      });
  }
}

const bw1 = document.getElementById('btn-walkaround');
if(bw1) bw1.addEventListener('click', () => { if (walkaroundActive) stopWalkaround(); else startWalkaround(); });
const bw2 = document.getElementById('mobile-btn-walkaround');
if(bw2) bw2.addEventListener('click', () => { if (walkaroundActive) stopWalkaround(); else startWalkaround(); });

if (typeof renderer !== 'undefined' && renderer.domElement) {
  renderer.domElement.addEventListener('pointerdown', () => {
     if (walkaroundActive) {
        stopWalkaround();
        if (typeof focusAnimFrame !== 'undefined' && focusAnimFrame) cancelAnimationFrame(focusAnimFrame);
     }
  });
}

// ─── PHANTOM X1 ENGINE: PUBLIC API & METADATA ─────
let explodeAmount = 0;
let targetExplodeAmount = 0;
let selectedComponentId = null;
let hoveredComponentId = null;

const phantomComponents = {
  engine: { id: 'engine', displayName: "V8 Hybrid Powertrain", nodes: ["Engine"], desc: "High-performance hybrid power unit." },
  brakes: { id: 'brakes', displayName: "Carbon Ceramic Brakes", nodes: ["WheelFrontLBrakeDisc", "WheelFrontLBrakePad", "WheelFrontRBrakeDisc", "WheelFrontRBrakePad", "WheelRearLBrakeDisc", "WheelRearLBrakePad", "WheelRearRBrakeDisc", "WheelRearRBrakePad"], desc: "Track-focused braking system." },
  suspension: { id: 'suspension', displayName: "Active Suspension", nodes: ["Axles"], desc: "Adaptive ride dynamics." },
  wheels: { id: 'wheels', displayName: "Forged Aero Wheels", nodes: ["WheelFrontL", "WheelFrontR", "WheelRearL", "WheelRearR"], desc: "Aerodynamic forged alloys." },
  doors: { id: 'doors', displayName: "Dihedral Doors", nodes: ["BodyDoorLColor1", "BodyDoorRColor1"], desc: "Signature entry system." },
  hood: { id: 'hood', displayName: "Aero Hood", nodes: ["BodyHood"], desc: "Front aerodynamic channeling." },
  hatch: { id: 'hatch', displayName: "Rear Engine Cover", nodes: ["BodyRearPanelsColor1"], desc: "Ventilated powertrain enclosure." },
  interior: { id: 'interior', displayName: "Performance Cockpit", nodes: ["InteriorSeatsColor1", "InteriorSeatsColor2", "InteriorSeatsFrame1", "InteriorSeatsFrame2", "InteriorDashMid", "InteriorDashSides", "InteriorFloor", "InteriorFloormats", "InteriorMid", "InteriorSteeringBase", "InteriorSteeringCylinder", "InteriorSteeringDash", "InteriorSteeringDashColumn", "InteriorSteeringHandleL", "InteriorSteeringHandleR", "InteriorPedalAccel", "InteriorPedalAccelArm", "InteriorPedalBrake", "InteriorPedalBrakeArm", "InteriorCage", "InteriorPillar"], desc: "Driver-focused command center." },
  exterior: { id: 'exterior', displayName: "Aero Body", nodes: ["BodyRoofPanel", "BodyPillars", "BodyPanelsColor2", "BodyWindshield", "BodyWindshieldGasket", "BodyWindshieldWipers", "BodyWindshieldWipersBase"], desc: "Low-drag aerodynamic exterior." },
  chassis: { id: 'chassis', displayName: "Carbon Monocoque", nodes: ["BodyUnderside"], desc: "Ultra-lightweight structural core." }
};

const selectableMeshes = [];
const meshToComponentMap = new Map();
const originalMaterials = new Map();

window.PhantomEngine = {
  setExplodeAmount: (val) => {
    explodeAmount = Math.max(0, Math.min(1, val));
    targetExplodeAmount = explodeAmount;
    window.dispatchEvent(new CustomEvent("explodeProgressChanged", { detail: explodeAmount }));
  },
  getExplodeAmount: () => explodeAmount,
  resetExplodedView: () => window.PhantomEngine.setExplodeAmount(0),
  focusOnComponent: (id) => focusOnComponent(id),
  selectComponent: (id) => selectComponent(id),
  clearSelection: () => selectComponent(null)
};

// ─── LOAD MODEL & DISCOVER PARTS ──────────────────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const loadingEl = document.getElementById('loading');

function storeOriginalTransform(node) {
  if (!node.userData.origTransform) {
    node.userData.origTransform = {
      position: node.position.clone(),
      rotation: node.rotation.clone(),
      scale: node.scale.clone()
    };
  }
}

gltfLoader.load(
  'CarConcept.glb',
  (gltf) => {
    carModel = gltf.scene;
    window.carModel_debug = carModel;
    window.THREE_debug = THREE;
    scene.add(carModel);

    const findNode = (root, name) => {
      if (root.name === name) return root;
      for (const child of root.children) {
        const found = findNode(child, name);
        if (found) return found;
      }
      return null;
    };

    carParts.doorLeft  = findNode(carModel, 'BodyDoorLColor1');
    carParts.doorRight = findNode(carModel, 'BodyDoorRColor1');
    carParts.hood      = findNode(carModel, 'BodyHood');
    carParts.hatch     = findNode(carModel, 'BodyRearPanelsColor1');
    carParts.wheelFL   = findNode(carModel, 'WheelFrontL');
    carParts.wheelFR   = findNode(carModel, 'WheelFrontR');
    carParts.wheelRL   = findNode(carModel, 'WheelRearL');
    carParts.wheelRR   = findNode(carModel, 'WheelRearR');
    carParts.steering  = findNode(carModel, 'InteriorSteeringCylinder');
    carParts.engine    = findNode(carModel, 'Engine');
    carParts.chassis   = findNode(carModel, 'BodyUnderside');
    carParts.axles     = findNode(carModel, 'Axles');

    // Store original transforms for EVERYTHING to prevent drift
    carModel.traverse(node => storeOriginalTransform(node));

    // Setup Phantom Components Raycasting
    Object.values(phantomComponents).forEach(comp => {
      comp.meshes = [];
      comp.nodes.forEach(nodeName => {
        const node = findNode(carModel, nodeName);
        if (node) {
          node.traverse(child => {
            if (child.isMesh) {
              if (!meshToComponentMap.has(child)) {
                selectableMeshes.push(child);
                comp.meshes.push(child);
                meshToComponentMap.set(child, comp.id);
                // Save original material properties for highlighting
                if (child.material) {
                  const m = child.material;
                  originalMaterials.set(child, {
                    emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0x000000),
                    color: m.color ? m.color.clone() : new THREE.Color(0xffffff)
                  });
                }
              }
            }
          });
        }
      });
    });

    // Fix priority for brakes so they override wheels assignment
    const brakesNodeNames = phantomComponents.brakes.nodes;
    brakesNodeNames.forEach(bn => {
        const node = findNode(carModel, bn);
        if(node) {
            node.traverse(child => {
                if(child.isMesh) {
                    meshToComponentMap.set(child, 'brakes');
                    if(!phantomComponents.brakes.meshes.includes(child)) phantomComponents.brakes.meshes.push(child);
                    phantomComponents.wheels.meshes = phantomComponents.wheels.meshes.filter(m => m !== child);
                }
            });
        }
    });

    // Find body paint meshes
    const paintMeshes = [];
    carModel.traverse(node => {
      if (node.isMesh && node.material) {
        const matName = (node.material.name || '').toLowerCase();
        if (matName.includes('paint') || matName.includes('panel')) {
          paintMeshes.push({ mesh: node });
        }
      }
    });
    carParts.paintMeshes = paintMeshes;

    // Center and scale model
    const box = new THREE.Box3().setFromObject(carModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.5 / maxDim;
    carModel.scale.setScalar(scale);
    carModel.position.set(-center.x * scale, -center.y * scale + 0.2, -center.z * scale);
    storeOriginalTransform(carModel); // re-store root after scale/center

    carModel.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        if (node.material) {
          const matName = (node.material.name || '').toLowerCase();
          if (matName.includes('paint') || matName.includes('panel')) {
            node.material.roughness = 0.15;
            node.material.metalness = 0.7;
            node.material.clearcoat = 1.0;
            node.material.clearcoatRoughness = 0.05;
          } else if (matName.includes('glass') || matName.includes('window')) {
            node.material.transparent = true;
            node.material.opacity = 0.85;
            node.material.roughness = 0.05;
            node.material.metalness = 0.9;
            node.material.clearcoat = 1.0;
            node.material.depthWrite = false;
          } else if (matName.includes('tire') || matName.includes('rubber')) {
            node.material.roughness = 0.9;
            node.material.metalness = 0.1;
            node.material.color.setHex(0x181818);
          } else if (matName.includes('rim') || matName.includes('hardware') || matName.includes('mechanical')) {
            node.material.roughness = 0.25;
            node.material.metalness = 0.85;
          } else if (matName.includes('brake') || matName.includes('disc')) {
            node.material.roughness = 0.5;
            node.material.metalness = 0.6;
          } else if (matName.includes('interior') || matName.includes('dash') || matName.includes('floormat')) {
            node.material.roughness = 0.8;
            node.material.metalness = 0.1;
          } else if (matName.includes('light')) {
            node.material.roughness = 0.2;
            node.material.metalness = 0.4;
          }
          
          const orig = originalMaterials.get(node);
          if (orig) {
             orig.emissive = node.material.emissive ? node.material.emissive.clone() : new THREE.Color(0x000000);
             orig.color = node.material.color ? node.material.color.clone() : new THREE.Color(0xffffff);
          }
        }
      }
    });

    loadingEl.classList.add('hidden');
    setTimeout(() => loadingEl.remove(), 500);
  },
  (progress) => {
    const pct = Math.round((progress.loaded / progress.total) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = `Loading 3D Model... ${pct}%`;
  },
  (error) => console.error('Model load error:', error)
);

// ─── COMPONENT SELECTION & HIGHLIGHT ─────────────
function highlightComponent(id, isSelected) {
  Object.values(phantomComponents).forEach(comp => {
    comp.meshes.forEach(mesh => {
      const orig = originalMaterials.get(mesh);
      if (!orig || !mesh.material) return;
      
      const isTarget = (comp.id === id);
      if (isTarget) {
        mesh.material.emissive = orig.emissive.clone().add(new THREE.Color(isSelected ? 0x1a1a24 : 0x0a0a10));
      } else {
        mesh.material.emissive = orig.emissive.clone();
      }
    });
  });
}

let originalRightPanelHTML = '';
const rightPanel = document.getElementById('right-panel');
if (rightPanel) originalRightPanelHTML = rightPanel.innerHTML;

function updateComponentInfoPanel(comp) {
  if (!rightPanel) return;
  if (!comp) {
    rightPanel.innerHTML = originalRightPanelHTML;
    const specPaint = document.getElementById('spec-paint');
    if (specPaint) specPaint.textContent = paintColors[currentVariant].name;
    return;
  }
  
  let specsHtml = '';
  if (comp.specs) {
    comp.specs.forEach(s => {
      specsHtml += `<div class="spec-item"><span class="spec-label">${s.label}</span><span class="spec-value">${s.value}</span></div>`;
    });
  }
  
  rightPanel.innerHTML = `
    <div class="section-title">${comp.displayName.toUpperCase()}</div>
    <div style="font-weight:700; font-size:12px; margin-bottom:4px; color:var(--accent);">${comp.category || 'Component Data'}</div>
    <div style="font-size:11px; color:var(--text-muted); line-height:1.4; margin-bottom:12px;">${comp.func || comp.desc}</div>
    <div class="divider"></div>
    ${specsHtml}
  `;
}

const origControlsState = {
  minDistance: 2,
  maxDistance: 10,
  enablePan: true
};

function selectComponent(id) {
  if (typeof stopWalkaround === 'function' && walkaroundActive) stopWalkaround();
  if (selectedComponentId === id) return;
  const oldId = selectedComponentId;
  selectedComponentId = id;
  
  if (oldId) window.dispatchEvent(new CustomEvent("componentDeselected", { detail: phantomComponents[oldId] }));
  
  if (id) {
    document.querySelectorAll('.btn[data-inspect]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.btn[data-inspect="${id}"]`).forEach(b => b.classList.add('active'));
    highlightComponent(id, true);
    window.dispatchEvent(new CustomEvent("componentSelected", { detail: phantomComponents[id] }));
    updateComponentInfoPanel(phantomComponents[id]);
    setPerfMode(false);
    focusOnComponent(id);
  } else {
    controls.minDistance = origControlsState.minDistance;
    controls.maxDistance = origControlsState.maxDistance;
    controls.enablePan = origControlsState.enablePan;
    highlightComponent(hoveredComponentId, false);
    updateComponentInfoPanel(null);
  }
}

let focusAnimFrame = null;
let isCameraTransitioning = false;
function focusOnComponent(id) {
  if (!id || !phantomComponents[id]) return;
  const comp = phantomComponents[id];
  if (!comp.meshes || comp.meshes.length === 0) return;

  const box = new THREE.Box3();
  let meshesToBox = comp.meshes;
  
  if (['wheels', 'brakes', 'doors'].includes(id)) {
    const leftMeshes = comp.meshes.filter(m => (m.name||'').includes('L') || (m.parent && m.parent.name.includes('L')));
    if (leftMeshes.length > 0) meshesToBox = leftMeshes;
  }
  
  meshesToBox.forEach(m => box.expandByObject(m));
  
  const center = new THREE.Vector3(); box.getCenter(center);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  let endPos, endTarget;
  if (comp.id === 'interior') {
    endPos = new THREE.Vector3(0, 0.7, 1.2);
    endTarget = new THREE.Vector3(0, 0.3, -0.5);
  } else if (comp.id === 'chassis') {
    endTarget = center.clone();
    endPos = center.clone().add(new THREE.Vector3(-3.0, -0.5, 3.5));
    if (endPos.y < 0.2) endPos.y = 0.2;
  } else {
    let dir = center.clone();
    if (dir.lengthSq() < 0.001) dir.set(1, 0.5, 1);
    
    if (comp.id === 'engine') dir.set(0, 0.5, -1);
    else if (comp.id === 'hood') dir.set(0, 0.5, 1);
    else if (comp.id === 'hatch') dir.set(0, 0.5, -1);
    else if (['wheels', 'brakes', 'doors'].includes(comp.id)) {
      dir.set(center.x > 0 ? 1 : -1, 0.2, 0);
    }
    
    dir.normalize();
    const distance = Math.max(maxDim * 1.5, 1.5);
    endPos = center.clone().add(dir.multiplyScalar(distance));
    if (endPos.y < 0.2) endPos.y = 0.2;
    endTarget = center.clone();
  }
  
  animateCameraTransition(endPos, endTarget, 1500, () => {
    window.dispatchEvent(new CustomEvent("cameraFocusCompleted", { detail: comp }));
  });
}

function animateCameraTransition(endPos, endTarget, duration=1500, onComplete=null) {
  if (focusAnimFrame) cancelAnimationFrame(focusAnimFrame);
  
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  const wasAutoRotate = controls.autoRotate;
  controls.autoRotate = false;
  isCameraTransitioning = true; // Suspend OrbitControls

  function anim(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1.0);
    const ease = t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

    if (endPos) camera.position.lerpVectors(startPos, endPos, ease);
    if (endTarget) controls.target.lerpVectors(startTarget, endTarget, ease);
    
    // Do NOT call controls.update() here, it will overwrite camera.position!
    // Just lookAt the target so the camera orientation is correct during flight.
    if (endTarget) camera.lookAt(controls.target);

    if (t < 1) {
      focusAnimFrame = requestAnimationFrame(anim);
    } else {
      isCameraTransitioning = false; // Re-enable OrbitControls
      controls.update(); // Synchronize spherical coords with the new camera position
      if (state.turntable) controls.autoRotate = wasAutoRotate;
      if (onComplete) onComplete();
    }
  }
  focusAnimFrame = requestAnimationFrame(anim);
}

// ─── RAYCASTER ────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerDownTime = 0;
let lastMoveTime = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownTime = performance.now();
});

renderer.domElement.addEventListener('pointermove', (e) => {
  const now = performance.now();
  if (now - lastMoveTime < 50) return; // throttle raycasting
  lastMoveTime = now;

  if (!carModel || selectableMeshes.length === 0) return;
  
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(selectableMeshes, false);
  
  let newHover = null;
  if (intersects.length > 0) {
    newHover = meshToComponentMap.get(intersects[0].object) || null;
  }
  
  if (newHover !== hoveredComponentId) {
    hoveredComponentId = newHover;
    if (!selectedComponentId) highlightComponent(hoveredComponentId, false);
    updateComponentInfoPanel(null);
    if (newHover) {
      window.dispatchEvent(new CustomEvent("componentHover", { detail: phantomComponents[newHover] }));
      renderer.domElement.style.cursor = 'pointer';
    } else {
      renderer.domElement.style.cursor = 'default';
    }
  }
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (performance.now() - pointerDownTime < 250) {
    if (hoveredComponentId) {
      selectComponent(hoveredComponentId);
    } else {
      selectComponent(null);
    }
  }
});

// ─── ANIMATION LOOP ──────────────────────────────
const clock = new THREE.Clock();
let fpsFrames = 0, fpsTime = 0;

function applyVariant(index) {
  currentVariant = index;
  const paint = paintColors[index];
  if (carParts.paintMeshes) {
    carParts.paintMeshes.forEach(({ mesh }) => {
      if (mesh.material && mesh.material.color) {
        const matName = (mesh.material.name || '').toLowerCase();
        if (matName.includes('paint') || matName.includes('body') || matName.includes('panel')) {
          mesh.material.color.set(paint.main);
        }
      }
    });
  }
  if (carModel) {
    carModel.traverse(node => {
      if (node.isMesh && node.material && node.material.color) {
        const matName = (node.material.name || '').toLowerCase();
        if (matName.includes('interior') || matName.includes('dashboard')) {
          node.material.color.set(paint.interior);
        }
      }
    });
  }
  const specPaint = document.getElementById('spec-paint');
  if (specPaint) specPaint.textContent = paint.name;
  const mobSpecPaint = document.getElementById('mobile-spec-paint');
  if (mobSpecPaint) mobSpecPaint.textContent = paint.name;
}

const stateKeyMap = {
  'door-left': 'doorLeft', 'door-right': 'doorRight',
  'spin-wheels': 'spinWheels', 'drive': 'drive',
  'hood': 'hood', 'hatch': 'hatch',
  'explode': 'explode', 'turntable': 'turntable', 'orbit': 'orbit',
};

document.querySelectorAll('.btn[data-inspect]').forEach(btn => {
    btn.addEventListener('click', () => {
      const compId = btn.dataset.inspect;
      
      // Update button visual states
      document.querySelectorAll('.btn[data-inspect]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.btn[data-inspect="${compId}"]`).forEach(b => b.classList.add('active'));
      
      selectComponent(compId);
    });
  });

  document.querySelectorAll('.btn[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const isToggle = btn.dataset.toggle === 'true';

    if (isToggle) {
      btn.classList.toggle('active');
      const active = btn.classList.contains('active');
      const stateKey = stateKeyMap[action] || action.replace(/-/g, '');
      if (state.hasOwnProperty(stateKey)) state[stateKey] = active;

      if (action === 'drive' && active) {
        document.querySelector('.btn[data-action="explode"]')?.classList.remove('active');
        state.explode = false; targetExplodeAmount = 0;
      }
      if (action === 'explode') {
        if (active) {
          document.querySelector('.btn[data-action="drive"]')?.classList.remove('active');
          state.drive = false;
        }
        targetExplodeAmount = active ? 1 : 0;
      }
      syncQuickButtons();
    }

    switch (action) {
      case 'turntable':
        state.turntable = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.0;
        document.querySelector('.btn[data-action="turntable"]').classList.add('active');
        document.querySelector('.btn[data-action="orbit"]').classList.remove('active');
        break;
      case 'orbit':
        state.turntable = false; controls.autoRotate = false;
        document.querySelector('.btn[data-action="orbit"]').classList.add('active');
        document.querySelector('.btn[data-action="turntable"]').classList.remove('active');
        break;
      case 'reset-all': resetAll(); break;
      case 'cam-front': animateCameraTransition(new THREE.Vector3(0, 0.4, 4.5), new THREE.Vector3(0, 0.3, 0)); break;
      case 'cam-back': animateCameraTransition(new THREE.Vector3(0, 0.6, -4.0), new THREE.Vector3(0, 0.3, 0)); break;
      case 'cam-side': animateCameraTransition(new THREE.Vector3(5.0, 0.4, 0), new THREE.Vector3(0, 0.3, 0)); break;
      case 'cam-top': animateCameraTransition(new THREE.Vector3(0, 5.5, 0.5), new THREE.Vector3(0, 0.3, 0)); break;
      case 'cam-interior': animateCameraTransition(new THREE.Vector3(0, 0.7, 1.2), new THREE.Vector3(0, 0.3, -0.5)); break;
    }
  });
});

document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const variant = parseInt(swatch.dataset.variant);
    document.querySelectorAll('.color-swatch').forEach((s) => {
      s.classList.toggle('active', parseInt(s.dataset.variant) === variant);
    });
    applyVariant(variant);
  });
});

const lightSlider = document.getElementById('light-slider');
if (lightSlider) {
  lightSlider.addEventListener('input', () => {
    const val = parseInt(lightSlider.value);
    document.getElementById('light-val').textContent = val + '%';
    const factor = val / 100;
    const cfg = lightingModes[activeLightMode];
    keyLight.intensity = cfg.key.i * factor;
    fillLight.intensity = cfg.fill.i * factor;
    rimLight.intensity = cfg.rim.i * factor;
    topLight.intensity = cfg.top.i * factor;
    ambientLight.intensity = cfg.ambient * factor;
    renderer.toneMappingExposure = cfg.exp * factor;
    const mobSlider = document.getElementById('mobile-light-slider');
    if(mobSlider && mobSlider.value != val) {
        mobSlider.value = val;
        const mobVal = document.getElementById('mobile-light-val');
        if(mobVal) mobVal.textContent = val + '%';
    }
  });
}
const mobileLightSlider = document.getElementById('mobile-light-slider');
if (mobileLightSlider) {
  mobileLightSlider.addEventListener('input', () => {
      if(lightSlider) {
          lightSlider.value = mobileLightSlider.value;
          lightSlider.dispatchEvent(new Event('input'));
      }
  });
}

document.getElementById('btn-screenshot')?.addEventListener('click', takeScreenshot);
document.getElementById('mobile-btn-screenshot')?.addEventListener('click', takeScreenshot);
function takeScreenshot() {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = 'phantom-x1.png';
  link.href = renderer.domElement.toDataURL('image/png');
  link.click();
}

document.getElementById('btn-wireframe')?.addEventListener('click', toggleWireframe);
document.getElementById('mobile-btn-wireframe')?.addEventListener('click', toggleWireframe);
function toggleWireframe(e) {
  state.wireframe = !state.wireframe;
  document.getElementById('btn-wireframe').classList.toggle('active', state.wireframe);
  document.getElementById('mobile-btn-wireframe')?.classList.toggle('active', state.wireframe);
  if (carModel) {
    carModel.traverse(node => {
      if (node.isMesh && node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach(m => { if (m.wireframe !== undefined) m.wireframe = state.wireframe; });
        } else {
          node.material.wireframe = state.wireframe;
        }
      }
    });
  }
}

document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);
document.getElementById('mobile-btn-fullscreen')?.addEventListener('click', toggleFullscreen);
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.body.requestFullscreen();
}

function resetAll() {
  document.querySelectorAll('.btn[data-inspect]').forEach(b => b.classList.remove('active'));
  if (walkaroundActive) stopWalkaround();
  setPerfMode(false);
  applyLightingMode('studio');
  if (walkaroundActive) stopWalkaround();
  setPerfMode(false);
  applyLightingMode('studio');
  state.doorLeft = state.doorRight = state.hood = state.hatch = false;
  state.spinWheels = state.drive = state.explode = false;
  state.wireframe = false;
  state.turntable = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.0;

  document.querySelectorAll('.btn.active').forEach(b => b.classList.remove('active'));
  document.querySelector('.btn[data-action="turntable"]').classList.add('active');
  document.getElementById('btn-wireframe').classList.remove('active');
  document.getElementById('mobile-btn-wireframe')?.classList.remove('active');

  stateAnim.doorLeft = stateAnim.doorRight = stateAnim.hood = stateAnim.hatch = 0;
  animTargets.doorLeftAngle = animTargets.doorRightAngle = 0;
  animTargets.hoodAngle = animTargets.hatchAngle = 0;
  animTargets.wheelRotation = 0;
  animTargets.driveOffset = 0;
  targetExplodeAmount = 0;

  if (carModel) {
    carModel.traverse(node => {
      if (node.userData.origTransform) {
        node.position.copy(node.userData.origTransform.position);
        node.rotation.copy(node.userData.origTransform.rotation);
        node.scale.copy(node.userData.origTransform.scale);
      }
      if (node.isMesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach(m => { if (m.wireframe !== undefined) m.wireframe = false; });
      }
    });
  }

  applyVariant(0);
  document.querySelectorAll('.color-swatch').forEach((s) => s.classList.toggle('active', parseInt(s.dataset.variant) === 0));
  if(lightSlider) { lightSlider.value = 100; lightSlider.dispatchEvent(new Event('input')); }
  else { keyLight.intensity = 3.5; fillLight.intensity = 1.5; rimLight.intensity = 2.5; topLight.intensity = 1.5; ambientLight.intensity = 0.6; renderer.toneMappingExposure = 1.2; }
  animateCameraTransition(new THREE.Vector3(4.2, 1.6, 6.0), new THREE.Vector3(0, 0.4, 0));
  syncQuickButtons();
  window.PhantomEngine.clearSelection();
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const keyMap = {
    '1': 'cam-front', '2': 'cam-back', '3': 'cam-side', '4': 'cam-top', '5': 'cam-interior',
    'r': 'reset-all', 'f': 'fullscreen', 'w': 'wireframe',
    'q': 'door-left', 'e': 'door-right', 'h': 'hood', 't': 'hatch',
    's': 'spin-wheels', 'd': 'drive', 'x': 'explode'
  };
  const action = keyMap[e.key.toLowerCase()];
  if (action) {
    if (action.startsWith('cam-')) animateCameraTransition(null, null); // Just for intercept, correct handled by button click simulation below
    if (action === 'reset-all') resetAll();
    else if (action === 'fullscreen') toggleFullscreen();
    else if (action === 'wireframe') toggleWireframe();
    else {
      const btn = document.querySelector(`.btn[data-action="${action}"]`);
      if (btn) btn.click();
    }
  }
});

function syncQuickButtons() {
  document.querySelectorAll('.quick-btn').forEach(qb => {
    const action = qb.dataset.quick;
    const mappedKey = { 'door-left': 'doorLeft', 'door-right': 'doorRight', 'spin-wheels': 'spinWheels', 'reset-all': null }[action];
    if (mappedKey) qb.classList.toggle('active', !!state[mappedKey]);
  });
}

// Mobile Sheet Logic
const bottomSheet = document.getElementById('bottom-sheet');
const sheetHandle = document.getElementById('sheet-handle');
let sheetExpanded = false;
let touchStartY = 0;

function toggleSheet(expand) {
  if (!bottomSheet) return;
  sheetExpanded = typeof expand === 'boolean' ? expand : !sheetExpanded;
  bottomSheet.classList.toggle('expanded', sheetExpanded);
  bottomSheet.classList.toggle('collapsed', !sheetExpanded);
}
function collapseSheet() {
  if (!bottomSheet) return;
  sheetExpanded = false;
  bottomSheet.classList.remove('expanded');
  bottomSheet.classList.add('collapsed');
}
if(sheetHandle) sheetHandle.addEventListener('click', () => toggleSheet());
let canvasTapStart = 0;
renderer.domElement.addEventListener('pointerdown', () => canvasTapStart = Date.now());
renderer.domElement.addEventListener('pointerup', (e) => {
  if (sheetExpanded && window.innerWidth <= 768 && Date.now() - canvasTapStart < 200) {
    collapseSheet();
    e.stopPropagation();
  }
  canvasTapStart = 0;
});
if(sheetHandle) sheetHandle.addEventListener('pointerdown', (e) => { touchStartY = e.clientY; e.stopPropagation(); });
document.addEventListener('pointermove', (e) => {
  if (touchStartY && window.innerWidth <= 768) {
    const deltaY = e.clientY - touchStartY;
    if (Math.abs(deltaY) > 10) {
      if (deltaY > 40) collapseSheet();
      else if (deltaY < -40) toggleSheet(true);
    }
  }
});
document.addEventListener('pointerup', () => touchStartY = 0);
const sheetContent = document.querySelector('.sheet-content');
if (sheetContent) sheetContent.addEventListener('pointerdown', (e) => {
  if (sheetContent.scrollTop <= 0) touchStartY = e.clientY;
});
document.querySelectorAll('.sheet-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const paneId = tab.dataset.pane;
    document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sheet-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(paneId).classList.add('active');
    if (!sheetExpanded) toggleSheet(true);
  });
});
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.quick;
    const desktopBtn = document.querySelector(`.btn[data-action="${action}"]`);
    if (desktopBtn) desktopBtn.click();
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const smoothstep = (min, max, value) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const lerpSpeed = 5.0;

  fpsFrames++; fpsTime += dt;
  if (fpsTime >= 0.5) {
    const fpsBadge = document.getElementById('fps-badge');
    if (fpsBadge) fpsBadge.textContent = Math.round(fpsFrames / fpsTime) + ' FPS';
    fpsFrames = 0; fpsTime = 0;
  }

  if (targetExplodeAmount !== explodeAmount) {
     explodeAmount += (targetExplodeAmount - explodeAmount) * lerpSpeed * dt;
     if (Math.abs(targetExplodeAmount - explodeAmount) < 0.001) explodeAmount = targetExplodeAmount;
     window.dispatchEvent(new CustomEvent("explodeProgressChanged", { detail: explodeAmount }));
  }

  const easeSpeed = 4.0;
  stateAnim.doorLeft += ((state.doorLeft ? 1 : 0) - stateAnim.doorLeft) * easeSpeed * dt;
  stateAnim.doorRight += ((state.doorRight ? 1 : 0) - stateAnim.doorRight) * easeSpeed * dt;
  stateAnim.hood += ((state.hood ? 1 : 0) - stateAnim.hood) * easeSpeed * dt;
  stateAnim.hatch += ((state.hatch ? 1 : 0) - stateAnim.hatch) * easeSpeed * dt;
  
  animTargets.doorLeftAngle = smoothstep(0, 1, stateAnim.doorLeft) * Math.PI * 0.6;
  animTargets.doorRightAngle = smoothstep(0, 1, stateAnim.doorRight) * Math.PI * 0.6;
  animTargets.hoodAngle = smoothstep(0, 1, stateAnim.hood) * Math.PI * 0.5;
  animTargets.hatchAngle = smoothstep(0, 1, stateAnim.hatch) * Math.PI * 0.55;

  if (state.spinWheels || state.drive) animTargets.wheelRotation += dt * 8;
  if (state.drive) animTargets.driveOffset += dt * 0.8;

  if (carModel) {
    const rootOrig = carModel.userData.origTransform;
    carModel.position.copy(rootOrig.position);
    if (state.drive) carModel.position.x += Math.sin(animTargets.driveOffset * Math.PI) * 2.0;

    const s1 = smoothstep(0.0, 0.20, explodeAmount);
    const s2 = smoothstep(0.20, 0.45, explodeAmount);
    const s3 = smoothstep(0.45, 0.70, explodeAmount);
    const s4 = smoothstep(0.70, 1.00, explodeAmount);

    if (carParts.doorLeft && carParts.doorLeft.userData.origTransform) {
      const orig = carParts.doorLeft.userData.origTransform;
      carParts.doorLeft.position.copy(orig.position).x += s1 * 1.5;
      carParts.doorLeft.rotation.copy(orig.rotation);
      carParts.doorLeft.rotation.y += animTargets.doorLeftAngle;
    }
    if (carParts.doorRight && carParts.doorRight.userData.origTransform) {
      const orig = carParts.doorRight.userData.origTransform;
      carParts.doorRight.position.copy(orig.position).x -= s1 * 1.5;
      carParts.doorRight.rotation.copy(orig.rotation);
      carParts.doorRight.rotation.y -= animTargets.doorRightAngle;
    }

    if (carParts.hood && carParts.hood.userData.origTransform) {
      const orig = carParts.hood.userData.origTransform;
      carParts.hood.position.copy(orig.position);
      carParts.hood.position.z += s1 * 0.8;
      carParts.hood.position.y -= s1 * 0.5;
      carParts.hood.rotation.copy(orig.rotation);
      carParts.hood.rotation.x -= animTargets.hoodAngle;
    }

    if (carParts.hatch && carParts.hatch.userData.origTransform) {
      const orig = carParts.hatch.userData.origTransform;
      carParts.hatch.position.copy(orig.position);
      carParts.hatch.position.z += s1 * 0.7;
      carParts.hatch.position.y += s1 * 0.4;
      carParts.hatch.rotation.copy(orig.rotation);
      carParts.hatch.rotation.x += animTargets.hatchAngle;
    }

    if (carParts.engine && carParts.engine.userData.origTransform) {
      const orig = carParts.engine.userData.origTransform;
      carParts.engine.position.copy(orig.position);
      carParts.engine.position.z += (s3 + s4*0.2) * 0.8;
      carParts.engine.position.y += (s3 + s4*0.2) * 0.3;
    }

    if (carParts.chassis && carParts.chassis.userData.origTransform) {
      const orig = carParts.chassis.userData.origTransform;
      carParts.chassis.position.copy(orig.position);
      carParts.chassis.position.z -= (s3 + s4*0.2) * 0.4;
    }
    if (carParts.axles && carParts.axles.userData.origTransform) {
      const orig = carParts.axles.userData.origTransform;
      carParts.axles.position.copy(orig.position);
      carParts.axles.position.z -= (s3 + s4*0.2) * 0.5;
    }

    const wheelsData = [
      { node: carParts.wheelFL, dir: 1 },
      { node: carParts.wheelRL, dir: 1 },
      { node: carParts.wheelFR, dir: -1 },
      { node: carParts.wheelRR, dir: -1 }
    ];
    
    wheelsData.forEach(wd => {
      if (!wd.node) return;
      wd.node.children.forEach(child => {
        if (!child.userData.origTransform) return;
        const orig = child.userData.origTransform;
        child.position.copy(orig.position);
        child.rotation.copy(orig.rotation);

        const name = (child.name || '').toLowerCase();
        const isBrake = name.includes('brake');
        
        if (isBrake) {
          child.position.x += wd.dir * (s2 * 0.8 + s3 * 0.2); 
        } else {
          child.position.x += wd.dir * (s2 * 1.2 + s3 * 0.6);
          child.rotation.x = orig.rotation.x + animTargets.wheelRotation;
        }
      });
    });

    if (carParts.steering && carParts.steering.userData.origTransform) {
      carParts.steering.rotation.copy(carParts.steering.userData.origTransform.rotation);
      if (state.spinWheels) carParts.steering.rotation.z += animTargets.wheelRotation * 0.3;
    }
  }

  if (!isCameraTransitioning) controls.update();
  renderer.render(scene, camera);
}
animate();


