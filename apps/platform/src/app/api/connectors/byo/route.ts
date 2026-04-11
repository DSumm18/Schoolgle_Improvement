import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createByoConnector, connectorRecordToConnector, getByoConnectors } from '@/lib/data-connectors/byo/byo-store';
import type { ConnectorFieldSchema } from '@/lib/data-connectors/types';

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const records = await getByoConnectors(supabase, auth.organizationId);
  return apiSuccess({
    connectors: records.map(connectorRecordToConnector),
    count: records.length,
  });
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { name, description, sourceType, schema, rows } = body as {
    name: string;
    description?: string;
    sourceType: 'csv' | 'sheets' | 'form' | 'excel' | 'webhook' | 'airtable';
    schema: ConnectorFieldSchema;
    rows: Record<string, string>[];
  };

  if (!name || !sourceType || !schema || !Array.isArray(rows)) {
    return apiError('Missing required fields: name, sourceType, schema, rows', 400);
  }

  if (name.length > 100) {
    return apiError('Name must be 100 characters or fewer', 400);
  }

  if (rows.length > 10000) {
    return apiError('Maximum 10,000 rows per upload', 400);
  }

  const supabase = createServiceRoleClient();

  try {
    const { connector, rowsInserted } = await createByoConnector(supabase, {
      organizationId: auth.organizationId,
      name,
      description,
      sourceType,
      schema,
      rows,
      createdBy: auth.userId,
    });

    return apiSuccess({
      connector: connectorRecordToConnector(connector),
      rowsInserted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create BYO connector';
    return apiError(message, 500);
  }
});
