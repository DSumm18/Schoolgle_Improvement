export interface CarbonData {
  schoolName: string;
  year: number;
  month: string;
  energyType: 'Electricity' | 'Gas' | 'Transport';
  consumption: number; // kWh for energy, miles for transport
  unit: 'kWh' | 'miles' | 'litres';
  carbonEmissions: number; // kg CO2e
  emissionFactor: number; // kg CO2e per unit
}

export interface SECRReport {
  schoolName: string;
  year: number;
  totalElectricityKwh: number;
  totalGasKwh: number;
  totalTransportMiles: number;
  totalCarbonEmissions: number; // kg CO2e
  carbonIntensity: number; // kg CO2e per pupil/staff member
  previousYearComparison?: {
    year: number;
    totalEmissions: number;
    percentageChange: number;
  };
}

export interface VehicleData {
  schoolName: string;
  vehicleType: 'Car' | 'Van' | 'Bus' | 'Other';
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  mileage: number;
  year: number;
  month: string;
}

// UK Government emission factors (kg CO2e per unit)
export const EMISSION_FACTORS = {
  electricity: 0.212, // kg CO2e per kWh (2023 UK grid average)
  gas: 0.202, // kg CO2e per kWh
  transport: {
    petrol: 0.192, // kg CO2e per km
    diesel: 0.171, // kg CO2e per km
    electric: 0.053, // kg CO2e per km (2023 UK grid)
    hybrid: 0.120, // kg CO2e per km (average)
  }
} as const;
