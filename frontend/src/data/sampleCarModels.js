// Sample 3D car models data for demonstration
// This would normally come from the Django API

export const sampleCarModels = [
  {
    id: 1,
    brand: "BMW",
    name: "M4 (F82)",
    description: "High-performance sports coupe with full configurator support (doors, hood, trunk, wheels).",
    model_file_url: "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb", // Using a working public model temporarily since F82.glb is missing
    default_colors: {
      "Sakhir Orange": "#D23719",
      "Austin Yellow": "#B89B22",
      "Yas Marina Blue": "#337699",
      "Alpine White": "#F4F4F4",
      "Black Sapphire": "#0A0A0A"
    },
    base_price: 24800000,
    alloy_wheels: [
      { id: "w1", name: "20\" Multi-Spoke GT", description: "Forged Monoblock • Gold Tone", price: 145000 },
      { id: "w2", name: "19\" Performance Star", description: "Matte Titanium • Lightweight", price: 95000 },
      { id: "w3", name: "Aero Disk Carbon", description: "Drag Reduction Turbofan", price: 120000 },
      { id: "w4", name: "18\" OEM Cast Alloy", description: "Stock Factory Finish", price: 0 }
    ],
    spoilers: [
      { id: "s1", name: "GT High-Mount Wing", description: "Carbon Fiber Blade • Orange Endplates", price: 185000 },
      { id: "s2", name: "Carbon Ducktail", description: "Low-Drag Trunk Lip", price: 72000 },
      { id: "s3", name: "Active Dynamic Wing", description: "Electronic Speed Tilt Actuator", price: 240000 },
      { id: "s4", name: "Factory Clean (None)", description: "Flush OEM Trunk Lid", price: 0 }
    ],
    features: {
      hasDoors: true,
      hasHood: true,
      hasTrunk: true,
      hasWheels: true
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
  base_price: 15000000,
  alloy_wheels: [
    { id: "dw1", name: "Standard Wheels", description: "Basic alloy", price: 0 },
    { id: "dw2", name: "Sport Wheels", description: "Lightweight performance", price: 50000 }
  ],
  spoilers: [
    { id: "ds1", name: "No Spoiler", description: "Standard", price: 0 },
    { id: "ds2", name: "Lip Spoiler", description: "Subtle aero", price: 25000 }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
