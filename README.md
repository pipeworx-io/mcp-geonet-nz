# mcp-geonet-nz

GeoNet New Zealand MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Geonet Nz data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
