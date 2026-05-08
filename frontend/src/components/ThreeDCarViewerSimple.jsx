import React, { useRef, useEffect, useState } from 'react';

const ThreeDCarViewer = ({ modelUrl, selectedColor = '#FF0000', className = '' }) => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Simple fallback when Three.js is not available
    const container = mountRef.current;
    container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 12px;
        padding: 40px;
        text-align: center;
      ">
        <div style="
          width: 200px;
          height: 120px;
          background: ${selectedColor};
          border-radius: 20px;
          position: relative;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transform: perspective(300px) rotateX(10deg);
        ">
          <!-- Car body -->
          <div style="
            position: absolute;
            bottom: -15px;
            left: 20px;
            width: 30px;
            height: 30px;
            background: #333;
            border-radius: 50%;
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position: absolute;
            bottom: -15px;
            right: 20px;
            width: 30px;
            height: 30px;
            background: #333;
            border-radius: 50%;
            box-shadow: 0 5px 10px rgba(0,0,0,0.3);
          "></div>
        </div>
        <h3 style="
          color: #555;
          margin: 0 0 10px 0;
          font-size: 18px;
          font-weight: 600;
        ">3D Car Preview</h3>
        <p style="
          color: #777;
          margin: 0;
          font-size: 14px;
        ">Interactive 3D view will load here</p>
      </div>
    `;

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [selectedColor]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      
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
    </div>
  );
};

export default ThreeDCarViewer;
