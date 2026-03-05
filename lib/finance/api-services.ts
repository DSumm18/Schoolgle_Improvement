// Mock API services for DfE, FBIT, and OBR data
// These will be replaced with real API calls when credentials are available

import type {
  DfEFundingData,
  FBITBenchmark,
  PayForecast,
  FundingStream
} from '@/types/finance';

// =====================================================
// DFE EXPLORE EDUCATION STATISTICS API
// =====================================================

export async function getDfEFundingData(schoolUrn: string, academicYear: string = '2023-24'): Promise<DfEFundingData> {
  // Mock data based on real DfE statistics structure
  const mockFundingData: DfEFundingData = {
    schoolUrn,
    academicYear,
    totalFunding: 1250000,
    fundingStreams: [
      {
        type: 'GAG',
        amount: 980000,
        source: 'General Annual Grant'
      },
      {
        type: 'Pupil_Premium',
        amount: 150000,
        source: 'Pupil Premium Grant'
      },
      {
        type: 'High_Needs',
        amount: 80000,
        source: 'High Needs Block'
      },
      {
        type: 'PE_Sport',
        amount: 25000,
        source: 'PE and Sport Premium'
      },
      {
        type: 'Other',
        amount: 15000,
        source: 'Other Grants'
      }
    ]
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return mockFundingData;
}

export async function getDfESchoolCharacteristics(schoolUrn: string): Promise<any> {
  // Mock school characteristics data
  return {
    schoolUrn,
    schoolName: 'Example Primary School',
    phase: 'primary',
    type: 'Academy',
    region: 'South East',
    localAuthority: 'Surrey',
    pupilNumbers: {
      total: 420,
      fsm: 45,
      sen: 32
    },
    staffNumbers: {
      teaching: 28,
      support: 15,
      leadership: 3
    }
  };
}

// =====================================================
// FBIT BENCHMARKING API
// =====================================================

export async function getFBITBenchmarks(
  schoolPhase: string,
  region: string = 'England',
  pupilNumbers?: number
): Promise<FBITBenchmark> {
  // Mock benchmark data based on FBIT structure
  const phaseBenchmarks: Record<string, FBITBenchmark> = {
    primary: {
      schoolPhase: 'primary',
      region,
      staffingPercent: 75.2,
      premisesPercent: 12.8,
      suppliesPercent: 8.5
    },
    secondary: {
      schoolPhase: 'secondary',
      region,
      staffingPercent: 78.5,
      premisesPercent: 11.2,
      suppliesPercent: 7.8
    },
    all_through: {
      schoolPhase: 'all_through',
      region,
      staffingPercent: 76.8,
      premisesPercent: 12.0,
      suppliesPercent: 8.2
    },
    special: {
      schoolPhase: 'special',
      region,
      staffingPercent: 82.1,
      premisesPercent: 10.5,
      suppliesPercent: 5.9
    }
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return phaseBenchmarks[schoolPhase] || phaseBenchmarks.primary;
}

export async function getFBITDetailedBenchmarks(
  schoolPhase: string,
  region: string = 'England',
  pupilNumbers?: number
): Promise<any> {
  // Mock detailed benchmark data
  const detailedBenchmarks = {
    primary: {
      spendPerPupil: {
        national: 4500,
        regional: 4600,
        similar: 4550
      },
      staffingBreakdown: {
        teaching: 65.2,
        support: 10.0,
        leadership: 8.5,
        other: 1.5
      },
      premisesBreakdown: {
        utilities: 4.5,
        maintenance: 3.8,
        cleaning: 2.2,
        other: 2.3
      },
      suppliesBreakdown: {
        curriculum: 3.2,
        ICT: 2.1,
        admin: 1.8,
        other: 1.4
      }
    },
    secondary: {
      spendPerPupil: {
        national: 6200,
        regional: 6350,
        similar: 6280
      },
      staffingBreakdown: {
        teaching: 68.5,
        support: 8.2,
        leadership: 7.8,
        other: 1.5
      },
      premisesBreakdown: {
        utilities: 4.8,
        maintenance: 3.5,
        cleaning: 1.8,
        other: 1.1
      },
      suppliesBreakdown: {
        curriculum: 4.2,
        ICT: 2.5,
        admin: 1.8,
        other: 0.8
      }
    }
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));

  return detailedBenchmarks[schoolPhase as keyof typeof detailedBenchmarks] || detailedBenchmarks.primary;
}

// =====================================================
// OBR PAY FORECASTS API
// =====================================================

export async function getOBRPayForecast(): Promise<PayForecast[]> {
  // Mock OBR data based on real forecasts
  const payForecasts: PayForecast[] = [
    {
      year: 2024,
      teacherPayAward: 6.5,
      supportStaffAward: 6.5,
      inflation: 4.0
    },
    {
      year: 2025,
      teacherPayAward: 3.5,
      supportStaffAward: 3.5,
      inflation: 2.8
    },
    {
      year: 2026,
      teacherPayAward: 2.5,
      supportStaffAward: 2.5,
      inflation: 2.0
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  return payForecasts;
}

export async function getOBRInflationForecast(): Promise<any> {
  // Mock inflation forecast data
  return {
    currentYear: 2024,
    forecasts: [
      { year: 2024, cpi: 4.0, rpi: 4.5 },
      { year: 2025, cpi: 2.8, rpi: 3.2 },
      { year: 2026, cpi: 2.0, rpi: 2.3 },
      { year: 2027, cpi: 2.0, rpi: 2.0 }
    ],
    source: 'OBR Economic and Fiscal Outlook',
    lastUpdated: '2024-01-15'
  };
}

// =====================================================
// LOCAL AUTHORITY DATA
// =====================================================

export async function getLocalAuthorityData(laCode: string): Promise<any> {
  // Mock LA data
  return {
    laCode,
    laName: 'Surrey County Council',
    region: 'South East',
    highNeedsTopUp: {
      primary: 6500,
      secondary: 8500,
      special: 12000
    },
    transportRates: {
      mainstream: 2.50,
      sen: 4.20
    },
    lastUpdated: '2024-01-01'
  };
}

// =====================================================
// PEER GROUP COMPARISON
// =====================================================

export async function getPeerGroupData(
  schoolPhase: string,
  region: string,
  pupilNumbers: number,
  fsmPercentage: number
): Promise<any[]> {
  // Mock peer group data
  const peerGroups = {
    primary: [
      {
        schoolName: 'St. Mary\'s Primary',
        region: 'South East',
        pupilNumbers: 380,
        fsmPercentage: 12,
        spendPerPupil: 4450,
        staffingPercent: 74.8,
        premisesPercent: 13.2
      },
      {
        schoolName: 'Oak Tree Primary',
        region: 'South East',
        pupilNumbers: 450,
        fsmPercentage: 8,
        spendPerPupil: 4650,
        staffingPercent: 75.5,
        premisesPercent: 12.5
      },
      {
        schoolName: 'Meadow Primary',
        region: 'South East',
        pupilNumbers: 320,
        fsmPercentage: 15,
        spendPerPupil: 4850,
        staffingPercent: 76.2,
        premisesPercent: 12.8
      }
    ],
    secondary: [
      {
        schoolName: 'Riverside Academy',
        region: 'South East',
        pupilNumbers: 1200,
        fsmPercentage: 18,
        spendPerPupil: 6250,
        staffingPercent: 78.2,
        premisesPercent: 11.5
      },
      {
        schoolName: 'Greenfield Secondary',
        region: 'South East',
        pupilNumbers: 950,
        fsmPercentage: 12,
        spendPerPupil: 6450,
        staffingPercent: 79.1,
        premisesPercent: 10.8
      }
    ]
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 350));

  return peerGroups[schoolPhase as keyof typeof peerGroups] || peerGroups.primary;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateVariancePercentage(actual: number, budgeted: number): number {
  if (budgeted === 0) return 0;
  return ((actual - budgeted) / budgeted) * 100;
}

export function getVarianceSeverity(variancePercent: number): 'low' | 'medium' | 'high' | 'critical' {
  const absVariance = Math.abs(variancePercent);
  
  if (absVariance >= 25) return 'critical';
  if (absVariance >= 15) return 'high';
  if (absVariance >= 8) return 'medium';
  return 'low';
}

// =====================================================
// CACHING HELPERS
// =====================================================

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlMinutes: number = 60
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < (cached.ttl * 60 * 1000)) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  cache.set(key, {
    data,
    timestamp: now,
    ttl: ttlMinutes
  });
  
  return data;
}

export function clearCache(pattern?: string): void {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// =====================================================
// ERROR HANDLING
// =====================================================

export class FinanceAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'FinanceAPIError';
  }
}

export async function handleAPIError(error: any): Promise<never> {
  if (error instanceof FinanceAPIError) {
    throw error;
  }
  
  console.error('Finance API Error:', error);
  
  if (error.status === 404) {
    throw new FinanceAPIError('Data not found', 'NOT_FOUND', 404);
  }
  
  if (error.status === 403) {
    throw new FinanceAPIError('Access denied', 'ACCESS_DENIED', 403);
  }
  
  if (error.status >= 500) {
    throw new FinanceAPIError('Server error', 'SERVER_ERROR', error.status);
  }
  
  throw new FinanceAPIError('Unknown error occurred', 'UNKNOWN_ERROR', 500);
}
