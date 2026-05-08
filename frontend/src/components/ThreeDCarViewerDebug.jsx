import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// Component to load and display GLB/GLTF models
function ModelLoader({ url, color }) {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modelRef = useRef();

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    const loader = new GLTFLoader();
    
    console.log('Loading model from:', url);
    
    // Check if the URL is accessible first
    fetch(url, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log('Model URL is accessible, loading with GLTFLoader...');
        
        loader.load(
          url,
          (gltf) => {
            console.log('Model loaded successfully:', gltf);
            const scene = gltf.scene.clone();
            
            // Apply color to all meshes
            scene.traverse((child) => {
              if (child.isMesh) {
                if (child.material) {
                  // Clone the material to avoid affecting the original
                  child.material = child.material.clone();
                  child.material.color.set(color);
                } else {
                  child.material = new THREE.MeshStandardMaterial({ color });
                }
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
            setLoading(false);
          },
          (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
          },
          (error) => {
            console.error('GLTFLoader error:', error);
            setError('Failed to load 3D model: ' + error.message);
            setLoading(false);
          }
        );
      })
      .catch(fetchError => {
        console.error('URL fetch error:', fetchError);
        setError('Cannot access model file: ' + fetchError.message);
        setLoading(false);
      });
  }, [url]);

  // Update color when it changes
  useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.set(color);
        }
      });
    }
  }, [color, model]);

  // Add slight animation to loaded models
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  if (error) {
    return (
      <group>
        <AnimatedCar color={color} />
        <mesh position={[0, 3, 0]}>
          <textGeometry args={['Model Load Failed', { font: null, size: 0.2, height: 0.05 }]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }

  if (loading) {
    return <LoadingCar color="#cccccc" />;
  }

  return model ? (
    <group ref={modelRef}>
      <primitive object={model} />
    </group>
  ) : null;
}

// Loading car component
function LoadingCar({ color }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh castShadow>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </group>
  );
}

// Simple animated car that shows the 3D functionality is working
function AnimatedCar({ color }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
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
      {[-1.3, 1.3].map((x, i) => 
        [1, -1].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, -0.2, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        ))
      )}
      
      {/* Headlights */}
      <mesh position={[0.8, 0.3, 1.05]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.8, 0.3, 1.05]} castShadow>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Windshield */}
      <mesh position={[0, 1.2, 0.3]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[2.2, 1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// Loading component
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 1, 1]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}

const ThreeDCarViewerDebug = ({ modelUrl, selectedColor = '#FF0000', className = '' }) => {
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');

  useEffect(() => {
    if (modelUrl) {
      setLoadingStatus('Attempting to load model...');
    } else {
      setLoadingStatus('Using fallback 3D car');
    }
  }, [modelUrl]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        camera={{ position: [6, 4, 6], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setError('WebGL not supported or failed to initialize');
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
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
        <Suspense fallback={<LoadingCar color="#cccccc" />}>
          {modelUrl ? (
            <ModelLoader url={modelUrl} color={selectedColor} />
          ) : (
            <AnimatedCar color={selectedColor} />
          )}
        </Suspense>
        
        {/* Ground plane */}
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </Canvas>
      
      {/* UI Overlays */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
     
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
        <p>🖱️ Drag to rotate • 🔍 Scroll to zoom • ⌨️ Right-click to pan</p>
      </div>
    </div>
  );
};

export default ThreeDCarViewerDebug;
