const fs = require('fs');
const code = fs.readFileSync('index.html', 'utf8');

const newPhantomComponents = `const phantomComponents = {
  engine: { 
    id: 'engine', displayName: "V8 Hybrid Powertrain", nodes: ["Engine"], 
    category: "Powertrain",
    func: "Primary propulsion system responsible for converting stored energy into mechanical power.",
    specs: [
      { label: "System", value: "High-performance propulsion unit" },
      { label: "Configuration", value: "Prototype / concept specification" },
      { label: "Cooling", value: "Liquid-cooled" },
      { label: "Inspection Focus", value: "Power delivery, cooling, intake and exhaust routing" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  brakes: { 
    id: 'brakes', displayName: "Carbon Ceramic Brakes", nodes: ["WheelFrontLBrakeDisc", "WheelFrontLBrakePad", "WheelFrontRBrakeDisc", "WheelFrontRBrakePad", "WheelRearLBrakeDisc", "WheelRearLBrakePad", "WheelRearRBrakeDisc", "WheelRearRBrakePad"], 
    category: "Braking System",
    func: "Converts vehicle motion into controlled braking force.",
    specs: [
      { label: "System", value: "Performance braking system" },
      { label: "Front/Rear", value: "Multi-wheel braking architecture" },
      { label: "Components", value: "Disc + caliper assembly" },
      { label: "Inspection Focus", value: "Disc condition, caliper assembly and thermal management" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  suspension: { 
    id: 'suspension', displayName: "Active Suspension", nodes: ["Axles"], 
    category: "Vehicle Dynamics",
    func: "Maintains wheel contact and manages ride/control behavior.",
    specs: [
      { label: "System", value: "Independent suspension concept" },
      { label: "Inspection Focus", value: "Damping, wheel control and suspension travel" },
      { label: "Primary Role", value: "Ride stability and handling control" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  wheels: { 
    id: 'wheels', displayName: "Forged Aero Wheels", nodes: ["WheelFrontL", "WheelFrontR", "WheelRearL", "WheelRearR"], 
    category: "Wheel & Tire Assembly",
    func: "Provides the physical interface between the vehicle and road surface.",
    specs: [
      { label: "Assembly", value: "Performance wheel/tire package" },
      { label: "Inspection Focus", value: "Wheel condition, tire contact and rotational movement" },
      { label: "System Role", value: "Traction and road contact" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  doors: { 
    id: 'doors', displayName: "Dihedral Doors", nodes: ["BodyDoorLColor1", "BodyDoorRColor1"], 
    category: "Body / Access System",
    func: "Provides passenger access while contributing to the vehicle body structure.",
    specs: [
      { label: "System", value: "Hinged body access assembly" },
      { label: "Mechanism", value: "Mechanical hinge system" },
      { label: "Inspection Focus", value: "Hinge movement, panel alignment and closure" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  hood: { 
    id: 'hood', displayName: "Aero Hood", nodes: ["BodyHood"], 
    category: "Front Body Panel",
    func: "Provides access to the front service area and protects internal components.",
    specs: [
      { label: "System", value: "Hinged front body panel" },
      { label: "Inspection Focus", value: "Panel alignment, hinge movement and closure" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  hatch: { 
    id: 'hatch', displayName: "Rear Engine Cover", nodes: ["BodyRearPanelsColor1"], 
    category: "Rear Access System",
    func: "Provides access to the rear storage/service area.",
    specs: [
      { label: "System", value: "Hinged rear access panel" },
      { label: "Inspection Focus", value: "Hinge movement, alignment and sealing" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  interior: { 
    id: 'interior', displayName: "Performance Cockpit", nodes: ["InteriorSeatsColor1", "InteriorSeatsColor2", "InteriorSeatsFrame1", "InteriorSeatsFrame2", "InteriorDashMid", "InteriorDashSides", "InteriorFloor", "InteriorFloormats", "InteriorMid", "InteriorSteeringBase", "InteriorSteeringCylinder", "InteriorSteeringDash", "InteriorSteeringDashColumn", "InteriorSteeringHandleL", "InteriorSteeringHandleR", "InteriorPedalAccel", "InteriorPedalAccelArm", "InteriorPedalBrake", "InteriorPedalBrakeArm", "InteriorCage", "InteriorPillar"], 
    category: "Cabin / Cockpit",
    func: "Driver and passenger control environment.",
    specs: [
      { label: "System", value: "Driver-focused cockpit" },
      { label: "Inspection Focus", value: "Dashboard, controls, seating and interior layout" },
      { label: "View", value: "Interior Showcase" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  exterior: { 
    id: 'exterior', displayName: "Aero Body", nodes: ["BodyRoofPanel", "BodyPillars", "BodyPanelsColor2", "BodyWindshield", "BodyWindshieldGasket", "BodyWindshieldWipers", "BodyWindshieldWipersBase"], 
    category: "Vehicle Body",
    func: "Primary exterior body and aerodynamic surface system.",
    specs: [
      { label: "System", value: "Aerodynamic vehicle body" },
      { label: "Inspection Focus", value: "Body panels, surface design and exterior lighting" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  },
  chassis: { 
    id: 'chassis', displayName: "Carbon Monocoque", nodes: ["BodyUnderside"], 
    category: "Structural Platform",
    func: "Provides the primary structural foundation supporting the vehicle systems.",
    specs: [
      { label: "System", value: "Structural vehicle platform" },
      { label: "Inspection Focus", value: "Structural layout, mounting areas and underbody architecture" },
      { label: "View", value: "Underside inspection" },
      { label: "Status", value: "INSPECTION READY" }
    ]
  }
};`

let newCode = code.replace(/const phantomComponents = \{[\s\S]*?\n\};\n/, newPhantomComponents + '\n');

const newPanelUpdate = `function updateComponentInfoPanel(comp) {
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
      specsHtml += \`<div class="spec-item"><span class="spec-label">\${s.label}</span><span class="spec-value">\${s.value}</span></div>\`;
    });
  }
  
  rightPanel.innerHTML = \`
    <div class="section-title">\${comp.displayName.toUpperCase()}</div>
    <div style="font-weight:700; font-size:12px; margin-bottom:4px; color:var(--accent);">\${comp.category || 'Component Data'}</div>
    <div style="font-size:11px; color:var(--text-muted); line-height:1.4; margin-bottom:12px;">\${comp.func || comp.desc}</div>
    <div class="divider"></div>
    \${specsHtml}
  \`;
}`

newCode = newCode.replace(/function updateComponentInfoPanel\(comp\) \{[\s\S]*?^\}/m, newPanelUpdate);

const newFocus = `function focusOnComponent(id) {
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
}`

newCode = newCode.replace(/function focusOnComponent\(id\) \{[\s\S]*?^\}/m, newFocus);

fs.writeFileSync('index.html', newCode, 'utf8');
console.log("Updated components, panel logic, and camera logic.");
