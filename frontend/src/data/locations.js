// Sri Lankan provinces and districts data
export const sriLankanLocations = {
  "Western": [
    "Colombo",
    "Gampaha", 
    "Kalutara"
  ],
  "Central": [
    "Kandy",
    "Matale",
    "Nuwara Eliya"
  ],
  "Southern": [
    "Galle",
    "Matara",
    "Hambantota"
  ],
  "Northern": [
    "Jaffna",
    "Kilinochchi",
    "Mannar",
    "Mullaitivu",
    "Vavuniya"
  ],
  "Eastern": [
    "Ampara",
    "Batticaloa",
    "Trincomalee"
  ],
  "North Western": [
    "Kurunegala",
    "Puttalam"
  ],
  "North Central": [
    "Anuradhapura",
    "Polonnaruwa"
  ],
  "Uva": [
    "Badulla",
    "Monaragala"
  ],
  "Sabaragamuwa": [
    "Kegalle",
    "Ratnapura"
  ]
};

export const getProvinces = () => Object.keys(sriLankanLocations);

export const getDistrictsByProvince = (province) => sriLankanLocations[province] || [];

export const getAllDistricts = () => {
  return Object.values(sriLankanLocations).flat().sort();
};
