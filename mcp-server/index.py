import asyncio
import os
import json
import httpx
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from pydantic import BaseModel
from typing import Optional

load_dotenv()

BASE_URL = os.environ.get("ORIOSEARCH_BASE_URL")
if not BASE_URL:
    raise RuntimeError("Missing ORIOSEARCH_BASE_URL")

server = Server("orio-search-mcp")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="web_search",
            description="Search the web",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "search_depth": {"type": "string", "enum": ["basic", "advanced"]},
                    "topic": {"type": "string", "enum": ["general", "news"]},
                    "max_results": {"type": "integer", "minimum": 1, "maximum": 20},
                    "include_answer": {"type": "boolean"},
                    "include_raw_content": {"type": "boolean"},
                    "include_images": {"type": "boolean"},
                    "include_domains": {"type": "array", "items": {"type": "string"}},
                    "exclude_domains": {"type": "array", "items": {"type": "string"}},
                    "time_range": {"type": "string", "enum": ["day", "week", "month", "year"]},
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="web_extract",
            description="Extract content from URLs",
            inputSchema={
                "type": "object",
                "properties": {
                    "urls": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 20},
                    "format": {"type": "string", "enum": ["markdown", "text"]},
                },
                "required": ["urls"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    async with httpx.AsyncClient() as client:
        if name == "web_search":
            response = await client.post(f"{BASE_URL}/search", json=arguments)
        elif name == "web_extract":
            response = await client.post(f"{BASE_URL}/extract", json=arguments)
        else:
            raise ValueError(f"Unknown tool: {name}")

        if response.status_code != 200:
            raise RuntimeError(f"{name} failed: {response.status_code}")

        return [TextContent(type="text", text=json.dumps(response.json(), indent=2))]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


asyncio.run(main())