import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';

// Fallback Car Component when no model URL is provided
function FallbackCar({ color }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Car body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[4, 1.2, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Car roof */}
      <mesh position={[0, 1.4, -0.2]} castShadow>
        <boxGeometry args={[2.5, 0.8, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Wheels */}
      <mesh position={[-1.3, -0.2, 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[1.3, -0.2, 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-1.3, -0.2, -1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[1.3, -0.2, -1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[0.8, 0.3, 1.05]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-0.8, 0.3, 1.05]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

// 3D Model Loader Component
function ModelLoader({ url, color }) {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!url) return;

    const fileExtension = url.split('.').pop().toLowerCase();
    
    if (fileExtension === 'glb' || fileExtension === 'gltf') {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const scene = gltf.scene;
          
          // Apply color to all meshes
          scene.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({ color });
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Scale and center the model
          const box = new THREE.Box3().setFromObject(scene);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 3 / maxDim;
          scene.scale.setScalar(scale);
          
          const center = box.getCenter(new THREE.Vector3());
          scene.position.x = -center.x * scale;
          scene.position.y = -center.y * scale;
          scene.position.z = -center.z * scale;
          
          setModel(scene);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          setError('Failed to load 3D model');
        }
      );
    } else if (fileExtension === 'obj') {
      const loader = new OBJLoader();
      loader.load(
        url,
        (object) => {
          object.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({ color });
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Scale and center
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 3 / maxDim;
          object.scale.setScalar(scale);
          
          const center = box.getCenter(new THREE.Vector3());
          object.position.x = -center.x * scale;
          object.position.y = -center.y * scale;
          object.position.z = -center.z * scale;
          
          setModel(object);
        },
        undefined,
        (error) => {
          console.error('Error loading OBJ model:', error);
          setError('Failed to load OBJ model');
        }
      );
    }
  }, [url, color]);

  // Update color when it changes
  React.useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.set(color);
        }
      });
    }
  }, [color, model]);

  if (error) {
    return <FallbackCar color={color} />;
  }

  return model ? <primitive object={model} /> : null;
}

// Loading component
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}

const ThreeDCarViewer = ({ modelUrl, selectedColor = '#FF0000', className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Environment */}
        <Environment preset="city" />
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Car Model */}
        <Suspense fallback={<LoadingFallback />}>
          {modelUrl ? (
            <ModelLoader url={modelUrl} color={selectedColor} />
          ) : (
            <FallbackCar color={selectedColor} />
          )}
        </Suspense>
        
        {/* Ground shadows */}
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4.5}
        />
        
        {/* Ground plane */}
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </Canvas>
      
      {/* UI Overlays */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span className="text-gray-700">Loading 3D model...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
        <p>🖱️ Drag to rotate • 🔍 Scroll to zoom • ⌨️ Right-click to pan</p>
      </div>
    </div>
  );
};

export default ThreeDCarViewer;
