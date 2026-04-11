import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  getAllConnectors,
  getConnectorsByLayer,
  getConnectorsForConsumer,
} from '@/lib/data-connectors/registry';
import { getByoConnectors, connectorRecordToConnector } from '@/lib/data-connectors/byo/byo-store';
import type { Connector, ConnectorLayer } from '@/lib/data-connectors/types';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const url = new URL(req.url);
  const layer = url.searchParams.get('layer');
  const status = url.searchParams.get('status');
  const consumer = url.searchParams.get('consumer');
  const joinKey = url.searchParams.get('joinKey');

  let connectors: Connector[] = [];

  if (consumer) {
    connectors = getConnectorsForConsumer(consumer);
  } else if (layer) {
    const layerNum = parseInt(layer, 10) as ConnectorLayer;
    if (![1, 2, 3, 4].includes(layerNum)) {
      return apiError('Invalid layer — must be 1, 2, 3 or 4', 400);
    }
    connectors = getConnectorsByLayer(layerNum);
  } else {
    connectors = getAllConnectors();
  }

  // Load BYO connectors for this organization if layer=3 or no filter
  if (!layer || layer === '3') {
    try {
      const supabase = createServiceRoleClient();
      const byoRecords = await getByoConnectors(supabase, auth.organizationId);
      const byoConnectors = byoRecords.map(connectorRecordToConnector);
      connectors = [...connectors, ...byoConnectors];
    } catch {
      // silently continue — BYO load failure shouldn't break the registry
    }
  }

  if (status) {
    connectors = connectors.filter(c => c.status === status);
  }

  if (joinKey) {
    connectors = connectors.filter(c => c.joinKeys.includes(joinKey as never));
  }

  const summary = {
    total: connectors.length,
    active: connectors.filter(c => c.status === 'active').length,
    setupNeeded: connectors.filter(c => c.status === 'setup-needed').length,
    planned: connectors.filter(c => c.status === 'planned').length,
    byLayer: {
      1: connectors.filter(c => c.layer === 1).length,
      2: connectors.filter(c => c.layer === 2).length,
      3: connectors.filter(c => c.layer === 3).length,
      4: connectors.filter(c => c.layer === 4).length,
    },
  };

  return apiSuccess({ connectors, summary });
});
