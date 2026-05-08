// Sample 3D car models data for demonstration
// This would normally come from the Django API

export const sampleCarModels = [
  {
    id: 1,
    brand: "BMW",
    name: "M3",
    description: "High-performance sports sedan with aggressive styling and exceptional handling.",
    model_file_url: "https://threejs.org/examples/models/gltf/Ferrari/Ferrari.glb", // Sample GLTF model
    default_colors: {
      "BMW Blue": "#0066CC",
      "Alpine White": "#FFFFFF", 
      "Jet Black": "#000000",
      "Storm Bay": "#6B7280",
      "Mineral Grey": "#9CA3AF",
      "Sunset Orange": "#FB923C"
    },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    brand: "Mercedes",
    name: "C63 AMG",
    description: "Luxury performance sedan with AMG tuning and premium interior.",
    model_file_url: "https://threejs.org/examples/models/gltf/Flamingo.glb", // Sample GLTF model
    default_colors: {
      "Mercedes Silver": "#C0C0C0",
      "Obsidian Black": "#1C1C1C",
      "Polar White": "#F8FAFC",
      "AMG Red": "#DC2626",
      "Designo Blue": "#1E40AF",
      "Selenite Grey": "#6B7280"
    },
    created_at: "2024-01-16T11:45:00Z",
    updated_at: "2024-01-16T11:45:00Z"
  },
  {
    id: 3,
    brand: "Audi",
    name: "RS6",
    description: "High-performance wagon with quattro all-wheel drive and twin-turbo V8.",
    model_file_url: "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb", // Sample GLTF model
    default_colors: {
      "Audi Red": "#DC2626",
      "Ibis White": "#FFFFFF",
      "Mythos Black": "#000000", 
      "Nardo Grey": "#6B7280",
      "Sonoma Green": "#059669",
      "Vegas Yellow": "#FCD34D"
    },
    created_at: "2024-01-17T14:20:00Z",
    updated_at: "2024-01-17T14:20:00Z"
  },
  {
    id: 4,
    brand: "Tesla",
    name: "Model S",
    description: "Electric luxury sedan with autopilot capability and minimalist interior.",
    model_file_url: "https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet.gltf", // Sample GLTF model
    default_colors: {
      "Pearl White": "#F8FAFC",
      "Solid Black": "#000000",
      "Midnight Silver": "#6B7280",
      "Deep Blue": "#1E40AF",
      "Pearl Red": "#DC2626"
    },
    created_at: "2024-01-18T09:15:00Z",
    updated_at: "2024-01-18T09:15:00Z"
  },
  {
    id: 5,
    brand: "Porsche",
    name: "911 Turbo",
    description: "Iconic sports car with rear-engine layout and exceptional performance.",
    model_file_url: "https://threejs.org/examples/models/obj/female02/female02.obj", // Sample OBJ model
    default_colors: {
      "Guards Red": "#DC2626",
      "GT Silver": "#C0C0C0",
      "Black": "#000000",
      "White": "#FFFFFF",
      "Racing Yellow": "#FDE047",
      "Miami Blue": "#0EA5E9"
    },
    created_at: "2024-01-19T16:30:00Z", 
    updated_at: "2024-01-19T16:30:00Z"
  }
];

// Fallback for when API is not available
export const fallbackCarModel = {
  id: 999,
  brand: "Demo",
  name: "Car",
  description: "Demo car model for testing the 3D customizer interface.",
  model_file_url: null, // Will show a fallback 3D shape
  default_colors: {
    "Red": "#FF0000",
    "Blue": "#0000FF", 
    "White": "#FFFFFF",
    "Black": "#000000",
    "Silver": "#C0C0C0",
    "Green": "#00FF00"
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
