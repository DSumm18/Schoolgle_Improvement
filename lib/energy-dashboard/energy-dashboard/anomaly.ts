import { EnergyData, UsageAnomaly } from '@/types/energy-dashboard';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonthIndex(month: string): number {
  const index = MONTHS.indexOf(month);
  return index >= 0 ? index : 0;
}

function calculateStats(values: number[]) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance) };
}

export function detectUsageAnomalies(data: EnergyData[], threshold = 2.5): UsageAnomaly[] {
  if (data.length === 0) return [];

  const grouped = new Map<string, EnergyData[]>();

  data.forEach((entry) => {
    const key = `${entry.meterNumber}|${entry.energyType}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  });

  const anomalies: UsageAnomaly[] = [];

  grouped.forEach((entries) => {
    const sortedEntries = entries.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    });

    const usageValues = sortedEntries.map((entry) => entry.totalKwh);
    const costValues = sortedEntries
      .map((entry) => entry.totalCost)
      .filter((value): value is number => typeof value === 'number');

    const usageStats = calculateStats(usageValues);
    const costStats = costValues.length > 0 ? calculateStats(costValues) : undefined;

    sortedEntries.forEach((entry) => {
      if (usageStats.stdDev === 0) return;
      const usageZ = (entry.totalKwh - usageStats.mean) / usageStats.stdDev;

      let costZ: number | undefined;
      if (costStats && costStats.stdDev > 0 && typeof entry.totalCost === 'number') {
        costZ = (entry.totalCost - costStats.mean) / costStats.stdDev;
      }

      const isUsageAnomaly = Math.abs(usageZ) >= threshold;
      const isCostAnomaly = costZ !== undefined && Math.abs(costZ) >= threshold;

      if (isUsageAnomaly || isCostAnomaly) {
        anomalies.push({
          id: `${entry.meterNumber}-${entry.year}-${entry.month}`,
          schoolName: entry.schoolName,
          meterNumber: entry.meterNumber,
          energyType: entry.energyType,
          year: entry.year,
          month: entry.month,
          totalKwh: entry.totalKwh,
          totalCost: entry.totalCost,
          deviation: parseFloat(usageZ.toFixed(2)),
          costDeviation: costZ !== undefined ? parseFloat(costZ.toFixed(2)) : undefined,
          baseline: parseFloat(usageStats.mean.toFixed(2)),
          direction: usageZ >= 0 ? 'increase' : 'decrease',
        });
      }
    });
  });

  return anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}
