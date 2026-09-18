# mcp-geonet-nz

GeoNet New Zealand MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `recent_quakes` | Recent New Zealand earthquakes from GeoNet (official NZ monitoring, GNS Science), filtered by minimum Modified Mercalli Intensity. MMI 3 ≈ widely felt, 5 ≈ damaging; -1 returns all located quakes. Returns magnitude, depth, locality, felt intensity, and coordinates, newest first. Keyless. |
| `get_quake` | Get detail for a single New Zealand earthquake by its GeoNet publicID — time, magnitude, depth, locality, felt intensity (MMI), location quality, and coordinates. Keyless. |
| `volcano_alerts` | Current Volcanic Alert Levels for all monitored New Zealand volcanoes (Taupo, White Island/Whakaari, Ruapehu, Tongariro, Auckland Volcanic Field, etc.) from GeoNet — official data USGS doesn't cover. NZ scale 0-5: 0 no unrest, 1 minor unrest, 2 moderate/heightened unrest, 3 minor eruption, 4 moderate eruption, 5 major eruption. Includes activity description, hazards, and aviation colour code. Keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "geonet-nz": {
      "url": "https://gateway.pipeworx.io/geonet-nz/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/geonet-nz/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Geonet Nz data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/recent_quakes \
  -H 'Content-Type: application/json' \
  -d '{"min_mmi":3,"limit":15}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/recent_quakes`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
