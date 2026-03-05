import { CarbonData, SECRReport, VehicleData, EMISSION_FACTORS } from '@/types/energy-dashboard/carbon';
import { EnergyData } from '@/types/energy-dashboard';

export function calculateCarbonEmissions(energyData: EnergyData[]): CarbonData[] {
  return energyData.map(data => {
    const emissionFactor = data.energyType === 'Electricity' 
      ? EMISSION_FACTORS.electricity 
      : EMISSION_FACTORS.gas;
    
    return {
      schoolName: data.schoolName,
      year: data.year,
      month: data.month,
      energyType: data.energyType,
      consumption: data.totalKwh,
      unit: 'kWh',
      carbonEmissions: data.totalKwh * emissionFactor,
      emissionFactor,
    };
  });
}

export function calculateVehicleEmissions(vehicleData: VehicleData[]): CarbonData[] {
  return vehicleData.map(data => {
    const emissionFactor = EMISSION_FACTORS.transport[data.fuelType.toLowerCase() as keyof typeof EMISSION_FACTORS.transport];
    const carbonEmissions = data.mileage * 1.60934 * emissionFactor; // Convert miles to km
    
    return {
      schoolName: data.schoolName,
      year: data.year,
      month: data.month,
      energyType: 'Transport',
      consumption: data.mileage,
      unit: 'miles',
      carbonEmissions,
      emissionFactor: emissionFactor * 1.60934, // Convert to per mile
    };
  });
}

export function generateSECRReport(
  energyData: EnergyData[], 
  vehicleData: VehicleData[] = [],
  year: number,
  pupilCount?: number
): SECRReport {
  const carbonData = [
    ...calculateCarbonEmissions(energyData),
    ...calculateVehicleEmissions(vehicleData)
  ];

  const yearData = carbonData.filter(d => d.year === year);
  
  const totalElectricityKwh = yearData
    .filter(d => d.energyType === 'Electricity')
    .reduce((sum, d) => sum + d.consumption, 0);
    
  const totalGasKwh = yearData
    .filter(d => d.energyType === 'Gas')
    .reduce((sum, d) => sum + d.consumption, 0);
    
  const totalTransportMiles = yearData
    .filter(d => d.energyType === 'Transport')
    .reduce((sum, d) => sum + d.consumption, 0);
    
  const totalCarbonEmissions = yearData
    .reduce((sum, d) => sum + d.carbonEmissions, 0);

  const carbonIntensity = pupilCount ? totalCarbonEmissions / pupilCount : 0;

  return {
    schoolName: 'Academic Trust', // Or aggregate all schools
    year,
    totalElectricityKwh,
    totalGasKwh,
    totalTransportMiles,
    totalCarbonEmissions,
    carbonIntensity,
  };
}

export function formatCarbonEmissions(kgCO2e: number): string {
  if (kgCO2e >= 1000) {
    return `${(kgCO2e / 1000).toFixed(2)} tCO2e`;
  }
  return `${kgCO2e.toFixed(1)} kg CO2e`;
}

export function getCarbonIntensityLabel(intensity: number): string {
  if (intensity < 100) return 'Low';
  if (intensity < 200) return 'Medium';
  if (intensity < 300) return 'High';
  return 'Very High';
}

export function getCarbonIntensityColor(intensity: number): string {
  if (intensity < 100) return 'text-green-600';
  if (intensity < 200) return 'text-yellow-600';
  if (intensity < 300) return 'text-orange-600';
  return 'text-red-600';
}
