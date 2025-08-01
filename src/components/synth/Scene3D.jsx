
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// More subtle color function
const frequencyToHSL = (frequency) => {
  if (!frequency || frequency <= 0) return 'hsl(0, 0%, 100%)';
  const hue = (Math.log2(frequency / 16.35) % 1) * 360;
  return `hsl(${Math.round(hue)}, 80%, 50%)`;
};

// Simple OrbitControls implementation
class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Check if mobile to adjust height accordingly
    const isMobile = window.innerWidth < 768;
    const mobileYOffset = isMobile ? 4 : 0; // Add extra height for mobile

    // Raised camera and target even higher, with extra boost for mobile
    this.defaultPosition = new THREE.Vector3(0, 10 + mobileYOffset, 12); // Higher for mobile
    this.defaultTarget = new THREE.Vector3(0, 8 + mobileYOffset, 0); // Higher target for mobile

    // Current state
    this.target = new THREE.Vector3(0, 8 + mobileYOffset, 0); // Start with the higher raised target
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();

    this.scale = 1;
    this.zoomChanged = false;

    // Interaction state
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();

    this.panStart = new THREE.Vector2();
    this.panEnd = new THREE.Vector2();
    this.panDelta = new THREE.Vector2();

    this.state = 'NONE';

    // Settings
    this.enableRotate = true;
    this.enableZoom = true;
    this.enablePan = true;

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 0.1;
    this.panSpeed = 1.0;

    this.minDistance = 1;
    this.maxDistance = 50;

    // Pre-bind event handlers for proper removal
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.bindEvents();
    // The initial update will be handled by the component that creates the controls.
  }

  bindEvents() {
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('wheel', this.onMouseWheel);
  }

  onContextMenu(event) {
    event.preventDefault();
  }

  onPointerDown(event) {
    if (event.isPrimary === false) return;

    switch (event.pointerType) {
      case 'mouse':
        switch (event.button) {
          case 0: // left mouse
            this.state = 'ROTATE';
            break;
          case 2: // right mouse
            this.state = 'PAN';
            break;
        }
        break;
      default:
        this.state = 'ROTATE';
    }

    if (this.state === 'ROTATE') {
      this.rotateStart.set(event.clientX, event.clientY);
    } else if (this.state === 'PAN') {
      this.panStart.set(event.clientX, event.clientY);
    }

    this.domElement.addEventListener('pointermove', this.onPointerMove);
    this.domElement.addEventListener('pointerup', this.onPointerUp);
  }

  onPointerMove(event) {
    if (!this.domElement) return; // Defensive check
    if (event.isPrimary === false) return;

    if (this.state === 'ROTATE') {
      this.rotateEnd.set(event.clientX, event.clientY);
      this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

      const element = this.domElement;
      this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight);
      this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

      this.rotateStart.copy(this.rotateEnd);
    } else if (this.state === 'PAN') {
      this.panEnd.set(event.clientX, event.clientY);
      this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
      this.pan(this.panDelta.x, this.panDelta.y);
      this.panStart.copy(this.panEnd);
    }

    this.update();
  }

  onPointerUp() {
    if (!this.domElement) return; // Defensive check
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.state = 'NONE';
  }

  onMouseWheel(event) {
    if (!this.enableZoom) return;

    event.preventDefault();

    if (event.deltaY < 0) {
      this.dollyIn(this.getZoomScale());
    } else if (event.deltaY > 0) {
      this.dollyOut(this.getZoomScale());
    }

    this.update();
  }

  getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed);
  }

  rotateLeft(angle) {
    this.sphericalDelta.theta -= angle;
  }

  rotateUp(angle) {
    this.sphericalDelta.phi -= angle;
  }

  pan(deltaX, deltaY) {
    const offset = new THREE.Vector3();
    const position = this.camera.position;
    offset.copy(position).sub(this.target);

    let targetDistance = offset.length();
    targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);

    const panLeft = new THREE.Vector3();
    panLeft.setFromMatrixColumn(this.camera.matrix, 0);
    panLeft.multiplyScalar(-2 * deltaX * targetDistance / this.domElement.clientHeight);

    const panUp = new THREE.Vector3();
    panUp.setFromMatrixColumn(this.camera.matrix, 1);
    panUp.multiplyScalar(2 * deltaY * targetDistance / this.domElement.clientHeight);

    const pan = new THREE.Vector3();
    pan.copy(panLeft).add(panUp);

    this.camera.position.add(pan);
    this.target.add(pan);
  }

  dollyIn(dollyScale) {
    this.scale /= dollyScale;
  }

  dollyOut(dollyScale) {
    this.scale *= dollyScale;
  }

  update() {
    const offset = new THREE.Vector3();
    const quat = new THREE.Quaternion().setFromUnitVectors(this.camera.up, new THREE.Vector3(0, 1, 0));
    const quatInverse = quat.clone().invert();

    const position = this.camera.position;
    offset.copy(position).sub(this.target);

    offset.applyQuaternion(quat);
    this.spherical.setFromVector3(offset);

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    this.spherical.radius *= this.scale;
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

    offset.setFromSpherical(this.spherical);
    offset.applyQuaternion(quatInverse);

    position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    this.sphericalDelta.set(0, 0, 0);
    this.scale = 1;

    return true;
  }

  reset() {
    this.camera.position.copy(this.defaultPosition);
    this.target.copy(this.defaultTarget);
    this.camera.lookAt(this.target);
    this.update();
  }

  dispose() {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
    // Remove pointermove and pointerup listeners if they were active
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement = null; // Clear reference to DOM element
  }
}

export default function Scene3D({
  notes = [],
  onNotePositionChange,
  playingNotes = [],
  structureTransform = {},
  onStructureTransformChange,
  onCameraReady,
  cameraY,
  sphereBrightness = 0.3,
  disabled = false,
  lineConnectionMode = 'mesh', // Add new prop
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({}).current;
  const disabledRef = useRef(disabled);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  const playingNotesRef = useRef(playingNotes);
  useEffect(() => { playingNotesRef.current = playingNotes; }, [playingNotes]);

  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  
  const brightnessRef = useRef(sphereBrightness);
  useEffect(() => {
    brightnessRef.current = sphereBrightness;
  }, [sphereBrightness]);

  // This effect dynamically updates the camera's vertical target based on the slider
  useEffect(() => {
    if (stateRef.controls && stateRef.camera) {
      const oldTargetY = stateRef.controls.target.y;
      const diffY = cameraY - oldTargetY;

      // Update the control's target and the camera's position to keep the view consistent
      stateRef.controls.target.y = cameraY;
      stateRef.camera.position.y += diffY;

      // Also update the default positions for the reset functionality
      stateRef.controls.defaultTarget.y = cameraY;
      stateRef.controls.defaultPosition.y += diffY;

      // Update controls to immediately reflect changes
      stateRef.controls.update();
    }
  }, [cameraY, stateRef.controls, stateRef.camera]);


  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x00d4ff, 0x1e1b4b, 0.8);
    scene.add(hemisphereLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 5, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00d4ff, 0.8);
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x8b5cf6, 1, 100);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    const grid = new THREE.GridHelper(20, 20, '#00d4ff', '#2563eb');
    grid.position.y = -2; // Raised grid to match higher scene
    scene.add(grid);

    const structureGroup = new THREE.Group();
    scene.add(structureGroup);

    const connectionLines = new THREE.Group();
    structureGroup.add(connectionLines);

    // Initialize orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Set initial camera target based on cameraY prop, if available, otherwise use controls default
    const initialTargetY = typeof cameraY === 'number' ? cameraY : controls.defaultTarget.y;
    const positionOffsetFromTarget = controls.defaultPosition.y - controls.defaultTarget.y;
    const initialPositionY = initialTargetY + positionOffsetFromTarget;

    // Set camera's initial position and target, considering the cameraY prop
    camera.position.set(controls.defaultPosition.x, initialPositionY, controls.defaultPosition.z);
    controls.target.set(controls.defaultTarget.x, initialTargetY, controls.defaultTarget.z);

    // Also update the controls' default values for its reset() method
    controls.defaultPosition.set(controls.defaultPosition.x, initialPositionY, controls.defaultPosition.z);
    controls.defaultTarget.set(controls.defaultTarget.x, initialTargetY, controls.defaultTarget.z);

    controls.update(); // This ensures the camera correctly looks at the initial target

    if (onCameraReady) {
      onCameraReady(() => controls.reset());
    }

    Object.assign(stateRef, {
      scene, camera, renderer, structureGroup, connectionLines, controls,
      spheres: new Map(),
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      draggedObject: null
    });

    const animate = () => {
      stateRef.animationId = requestAnimationFrame(animate);

      // Auto-transformations are now handled by the parent component.
      // This animate loop is now only for visual updates.

      if (stateRef.spheres) {
        stateRef.spheres.forEach((sphere, id) => {
          const isPlaying = playingNotesRef.current.includes(id); // Corrected check here
          const baseIntensity = brightnessRef.current;
          const pulseIntensity = 0.3 * Math.sin(Date.now() * 0.01);
          if (sphere.material instanceof THREE.MeshPhysicalMaterial) { // Ensure material type before setting emissiveIntensity
              sphere.material.emissiveIntensity = isPlaying ? baseIntensity + Math.abs(pulseIntensity) : baseIntensity;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const plane = new THREE.Plane();
    const intersection = new THREE.Vector3();

    const onPointerDown = (event) => {
      if (disabledRef.current) return;
      // Only handle sphere dragging with left mouse button
      if (event.button !== 0) return;

      stateRef.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY - mountRef.current.getBoundingClientRect().top) / mountRef.current.clientHeight) * 2 + 1);
      stateRef.raycaster.setFromCamera(stateRef.pointer, camera);
      const intersects = stateRef.raycaster.intersectObjects(Array.from(stateRef.spheres.values()));

      if (intersects.length > 0) {
        // Disable orbit controls when dragging spheres
        controls.enableRotate = false;
        controls.enableZoom = false;
        controls.enablePan = false;

        stateRef.draggedObject = intersects[0].object;
        camera.getWorldDirection(plane.normal);
        plane.setFromNormalAndCoplanarPoint(plane.normal, stateRef.structureGroup.position);
        plane.projectPoint(stateRef.draggedObject.position, intersection);
      }
    };

    const onPointerMove = (event) => {
      if (!stateRef.draggedObject) return;

      stateRef.pointer.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY - mountRef.current.getBoundingClientRect().top) / mountRef.current.clientHeight) * 2 + 1);
      stateRef.raycaster.setFromCamera(stateRef.pointer, camera);

      const newWorldPos = new THREE.Vector3();
      if(stateRef.raycaster.ray.intersectPlane(plane, newWorldPos)) {
         const newLocalPos = stateRef.structureGroup.worldToLocal(newWorldPos.clone());
         stateRef.draggedObject.position.copy(newLocalPos);
      }
    };

    const onPointerUp = () => {
      if (stateRef.draggedObject) {
        const { id, index } = stateRef.draggedObject.userData;
        const newPos = stateRef.draggedObject.position;
        onNotePositionChange(index, { x: newPos.x, y: newPos.y, z: newPos.z });
        stateRef.draggedObject = null;
      }

      // Re-enable orbit controls
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
        if (!mountRef.current || !camera || !renderer) return;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(stateRef.animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      
      // Clean up controls properly
      if (controls) {
        controls.dispose();
      }
      
      // Clean up renderer and DOM
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of all geometries and materials properly
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              if (material.map) material.map.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              material.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            if (object.material.normalMap) object.material.normalMap.dispose();
            if (object.material.roughnessMap) object.material.roughnessMap.dispose();
            if (object.material.metalnessMap) object.material.metalnessMap.dispose();
            object.material.dispose();
          }
        }
      });
      
      // Dispose renderer and clear references
      renderer.dispose();
      
      // Clear sphere references
      if (stateRef.spheres) {
        stateRef.spheres.clear();
      }
    };
  }, []); // This main setup effect runs only once

  const updateConnectionLines = (sphereArray, mode) => {
    if (!stateRef.connectionLines || !stateRef.spheres) return;

    // Dispose of existing children before clearing
    while (stateRef.connectionLines.children.length > 0) {
      const child = stateRef.connectionLines.children[0];
      stateRef.connectionLines.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }

    const baseMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.8,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3
    });

    if (mode === 'mesh') {
      // Original logic: connect all spheres to each other
      const validSpheres = sphereArray.filter(sphere => sphere && sphere.position && 
        typeof sphere.position.x === 'number' && 
        typeof sphere.position.y === 'number' && 
        typeof sphere.position.z === 'number');

      if (validSpheres.length < 2) {
          baseMaterial.dispose();
          return;
      }

      for (let i = 0; i < validSpheres.length; i++) {
        for (let j = i + 1; j < validSpheres.length; j++) {
          const sphere1 = validSpheres[i];
          const sphere2 = validSpheres[j];
          const points = [sphere1.position, sphere2.position];
          const curve = new THREE.CatmullRomCurve3(points);
          const geometry = new THREE.TubeGeometry(curve, 1, 0.02, 8, false);
          const line = new THREE.Mesh(geometry, baseMaterial.clone());
          stateRef.connectionLines.add(line);
        }
      }
    } else { // 'chain' mode
      // New logic: connect spheres sequentially based on notes array order
      const orderedSpheres = notesRef.current
        .map(note => stateRef.spheres.get(note.id))
        .filter(Boolean); // Filter out any that might not exist yet

      if (orderedSpheres.length < 2) {
          baseMaterial.dispose();
          return;
      }

      for (let i = 0; i < orderedSpheres.length - 1; i++) {
        const sphere1 = orderedSpheres[i];
        const sphere2 = orderedSpheres[i + 1];
        const points = [sphere1.position, sphere2.position];
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 1, 0.02, 8, false);
        const line = new THREE.Mesh(geometry, baseMaterial.clone());
        stateRef.connectionLines.add(line);
      }
    }
    
    baseMaterial.dispose();
  };

  useEffect(() => {
    if (!stateRef.structureGroup) return;

    const validNotes = notes.filter(n => n && n.id && n.position && typeof n.position.x === 'number');
    const currentIds = validNotes.map(n => n.id);

    // Remove spheres that are no longer in notes
    stateRef.spheres.forEach((sphere, id) => {
      if (!currentIds.includes(id)) {
        stateRef.structureGroup.remove(sphere);
        stateRef.spheres.delete(id);
        if (sphere.geometry) sphere.geometry.dispose();
        if (sphere.material) {
          if (Array.isArray(sphere.material)) {
            sphere.material.forEach(mat => mat.dispose());
          } else {
            sphere.material.dispose();
          }
        }
      }
    });

    validNotes.forEach((note, index) => {
      let sphere = stateRef.spheres.get(note.id);
      const colorToShow = note.liveColor || note.color || '#ffffff';
      
      if (!sphere) {
        const geometry = new THREE.SphereGeometry(note.radius || 0.5, 32, 32);
        const material = new THREE.MeshPhysicalMaterial({
          color: colorToShow,
          emissive: colorToShow,
          emissiveIntensity: sphereBrightness,
          metalness: 0.85,
          roughness: 0.15,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          reflectivity: 0.9,
          transparent: false,
          envMapIntensity: 1.5
        });
        
        sphere = new THREE.Mesh(geometry, material);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        stateRef.spheres.set(note.id, sphere);
        stateRef.structureGroup.add(sphere);
      } else {
        // Check if radius has changed and update geometry if necessary
        if (sphere.geometry.parameters.radius !== (note.radius || 0.5)) {
            sphere.geometry.dispose();
            sphere.geometry = new THREE.SphereGeometry(note.radius || 0.5, 32, 32);
        }
      }

      sphere.position.set(note.position.x, note.position.y, note.position.z);

      // Always update color and emissive properties
      const newColor = new THREE.Color(colorToShow);
      // Ensure material is a MeshPhysicalMaterial before setting properties
      if (sphere.material instanceof THREE.MeshPhysicalMaterial) {
        sphere.material.color.set(newColor);
        sphere.material.emissive.set(newColor);
      }
      sphere.userData.color = colorToShow;

      sphere.userData.id = note.id;
      sphere.userData.index = index;
    });

    updateConnectionLines(Array.from(stateRef.spheres.values()), lineConnectionMode);

  }, [notes, stateRef.structureGroup, sphereBrightness, lineConnectionMode]);

  // This effect now applies the transform state from props using THREE.js native methods
  useEffect(() => {
    if (!stateRef.structureGroup) return;
    const { yTranslation = 0, xRotation = 0, yRotation = 0, zRotation = 0 } = structureTransform || {};

    // Apply yTranslation as visual movement
    stateRef.structureGroup.position.y = yTranslation * 0.1;
    
    // Use THREE.js native rotation methods for accuracy and efficiency
    stateRef.structureGroup.rotation.x = THREE.MathUtils.degToRad(xRotation);
    stateRef.structureGroup.rotation.y = THREE.MathUtils.degToRad(yRotation);
    stateRef.structureGroup.rotation.z = THREE.MathUtils.degToRad(zRotation);
    
  }, [structureTransform, stateRef.structureGroup]);

  return <div ref={mountRef} className="w-full h-full" />;
}
