# OrioSearch

<p align="center">
  <a href="https://www.oriosearch.org">Website</a> •
  <a href="https://www.producthunt.com/products/oriosearch">Product Hunt</a> •
  <a href="https://github.com/vkfolio/orio-search/issues">Issues</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://www.producthunt.com/products/oriosearch?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-oriosearch" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1092028&theme=dark&t=1772893667823" alt="OrioSearch on Product Hunt" width="250" height="54" /></a>
</p>

Self-hosted, Tavily-compatible web search and content extraction API. Drop-in replacement for Tavily with full control over your search infrastructure.

Built on **SearXNG** (meta-search) + **FastAPI** with async concurrency, Redis caching, circuit breakers, result reranking, SSE streaming, and multi-tier content extraction.

🌐 **[www.oriosearch.org](https://www.oriosearch.org)** — Open source · MIT License · Free forever

---

## Features

- **Tavily-compatible API** — `/search`, `/extract`, and `/tool-schema` endpoints match Tavily's interface
- **AI answer generation** — `include_answer: true` generates LLM-synthesized answers from search results (OpenAI, Ollama, Groq, or any OpenAI-compatible API)
- **LLM-ready** — `/tool-schema` returns OpenAI function-calling definitions for `web_search` and `web_extract`
- **SearXNG backend** — aggregates 70+ search engines with automatic fallback to DuckDuckGo
- **Content extraction** — multi-tier pipeline: trafilatura (F1: 0.958) with readability-lxml fallback
- **Redis caching** — pipeline-batched lookups, configurable TTLs, stale-cache graceful degradation
- **Result reranking** — FlashRank ONNX model (~4MB, CPU-only, no PyTorch dependency)
- **SSE streaming** — `POST /search/stream` for real-time results via Server-Sent Events
- **Rate limiting** — per-route Redis-backed limits via slowapi, keyed by API key or IP
- **API key auth** — Bearer token authentication with timing-safe comparison
- **Circuit breakers** — automatic failure detection on search backend and extraction
- **Structured logging** — JSON-formatted structlog with request ID correlation
- **Per-domain rate limiting** — LRU-bounded semaphores prevent aggressive crawling
- **Concurrent extraction** — configurable global + per-domain concurrency limits
- **Rotating User-Agents** — 10 browser-like UAs to reduce extraction blocks
- **Proxy support** — optional HTTP/SOCKS proxy for all outbound requests
- **Production deployment** — Gunicorn + UvicornWorker, 4 workers, Docker health checks

---

## Quick Start

### Prerequisites

- Docker and Docker Compose

### Run

```bash
docker compose up --build
```

This starts three services:

| Service | Port | Description |
|---------|------|-------------|
| `orio-search-api` | 8000 | OrioSearch API |
| `orio-search-searxng` | 8080 | SearXNG meta-search engine |
| `orio-search-redis` | 6379 | Redis cache |

To include Ollama for AI answer generation:

```bash
docker compose --profile llm up --build
```

| `orio-search-ollama` | 11434 | Ollama LLM (optional, via `--profile llm`) |

### Verify

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"orio-search"}
```

---

## API Reference

### `POST /search`

Search the web and return relevant results.

```json
{
  "query": "python async programming",
  "search_depth": "basic",
  "topic": "general",
  "max_results": 5,
  "include_answer": false,
  "include_images": false,
  "include_raw_content": false,
  "time_range": "week",
  "include_domains": ["docs.python.org"],
  "exclude_domains": ["pinterest.com"]
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | *required* | Search query |
| `search_depth` | `basic` \| `advanced` | `basic` | `advanced` extracts full page content |
| `topic` | `general` \| `news` | `general` | Search category |
| `max_results` | 1-20 | 5 | Number of results |
| `include_answer` | boolean | false | Generate AI answer from search results (requires LLM) |
| `include_images` | boolean | false | Include image results |
| `include_raw_content` | boolean | false | Include extracted page content |
| `time_range` | `day` \| `week` \| `month` \| `year` | null | Time filter |
| `include_domains` | string[] | [] | Whitelist domains |
| `exclude_domains` | string[] | [] | Blacklist domains |

**Response:**

```json
{
  "query": "python async programming",
  "answer": "Python's asyncio module provides infrastructure for writing single-threaded concurrent code using coroutines [1]...",
  "results": [
    {
      "title": "Async IO in Python",
      "url": "https://docs.python.org/3/library/asyncio.html",
      "content": "Snippet of the page content...",
      "score": 0.95,
      "raw_content": null
    }
  ],
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "description": "Python async diagram"
    }
  ],
  "response_time": 1.234
}
```

### `POST /search/stream`

Same parameters as `/search`. Returns Server-Sent Events:

```
event: result
data: {"title": "...", "url": "...", "content": "...", "score": 0.95}

event: image
data: {"url": "...", "description": "..."}

event: extraction
data: {"url": "...", "raw_content": "..."}

event: answer_chunk
data: {"text": "Based on the search results, "}

event: answer_done
data: {}

event: done
data: {"response_time": 2.1}
```

The `answer_chunk` and `answer_done` events are only emitted when `include_answer: true` and LLM is configured.

### `POST /extract`

Extract clean content from URLs.

```json
{
  "urls": ["https://example.com/article"],
  "format": "markdown"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `urls` | string[] | *required* | 1-20 URLs to extract |
| `format` | `markdown` \| `text` | `markdown` | Output format |

**Response:**

```json
{
  "results": [
    {
      "url": "https://example.com/article",
      "raw_content": "# Article Title\n\nSource: https://example.com/article\n\n---\n\nExtracted content..."
    }
  ],
  "failed_results": [
    {
      "url": "https://example.com/404",
      "error": "HTTP 404"
    }
  ],
  "response_time": 2.5
}
```

### `GET /tool-schema`

Returns OpenAI-compatible function definitions for `web_search` and `web_extract`. Use this to register OrioSearch as a tool with any LLM.

### `GET /health`

Returns `{"status": "ok", "service": "orio-search"}`.

---

## Configuration

All configuration lives in `config.yaml`. Override the path with the `ORIO_SEARCH_CONFIG` environment variable.

### Search Backend

```yaml
search:
  backend: "searxng"          # "searxng" | "duckduckgo"
  searxng_url: "http://searxng:8080"
```

When `backend_fallback: true` (default), OrioSearch automatically falls back to DuckDuckGo if SearXNG is unavailable.

### Authentication

Disabled by default. Enable to require Bearer tokens:

```yaml
auth:
  enabled: true
  api_keys:
    - "your-secret-key-1"
    - "your-secret-key-2"
```

```bash
curl -H "Authorization: Bearer your-secret-key-1" \
     -X POST http://localhost:8000/search \
     -d '{"query": "test"}'
```

`/health` and `/tool-schema` are always unauthenticated.

### Rate Limiting

```yaml
rate_limit:
  enabled: true
  search_rate: "30/minute"
  extract_rate: "30/minute"
  default_rate: "60/minute"
```

When auth is enabled, limits are per API key. Otherwise, per IP.

### Reranking

```yaml
rerank:
  enabled: true
  model: "ms-marco-MiniLM-L-12-v2"
  top_k: 5
```

Uses FlashRank — a ~4MB ONNX model that runs on CPU with no PyTorch dependency. Reranks search results by semantic relevance to the query.

### Caching

```yaml
cache:
  enabled: true
  redis_url: "redis://redis:6379"
  search_ttl: 3600       # 1 hour
  extract_ttl: 86400     # 24 hours
```

### Resilience

```yaml
resilience:
  circuit_breaker_failure_threshold: 5
  circuit_breaker_recovery_timeout: 30
  retry_max_attempts: 3
  retry_backoff_base: 0.5
  request_timeout: 30
  backend_fallback: true
```

### Proxy

```yaml
proxy:
  enabled: true
  url: "socks5://proxy:1080"
```

### Extraction

```yaml
extraction:
  max_concurrent: 5              # Global concurrency
  domain_concurrency: 2          # Per-domain concurrency
  timeout: 10                    # Per-URL timeout (seconds)
  max_content_length: 50000      # Truncate content after this
  domain_semaphore_max_size: 1000  # LRU cache for domain semaphores
```

### CORS

```yaml
cors:
  allow_origins: ["*"]
```

### Logging

```yaml
logging:
  format: "json"    # "json" | "console"
  level: "INFO"
```

### AI Answer Generation (LLM)

Disabled by default. Enable to generate AI-synthesized answers from search results when `include_answer: true` is set. Uses the OpenAI SDK, which is compatible with any OpenAI-compatible API.

```yaml
llm:
  enabled: true
  provider: "ollama"                       # label for logs
  base_url: "http://ollama:11434/v1"       # any OpenAI-compatible endpoint
  api_key: "ollama"                        # "ollama" for local, real key for cloud
  model: "llama3.1"
  max_tokens: 1024
  temperature: 0.1
  timeout: 30
  system_prompt: "You are a helpful search assistant..."
  max_context_results: 5                   # search results fed to LLM
  max_context_chars: 8000                  # max context length
  answer_ttl: 3600                         # cache TTL for answers
```

**Supported providers** — just change `base_url`, `api_key`, and `model`:

| Provider | `base_url` | `model` example |
|----------|-----------|-----------------|
| Ollama (local) | `http://ollama:11434/v1` | `llama3.1`, `qwen3.5:9b` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` |

**Usage:**

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "what is docker", "include_answer": true}'
```

When LLM is disabled or fails, the API still returns search results normally with `"answer": null` (graceful degradation).

---

## Using with LLMs

### Get the tool schema

```bash
curl http://localhost:8000/tool-schema
```

This returns OpenAI-compatible function definitions. Pass them to any LLM that supports tool/function calling.

### Example: OpenAI-style tool registration

```python
import requests

# Fetch tool definitions from OrioSearch
schema = requests.get("http://localhost:8000/tool-schema").json()

# Pass to your LLM as tools
response = client.chat.completions.create(
    model="your-model",
    messages=[{"role": "user", "content": "Find recent news about AI"}],
    tools=schema["tools"],
)

# When the LLM calls web_search, forward to OrioSearch
result = requests.post(
    "http://localhost:8000/search",
    json={"query": "recent AI news", "topic": "news", "max_results": 5},
)
```

---

## Architecture

```
Client
  |
  v
OrioSearch API (FastAPI + Gunicorn, 4 workers)
  |
  |-- /search ---------> SearXNG (70+ engines)
  |                         \--> DuckDuckGo (fallback)
  |                         \--> LLM (AI answer, optional)
  |
  |-- /extract --------> trafilatura
  |                         \--> readability-lxml (fallback)
  |
  |-- /search/stream ---> SSE (real-time results + answer chunks)
  |
  |-- LLM provider ----> Ollama / OpenAI / Groq / any OpenAI-compatible API
  |
  \-- Redis (cache, rate limiting, answer cache)
```

### Concurrency Model

- **Separate HTTP connection pools**: search (10 connections) and extraction (50 connections)
- **Per-domain semaphores**: LRU-bounded, prevent aggressive crawling of any single domain
- **Global extraction semaphore**: caps total concurrent extractions
- **DuckDuckGo thread pool**: dedicated `ThreadPoolExecutor(4)` for sync DDG calls
- **Redis pipeline batching**: batch extract cache reads/writes into single round-trips

### Resilience

- **Circuit breakers** on search backend and content extraction — auto-open after 5 failures, recover after 30s
- **Exponential backoff retries** for 429/502/503/504 responses
- **Backend fallback**: SearXNG down → automatic DuckDuckGo fallback
- **Graceful degradation**: backend failure → serve stale cached results → HTTP 503
- **Request-level timeouts**: `asyncio.wait_for` wraps every request, returns HTTP 504 on timeout

---

## Development

### Run without Docker

```bash
pip install -r requirements.txt

# Start SearXNG and Redis separately, then:
ORIO_SEARCH_CONFIG=config.yaml uvicorn app.main:app --reload
```

### Run Tests

```bash
pip install pytest pytest-asyncio
pytest tests/ -v
```

---

## Project Structure

```
.
├── app/
│   ├── main.py                 # FastAPI app, lifespan, middleware
│   ├── config.py               # Pydantic config models, YAML loader
│   ├── auth.py                 # Bearer token authentication
│   ├── rate_limit.py           # slowapi limiter instance
│   ├── logging_setup.py        # structlog configuration
│   ├── middleware.py            # Request ID + timing middleware
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   ├── routers/
│   │   ├── search.py           # POST /search
│   │   ├── extract.py          # POST /extract
│   │   └── search_stream.py    # POST /search/stream (SSE)
│   └── services/
│       ├── search_backend.py   # SearXNG + DuckDuckGo + fallback
│       ├── extractor.py        # Multi-tier content extraction
│       ├── cache.py            # Redis cache with batch ops
│       ├── reranker.py         # FlashRank reranking
│       ├── llm.py              # LLM answer generation (OpenAI-compatible)
│       └── resilience.py       # Circuit breakers + retry
├── tests/                      # pytest test suite (110 tests)
├── searxng/
│   └── settings.yml            # SearXNG configuration
├── config.yaml                 # App configuration
├── docker-compose.yml          # 4-service stack (Ollama optional via profile)
├── Dockerfile                  # Production image
├── requirements.txt            # Python dependencies
└── quick_test.http             # VS Code REST Client tests
```

---

## License

MIT
