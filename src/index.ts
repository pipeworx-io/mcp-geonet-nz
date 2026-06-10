interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * GeoNet New Zealand MCP.
 *
 * Official New Zealand geological hazard monitoring (GNS Science) — recent
 * earthquakes with felt intensity, single-quake detail, and NZ Volcanic Alert
 * Levels (data USGS doesn't provide). Keyless.
 */


const BASE = 'https://api.geonet.org.nz';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';
const GEOJSON_ACCEPT = 'application/vnd.geo+json;version=2';

const tools: McpToolExport['tools'] = [
  {
    name: 'recent_quakes',
    description:
      'Recent New Zealand earthquakes from GeoNet (official NZ monitoring, GNS Science), filtered by minimum Modified Mercalli Intensity. MMI 3 ≈ widely felt, 5 ≈ damaging; -1 returns all located quakes. Returns magnitude, depth, locality, felt intensity, and coordinates, newest first. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        min_mmi: {
          type: 'number',
          description:
            'Minimum Modified Mercalli Intensity, -1 to 8 (default 3). -1 = all quakes, 3 ≈ widely felt, 5 ≈ damaging. Out-of-range values are clamped.',
        },
        limit: {
          type: 'number',
          description: 'Max quakes to return (default 15, max 50).',
        },
      },
    },
  },
  {
    name: 'get_quake',
    description:
      'Get detail for a single New Zealand earthquake by its GeoNet publicID — time, magnitude, depth, locality, felt intensity (MMI), location quality, and coordinates. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'GeoNet quake publicID, e.g. "2026p432677" (year + "p" + sequence).',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'volcano_alerts',
    description:
      "Current Volcanic Alert Levels for all monitored New Zealand volcanoes (Taupo, White Island/Whakaari, Ruapehu, Tongariro, Auckland Volcanic Field, etc.) from GeoNet — official data USGS doesn't cover. NZ scale 0-5: 0 no unrest, 1 minor unrest, 2 moderate/heightened unrest, 3 minor eruption, 4 moderate eruption, 5 major eruption. Includes activity description, hazards, and aviation colour code. Keyless.",
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'recent_quakes':
        return recentQuakes(args);
      case 'get_quake':
        return getQuake(args);
      case 'volcano_alerts':
        return volcanoAlerts();
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

interface GeoFeature {
  properties: Record<string, unknown>;
  geometry?: { coordinates?: number[] };
}

async function geoFetch(path: string): Promise<{ features: GeoFeature[] } | { error: string }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: GEOJSON_ACCEPT, 'User-Agent': UA },
  });
  if (res.status === 404) return { error: 'not found' };
  if (!res.ok) return { error: `geonet: ${res.status} ${(await res.text()).slice(0, 200)}` };
  const body = (await res.json()) as { features?: GeoFeature[] };
  return { features: Array.isArray(body.features) ? body.features : [] };
}

function round1(v: unknown): number | null {
  return typeof v === 'number' ? Math.round(v * 10) / 10 : null;
}

function mapQuake(f: GeoFeature): Record<string, unknown> {
  const p = f.properties ?? {};
  const [lon, lat] = f.geometry?.coordinates ?? [];
  return {
    id: p.publicID,
    time: p.time,
    magnitude: round1(p.magnitude),
    depth_km: round1(p.depth),
    locality: p.locality,
    mmi: p.mmi,
    quality: p.quality,
    longitude: lon ?? null,
    latitude: lat ?? null,
  };
}

async function recentQuakes(args: Record<string, unknown>): Promise<unknown> {
  const rawMmi = typeof args.min_mmi === 'number' ? Math.round(args.min_mmi) : 3;
  const minMmi = Math.max(-1, Math.min(8, rawMmi));
  const rawLimit = typeof args.limit === 'number' ? Math.round(args.limit) : 15;
  const limit = Math.max(1, Math.min(50, rawLimit));

  const result = await geoFetch(`/quake?MMI=${minMmi}`);
  if ('error' in result) return result;

  const quakes = result.features
    .map(mapQuake)
    .sort((a, b) => String(b.time ?? '').localeCompare(String(a.time ?? '')))
    .slice(0, limit);
  return { min_mmi: minMmi, count: quakes.length, quakes };
}

async function getQuake(args: Record<string, unknown>): Promise<unknown> {
  const id = typeof args.id === 'string' ? args.id.trim() : '';
  if (!id) return { error: 'provide a quake publicID, e.g. "2026p432677"', id: args.id ?? null };

  const result = await geoFetch(`/quake/${encodeURIComponent(id)}`);
  if ('error' in result) return result.error === 'not found' ? { error: 'quake not found', id } : result;
  if (result.features.length === 0) return { error: 'quake not found', id };
  return mapQuake(result.features[0]);
}

async function volcanoAlerts(): Promise<unknown> {
  const result = await geoFetch('/volcano/val');
  if ('error' in result) return result;

  const volcanoes = result.features
    .map((f) => {
      const p = f.properties ?? {};
      const [lon, lat] = f.geometry?.coordinates ?? [];
      return {
        volcano_id: p.volcanoID,
        name: p.volcanoTitle,
        alert_level: p.level,
        activity: p.activity,
        aviation_colour: p.acc,
        hazards: p.hazards,
        longitude: lon ?? null,
        latitude: lat ?? null,
      };
    })
    .sort((a, b) => Number(b.alert_level ?? 0) - Number(a.alert_level ?? 0));
  return { count: volcanoes.length, volcanoes };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
