import React, { Suspense, useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Math utility for smooth animations
const damp = THREE.MathUtils.damp;

function CarModel({ url, color, openDoors, openHood, openTrunk }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();
  
  // Create a deep clone of the scene so we don't mutate the cached GLTF
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    // Traverse and setup materials
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Clone material to avoid modifying the original globally
        if (child.material) {
          child.material = child.material.clone();
        }

        const meshName = child.name.toLowerCase();
        
        // Apply paint color to body panels
        if (
          meshName.includes('body') ||
          meshName.includes('door_l') ||
          meshName.includes('door_r') ||
          meshName.includes('hood') ||
          meshName.includes('trunk') ||
          meshName.includes('fender') ||
          meshName.includes('doorpanel')
        ) {
          // If it's a glass or trim part named similarly, skip coloring it
          if (!meshName.includes('glass') && !meshName.includes('trim') && !meshName.includes('carbon')) {
            child.material.color.set(color);
            child.material.roughness = 0.15;
            child.material.metalness = 0.8;
            child.material.clearcoat = 1.0;
            child.material.clearcoatRoughness = 0.1;
          }
        }
      }
    });
    
    // Set initial pivot points for doors and hoods by translating their geometry
    // and repositioning the mesh. In many GLBs the origin is at 0,0,0 instead of the hinge.
    // If they already have correct hinges, this might not be needed.
    // We will assume they have correct pivot points for now, or use rotation offsets.
    
  }, [clonedScene, color]);

  // Animation frame loop for doors, hood, and trunk
  useFrame((state, delta) => {
    // Find the objects to animate
    const doorL = clonedScene.getObjectByName('ARm4_door_L');
    const doorR = clonedScene.getObjectByName('ARm4_door_R');
    const hood = clonedScene.getObjectByName('ARm4_hood');
    const trunk = clonedScene.getObjectByName('ARm4_trunk');

    // BMW F82 specific rotations. Depending on model axis:
    if (doorL) {
      // Typically doors rotate around Y or Z
      const targetRot = openDoors ? -Math.PI / 4 : 0;
      doorL.rotation.y = damp(doorL.rotation.y, targetRot, 4, delta);
    }
    
    if (doorR) {
      const targetRot = openDoors ? Math.PI / 4 : 0;
      doorR.rotation.y = damp(doorR.rotation.y, targetRot, 4, delta);
    }
    
    if (hood) {
      const targetRot = openHood ? -Math.PI / 6 : 0;
      hood.rotation.x = damp(hood.rotation.x, targetRot, 4, delta);
    }
    
    if (trunk) {
      const targetRot = openTrunk ? Math.PI / 5 : 0;
      trunk.rotation.x = damp(trunk.rotation.x, targetRot, 4, delta);
    }
  });

  return (
    <group ref={modelRef} dispose={null}>
      {/* Center the car visually, adjust Y based on wheel height */}
      <primitive object={clonedScene} position={[0, -0.65, 0]} />
    </group>
  );
}

// Preload removed because the file doesn't exist yet

const ThreeDCarViewerPro = forwardRef(({ 
  modelUrl, 
  selectedColor = '#FF2200', 
  activeView = 'front', 
  openDoors = false, 
  openHood = false, 
  openTrunk = false 
}, ref) => {
  const orbitRef = useRef();

  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (orbitRef.current) {
        orbitRef.current.reset();
      }
    }
  }));

  return (
    <Canvas shadows camera={{ position: [5, 2, 5], fov: 45 }}>
      <Suspense fallback={null}>
        {/* Environment setup for realistic reflections */}
        <Environment preset="studio" intensity={1.5} />
        
        {/* Subtle fill lights */}
        <ambientLight intensity={0.4} />
        <spotLight position={[0, 10, 0]} intensity={0.8} penumbra={1} castShadow />

        {/* The Car */}
        {modelUrl && (
          <CarModel 
            url={modelUrl} 
            color={selectedColor} 
            openDoors={openDoors}
            openHood={openHood}
            openTrunk={openTrunk}
          />
        )}
        
        {/* Realistic ground shadow */}
        <ContactShadows 
          position={[0, -0.65, 0]} 
          opacity={0.7} 
          scale={10} 
          blur={2.5} 
          far={4} 
          resolution={512} 
          color="#000000" 
        />
      </Suspense>

      <OrbitControls 
        ref={orbitRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.05} // don't go below ground
        makeDefault
      />
    </Canvas>
  );
});

export default ThreeDCarViewerPro;
