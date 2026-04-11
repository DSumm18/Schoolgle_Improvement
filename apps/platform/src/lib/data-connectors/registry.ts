import type { Connector, ConnectorLayer } from './types';
import { CONSUMER_DEPENDENCIES } from './consumer-mapping';
import { DFE_CONNECTORS } from './sources/dfe';
import { SCHOOLGLE_INTERNAL_CONNECTORS } from './sources/schoolgle-internal';
import { DOCUMENT_CONNECTORS } from './sources/documents';
import { LIVE_MIS_CONNECTORS } from './sources/live-mis';
import { PLANNED_CONNECTORS } from './sources/planned';

const STATIC_CONNECTORS: Connector[] = [
  ...DFE_CONNECTORS,
  ...SCHOOLGLE_INTERNAL_CONNECTORS,
  ...DOCUMENT_CONNECTORS,
  ...LIVE_MIS_CONNECTORS,
  ...PLANNED_CONNECTORS,
];

export function getAllConnectors(): Connector[] {
  return STATIC_CONNECTORS;
}

export function getConnector(id: string): Connector | undefined {
  return STATIC_CONNECTORS.find(c => c.id === id);
}

export function getConnectorsByLayer(layer: ConnectorLayer): Connector[] {
  return STATIC_CONNECTORS.filter(c => c.layer === layer);
}

export function getConnectorsForConsumer(consumerId: string): Connector[] {
  const depIds = CONSUMER_DEPENDENCIES[consumerId];
  if (!depIds) return [];
  return depIds
    .map(id => getConnector(id))
    .filter((c): c is Connector => c !== undefined);
}

export function getConnectorsByJoinKey(key: string): Connector[] {
  return STATIC_CONNECTORS.filter(c => c.joinKeys.includes(key as never));
}
