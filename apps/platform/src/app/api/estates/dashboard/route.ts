/**
 * Estates Compliance Dashboard API
 *
 * GET /api/estates/dashboard - Get dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { AssetService } from '@/lib/estates-compliance/services/AssetService';
import { TaskService } from '@/lib/estates-compliance/services/TaskService';
import { HelpdeskService } from '@/lib/estates-compliance/services/HelpdeskService';
import { ContractorService } from '@/lib/estates-compliance/services/ContractorService';
import { RAGStatusService } from '@/lib/estates-compliance/services/RAGStatusService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';

    // Fetch all stats in parallel
    const [assets, taskStats, contractorStats, helpdeskStats, ragStatus] = await Promise.all([
      AssetService.list(organization_id, undefined, { page: 1, pageSize: 1 }).then(r => r.total).catch(() => 0),
      TaskService.getStats(organization_id).catch(() => ({ total: 0, pending: 0 })),
      ContractorService.list(organization_id, undefined, { page: 1, pageSize: 1 }).then(r => r.total).catch(() => 0),
      HelpdeskService.getStats(organization_id).catch(() => ({ total: 0, open: 0 })),
      RAGStatusService.getQuickStatus(organization_id).catch(() => ({
        overall: 'green' as const,
        score: 100,
        domains: [],
      })),
    ]);

    const stats = {
      totalAssets: assets,
      pendingTasks: taskStats.pending,
      activeContractors: contractorStats,
      openTickets: helpdeskStats.open,
      ragStatus: {
        overall: ragStatus.score,
        domains: ragStatus.domains.length > 0
          ? ragStatus.domains
          : [
              { name: 'Legionella', status: 'green' as const },
              { name: 'Fire Safety', status: 'green' as const },
              { name: 'Asbestos', status: 'green' as const },
              { name: 'Electrical', status: 'green' as const },
            ],
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
