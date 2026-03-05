export interface EnergyData {
  schoolName: string;
  meterNumber: string;
  energyType: 'Electricity' | 'Gas';
  year: number;
  month: string;
  totalKwh: number;
  totalCost?: number;
  address?: string;
  mpan?: string;
}

export interface MeterInfo {
  schoolName: string;
  address: string;
  mpan: string;
  energyType: 'Electricity' | 'Gas';
  meterNumber: string;
}

export interface TransformedEnergyRecord extends EnergyData {
  mpan?: string;
}

export interface InvoiceExtractionResult {
  documentType: 'Invoice' | 'Credit Note';
  supplier: string;
  invoicePeriod: string;
  totalAmount: number;
  energyConsumed: number;
  correctionFactor?: number;
  calorificValue?: number;
  meterSerial?: string;
  mprn?: string;
  previousRead?: {
    value: string;
    date: string;
  };
  currentRead?: {
    value: string;
    date: string;
    type?: string;
  };
  siteName?: string;
}

export interface FilterState {
  school: string;
  meter: string;
  energyType: string;
  compareMonth: string;
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

export interface KPIData {
  totalKwh: number;
  totalCost: number;
  avgMonthlyKwh: number;
  avgCostPerKwh: number;
  activeMeters: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface UsageAnomaly {
  id: string;
  schoolName: string;
  meterNumber: string;
  energyType: 'Electricity' | 'Gas';
  year: number;
  month: string;
  totalKwh: number;
  totalCost?: number;
  deviation: number;
  baseline: number;
  direction: 'increase' | 'decrease';
  costDeviation?: number;
}

export interface MeterReading {
  value: string;
  date: string;
  type?: string;
}

export interface ExtractedInvoiceRecord {
  documentType: 'Invoice' | 'Credit Note';
  supplier: string;
  invoicePeriod: string;
  totalAmount: number;
  energyConsumed: number;
  correctionFactor: number;
  calorificValue: number;
  meterSerial: string;
  mprn: string; // MPRN for gas
  mpan?: string; // MPAN for electricity
  accountNumber?: string; // Customer account number
  invoiceNumber?: string; // Invoice reference number
  previousRead: MeterReading;
  currentRead: Required<MeterReading>;
  siteName: string;
  sourceFileId: string;
  sourceFileName: string;
}
