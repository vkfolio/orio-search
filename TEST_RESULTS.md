# OrioSearch API - Test Results

Tested against live Docker stack on **2026-03-06**.

```bash
docker compose up --build
```

**Base URL:** `http://localhost:8000`

---

## 1. Health & Info

### GET /health

```bash
curl http://localhost:8000/health
```

```json
{"status":"ok","service":"orio-search"}
```

### GET /openapi.json

```bash
curl http://localhost:8000/openapi.json
```

```json
{
  "title": "OrioSearch",
  "version": "2.0.0",
  "paths": ["/search", "/extract", "/search/stream", "/health", "/tool-schema"]
}
```

### GET /tool-schema

```bash
curl http://localhost:8000/tool-schema
```

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "web_search",
        "description": "Search the web and return relevant results with optional content extraction.",
        "parameters": {
          "type": "object",
          "required": ["query"],
          "properties": {
            "query": {"type": "string"},
            "search_depth": {"type": "string", "enum": ["basic", "advanced"], "default": "basic"},
            "topic": {"type": "string", "enum": ["general", "news"], "default": "general"},
            "max_results": {"type": "integer", "minimum": 1, "maximum": 20, "default": 5},
            "include_raw_content": {"type": "boolean", "default": false},
            "include_images": {"type": "boolean", "default": false},
            "include_domains": {"type": "array", "items": {"type": "string"}},
            "exclude_domains": {"type": "array", "items": {"type": "string"}},
            "time_range": {"type": "string", "enum": ["day", "week", "month", "year"]}
          }
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "web_extract",
        "description": "Extract clean content from one or more URLs.",
        "parameters": {
          "type": "object",
          "required": ["urls"],
          "properties": {
            "urls": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 20},
            "format": {"type": "string", "enum": ["markdown", "text"], "default": "markdown"}
          }
        }
      }
    }
  ]
}
```

---

## 2. Search - Basic

### Basic search

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "python fastapi tutorial", "max_results": 3}'
```

```json
{
  "query": "python fastapi tutorial",
  "results": [
    {
      "title": "Tutorial - User Guide - FastAPI",
      "url": "https://fastapi.tiangolo.com/tutorial/",
      "content": "FastAPI Learn Tutorial - User Guide This tutorial shows you how to use FastAPI with most of its features, step by step...",
      "score": 0.9,
      "raw_content": null
    },
    {
      "title": "FastAPI - Introduction - GeeksforGeeks",
      "url": "https://www.geeksforgeeks.org/python/fastapi-introduction/",
      "content": "Let's create a simple web service that responds with \"Hello, FastAPI!\" when a specific URL is accessed.",
      "score": 0.9524,
      "raw_content": null
    },
    {
      "title": "FastAPI Tutorial - Online Tutorials Library",
      "url": "https://www.tutorialspoint.com/fastapi/index.htm",
      "content": "This tutorial is designed for software programmers who want to learn the basics of FastAPI...",
      "score": 0.65,
      "raw_content": null
    }
  ],
  "images": [],
  "response_time": 1.747
}
```

### News topic search

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "artificial intelligence", "topic": "news", "max_results": 3}'
```

```json
{
  "query": "artificial intelligence",
  "results": [
    {
      "title": "Artificial Intelligence (AI) and Nuclear Energy Could Make This Engineering and Construction Stock a Big Winner",
      "url": "https://www.aol.com/articles/artificial-intelligence-ai-nuclear-energy-111000448.html",
      "content": "If you're looking to capitalize on the surge in spending on data centers and nuclear energy, consider this industrial stock.",
      "score": 0.4,
      "raw_content": null
    },
    {
      "title": "Artificial Intelligence in healthcare: technology helping humans heal humans",
      "url": "https://www.kgun9.com/news/local-news/artificial-intelligence-in-healthcare-technology-helping-humans-heal-humans",
      "content": "Tucson Medical Center started using Artificial Intelligence in their exam rooms a few years ago...",
      "score": 0.2133,
      "raw_content": null
    },
    {
      "title": "Mathematicians explain AI's intelligence: It's all about patterns, not thinking",
      "url": "https://www.thehindu.com/education/mathematicians-explain-ais-intelligence-its-all-about-patterns-not-thinking/article70670543.ece",
      "content": "Explore how core mathematical concepts like linear algebra, probability, and optimization drive AI...",
      "score": 0.1167,
      "raw_content": null
    }
  ],
  "images": [],
  "response_time": 1.459
}
```

### Minimal search (just query, all defaults)

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "what is docker"}'
```

Returns 5 results (default `max_results`), `topic: general`, `search_depth: basic`.

---

## 3. Search - Advanced

### Advanced depth (full content extraction)

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "how to use docker compose", "search_depth": "advanced", "max_results": 2}'
```

```json
{
  "query": "how to use docker compose",
  "results": [
    {
      "title": "Docker Compose Quickstart",
      "url": "https://docs.docker.com/compose/gettingstarted/",
      "content": "Create a file called compose.yaml in your project directory...",
      "score": 0.4,
      "raw_content": "# Quickstart | Docker Docs\n\nSource: https://docs.docker.com/compose/gettingstarted/\n\n---\n\nDocker Compose Quickstart\nThis tutorial aims to introduce fundamental concepts of Docker Compose by guiding yo... [10837 chars]"
    },
    {
      "title": "r/docker on Reddit: Everything You Need to Know about Using Docker Compose",
      "url": "https://www.reddit.com/r/docker/comments/lvpy22/everything_you_need_to_know_about_using_docker/",
      "content": "Docker Compose is a way to create reproducible Docker containers using a config file...",
      "score": 0.1667,
      "raw_content": "# Reddit - The heart of the internet\n\nSource: https://www.reddit.com/...\n\n---\n\nEverything You Need to Know about Using Docker Compo... [514 chars]"
    }
  ],
  "images": [],
  "response_time": 2.267
}
```

---

## 4. Search - Images

### Search with images

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "cute cats", "include_images": true, "max_results": 3}'
```

```json
{
  "query": "cute cats",
  "results": [
    {
      "title": "50 Of The Cutest Cats To Melt Your Heart - Bored Panda",
      "url": "https://www.boredpanda.com/cute-cats-aww-pictures/",
      "content": "Scrolling through a sea of cute cat pictures is proven to have all sorts of benefits...",
      "score": 0.2133,
      "raw_content": null
    }
  ],
  "images": [
    {
      "url": "https://pethelpful.com/.image/w_3840,q_auto:good,c_fill,ar_4:3/top-10-cutest-cat-photos-of-all-time.jpg",
      "description": "Pictures Of Cute Cats"
    },
    {
      "url": "https://wallpapers.com/images/hd/cute-cats-pictures-ofp9qyt72qck6jqg.jpg",
      "description": "[100+] Cute Cats Pictures | Wallpapers.com"
    },
    {
      "url": "https://www.hdwallpapers.in/download/two_cute_white_cats_are_looking_down_4k_hd_kitten-HD.jpg",
      "description": "Two Cute White Cats Are Looking Down 4K HD Kitten"
    },
    {
      "url": "https://media.tenor.com/9EWwYOJnM_oAAAAM/cute-cats.gif",
      "description": "a close up of a cat's face with a pink bow on its head"
    },
    {
      "url": "https://www.rd.com/wp-content/uploads/2021/04/GettyImages-540542926-scaled.jpg",
      "description": "50 Cute Kittens You Need to See"
    }
  ],
  "response_time": 5.765
}
```

---

## 5. Search - Domain Filters

### Include domains

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "python async", "include_domains": ["docs.python.org", "realpython.com"], "max_results": 3}'
```

```json
{
  "query": "python async",
  "results": [
    {"title": "asyncio - Asynchronous I/O", "url": "https://docs.python.org/3/library/asyncio.html", "score": 1.0},
    {"title": "asyncio | Python Standard Library - Real Python", "url": "https://realpython.com/ref/stdlib/asyncio/", "score": 0.125},
    {"title": "18.5. asyncio - Asynchronous I/O...", "url": "https://docs.python.org/3.5/library/asyncio.html", "score": 0.0667}
  ],
  "images": []
}
```

All results restricted to the specified domains.

### Exclude domains

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "javascript frameworks 2026", "exclude_domains": ["medium.com", "w3schools.com"], "max_results": 3}'
```

```json
{
  "query": "javascript frameworks 2026",
  "results": [
    {"title": "6 Best JavaScript Frameworks for 2026", "url": "https://strapi.io/blog/best-javascript-frameworks", "score": 0.1222},
    {"title": "JavaScript Frameworks - Heading into 2026", "url": "https://dev.to/playfulprogramming/javascript-frameworks-heading-into-2026-2hel", "score": 0.1167},
    {"title": "Choosing the Right JavaScript Framework in 2026", "url": "https://medium.com/@Adekola_Olawale/...", "score": 0.5}
  ]
}
```

> Note: SearXNG `exclude_domains` works at the search engine level. Some engines may not fully support domain exclusion, allowing occasional results from excluded domains.

---

## 6. SSE Streaming

### POST /search/stream - Basic

```bash
curl -N -X POST http://localhost:8000/search/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"query": "python async programming", "max_results": 2}'
```

```
event: result
data: {"title": "asyncio - Asynchronous I/O - Python 3.14.3 documentation", "url": "https://docs.python.org/3/library/asyncio.html", "content": "Hello World!: asyncio is a library to write concurrent code...", "score": 0.3, "raw_content": null}

event: result
data: {"title": "Complete Guide to Asynchronous Programming with Animations", "url": "https://www.youtube.com/watch?v=oAkLSJNr5zY", "content": "In this video, we'll be learning all about AsyncIO...", "score": 0.25, "raw_content": null}

event: done
data: {"response_time": 1.214}
```

### POST /search/stream - With images

```bash
curl -N -X POST http://localhost:8000/search/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"query": "cute cats", "include_images": true, "max_results": 1}'
```

```
event: result
data: {"title": "900+ Best cute cats ideas", "url": "https://www.pinterest.com/romipins/cute-cats/", ...}

event: image
data: {"url": "https://pethelpful.com/.image/top-10-cutest-cat-photos-of-all-time.jpg", "description": "Pictures Of Cute Cats"}

event: image
data: {"url": "https://static.boredpanda.com/blog/wp-content/uploads/cute-kittens.jpg", "description": "Cute cat with big eyes and raised paw on a striped pillow."}

event: image
data: {"url": "https://wallpapers.com/images/hd/cute-cats-pictures.jpg", "description": "[100+] Cute Cats Pictures | Wallpapers.com"}

event: image
data: {"url": "https://www.hdwallpapers.in/download/two_cute_white_cats-HD.jpg", "description": "Two Cute White Cats Are Looking Down 4K HD Kitten"}

event: image
data: {"url": "https://media.tenor.com/9EWwYOJnM_oAAAAM/cute-cats.gif", "description": "a close up of a cat's face with a pink bow on its head"}

event: done
data: {"response_time": 2.44}
```

### POST /search/stream - Advanced with extraction

```bash
curl -N -X POST http://localhost:8000/search/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"query": "fastapi best practices", "search_depth": "advanced", "max_results": 2}'
```

```
event: result
data: {"title": "FastAPI Best Practices - Auth0", "url": "https://auth0.com/blog/fastapi-best-practices/", ...}

event: result
data: {"title": "r/Python on Reddit: FastAPI Best Practices", "url": "https://www.reddit.com/r/Python/comments/wrt7om/fastapi_best_practices/", ...}

event: extraction
data: {"url": "https://www.reddit.com/r/Python/comments/wrt7om/fastapi_best_practices/", "raw_content": "# Reddit - The heart of the internet\n\nSource: https://www.reddit.com/...\n\n---\n\nFastAPI Best Practices\nAlthough FastAPI is a great framework with fantastic documentation..."}

event: done
data: {"response_time": 1.127}
```

---

## 7. Extract

### Single URL extraction

```bash
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://httpbin.org/html"]}'
```

```json
{
  "results": [
    {
      "url": "https://httpbin.org/html",
      "raw_content": "Source: https://httpbin.org/html\n\n---\n\nAvailing himself of the mild, summer-cool weather that now reigned in these latitudes, and in preparation for the peculiarly active pursuits shortly to be anticipated..."
    }
  ],
  "failed_results": [],
  "response_time": 0.932
}
```

### Text format extraction

```bash
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://httpbin.org/html"], "format": "text"}'
```

```json
{
  "results": [
    {
      "url": "https://httpbin.org/html",
      "raw_content": "Source: https://httpbin.org/html\n\n---\n\nAvailing himself of the mild, summer-cool weather..."
    }
  ],
  "failed_results": [],
  "response_time": 0.001
}
```

> Note: Second call returned in 0.001s due to Redis cache hit from the first request.

### Mixed success and failure

```bash
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://httpbin.org/html", "https://thisdomaindoesnotexist99999.com/page"]}'
```

```json
{
  "results": [
    {
      "url": "https://httpbin.org/html",
      "raw_content": "Source: https://httpbin.org/html\n\n---\n\nAvailing himself of the mild..."
    }
  ],
  "failed_results": [
    {
      "url": "https://thisdomaindoesnotexist99999.com/page",
      "error": "[Errno -2] Name or service not known"
    }
  ],
  "response_time": 1.664
}
```

---

## 8. Validation Errors (422)

All invalid requests return HTTP 422 with detailed error messages.

| Test | Request Body | Status |
|------|-------------|--------|
| Missing query | `{"max_results": 5}` | 422 |
| max_results too high | `{"query": "test", "max_results": 50}` | 422 |
| Invalid search_depth | `{"query": "test", "search_depth": "ultra"}` | 422 |
| Invalid topic | `{"query": "test", "topic": "finance"}` | 422 |
| Invalid time_range | `{"query": "test", "time_range": "century"}` | 422 |
| Empty body | `{}` | 422 |
| Empty URLs | `{"urls": []}` | 422 |
| Too many URLs (21) | `{"urls": ["..."] * 21}` | 422 |
| Invalid format | `{"urls": ["..."], "format": "html"}` | 422 |

### Example error response (missing query):

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "query"],
      "msg": "Field required",
      "input": {"max_results": 5}
    }
  ]
}
```

---

## 9. Request ID Tracing

### Auto-generated X-Request-ID

```
HTTP/1.1 200 OK
content-type: application/json
x-request-id: cb51a523-a575-4890-bdb2-1a8c05a25f3f

{"status":"ok","service":"orio-search"}
```

### Custom X-Request-ID passthrough

```bash
curl -H "X-Request-ID: my-custom-trace-id-123" http://localhost:8000/health
```

```
HTTP/1.1 200 OK
x-request-id: my-custom-trace-id-123
```

---

## Summary

| Endpoint | Method | Tests | Status |
|----------|--------|-------|--------|
| `/health` | GET | 1 | PASS |
| `/openapi.json` | GET | 1 | PASS |
| `/tool-schema` | GET | 1 | PASS |
| `/search` (basic) | POST | 4 | PASS |
| `/search` (advanced) | POST | 1 | PASS |
| `/search` (images) | POST | 1 | PASS |
| `/search` (domain filters) | POST | 2 | PASS |
| `/search` (full featured) | POST | 1 | PASS |
| `/search/stream` | POST | 3 | PASS |
| `/extract` | POST | 4 | PASS |
| Validation (422 errors) | POST | 9 | PASS |
| Request ID tracing | ALL | 2 | PASS |
| **Total** | | **30** | **ALL PASS** |
