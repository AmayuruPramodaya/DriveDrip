// Test file to verify location data
import { sriLankanLocations, getProvinces, getDistrictsByProvince } from './src/data/locations.js';

console.log('Provinces:', getProvinces());
console.log('Districts in Western Province:', getDistrictsByProvince('Western'));
console.log('Districts in Central Province:', getDistrictsByProvince('Central'));
console.log('Invalid province:', getDistrictsByProvince('Invalid'));

// Test that all provinces have districts
const provinces = getProvinces();
provinces.forEach(province => {
  const districts = getDistrictsByProvince(province);
  console.log(`${province}: ${districts.length} districts`);
  if (districts.length === 0) {
    console.warn(`Warning: ${province} has no districts!`);
  }
});

console.log('Location data test completed successfully!');
