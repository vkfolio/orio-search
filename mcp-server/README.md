# orio-search-mcp (Python)

MCP wrapper for [OrioSearch](https://github.com/rivalarya/orio-search). Exposes `web_search` and `web_extract` as MCP tools.

## Requirements

- Python 3.11+
- OrioSearch running locally (default: `http://localhost:8000`)

## Installation

```bash
pip install mcp httpx python-dotenv pydantic
```

## Configuration

### Environment variable

The server reads `ORIOSEARCH_BASE_URL` from the environment or a `.env` file in the project root.

```env
ORIOSEARCH_BASE_URL=http://localhost:8000
```

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "oriosearch": {
      "command": "python",
      "args": ["C:\\path\\to\\orio-search-mcp\\src\\index.py"],
      "env": {
        "ORIOSEARCH_BASE_URL": "http://localhost:8000"
      }
    }
  }
}
```

Config file location:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Restart Claude Desktop after saving.

## Tools

### `web_search`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | Search query |
| `search_depth` | `basic` \| `advanced` | no | |
| `topic` | `general` \| `news` | no | |
| `max_results` | integer (1–20) | no | |
| `include_answer` | boolean | no | |
| `include_raw_content` | boolean | no | |
| `include_images` | boolean | no | |
| `include_domains` | string[] | no | Whitelist domains |
| `exclude_domains` | string[] | no | Blacklist domains |
| `time_range` | `day` \| `week` \| `month` \| `year` | no | |

### `web_extract`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `urls` | string[] (1–20) | yes | URLs to extract content from |
| `format` | `markdown` \| `text` | no | Output format |