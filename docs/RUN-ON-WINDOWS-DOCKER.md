# Running Resume Builder AI locally on Windows (Docker)

This guide walks you from a fresh Windows 10/11 machine to a working local
install of the resume builder with a **local, free, offline** AI backend
(Ollama) — no Cloudflare account, no API keys, no cloud calls.

There are two paths:

| Path | When to pick it | AI provider |
|---|---|---|
| **A. Simple (recommended)** | You just want it to work. Browser talks to Ollama directly. | `Ollama on my machine` |
| **B. Full stack with the worker** | You want to mirror the production edge-proxy locally. | Worker → Ollama container |

---

## 0. Prerequisites

1. **Windows 10 version 2004+ or Windows 11** (64-bit).
2. **WSL 2** — open PowerShell as Administrator:
   ```powershell
   wsl --install
   ```
   Reboot if prompted, then make sure the default version is 2:
   ```powershell
   wsl --set-default-version 2
   ```
3. **Docker Desktop for Windows** — <https://www.docker.com/products/docker-desktop/>. During setup, keep "Use WSL 2 based engine" enabled. Launch it once and wait for the whale icon to go steady.
4. **Git for Windows** — <https://git-scm.com/download/win>.
5. (Optional, GPU users) NVIDIA driver + the CUDA-capable Docker Desktop setting enabled. Ollama will automatically use the GPU if exposed.

Verify in PowerShell:

```powershell
docker --version
docker compose version
git --version
```

---

## 1. Clone the repo

Open PowerShell in a directory where you want the project, then:

```powershell
git clone https://github.com/shanthsp2002/resumebuilderai.git
cd resumebuilderai
git checkout claude/ai-resume-builder-fkqHK
```

> **Line-endings tip:** Git on Windows may convert LF to CRLF which breaks the
> shell scripts inside Linux containers. Either run
> `git config --global core.autocrlf input` before cloning, or add a
> `.gitattributes` with `* text=auto eol=lf`.

---

## Path A — Simple: browser → Ollama (no worker)

This is the fastest path. It uses the client-side "Ollama on my machine"
provider, which is already built into the app.

### A.1 Start the containers

From the repo root in PowerShell:

```powershell
docker compose up
```

This starts two services:

- `web` — Vite dev server on **http://localhost:5173**
- `ollama` — Ollama daemon on **http://localhost:11434**

The first run will take a couple of minutes while `npm install` runs inside the
container (its `node_modules` is cached in a named volume so subsequent boots
are fast). You'll see Vite print the URL when it's ready.

### A.2 Pull a model

In a **second** PowerShell window, pull a small, fast model into the Ollama
container:

```powershell
docker compose exec ollama ollama pull llama3.1:8b
```

Other good picks:

| Model | Size | Notes |
|---|---|---|
| `llama3.1:8b` | ~4.7 GB | Good quality, works on 16 GB CPU-only machines |
| `qwen2.5:7b`  | ~4.4 GB | Often writes better bullets than llama3.1 |
| `phi3.5:3.8b` | ~2.2 GB | Fastest, works on 8 GB RAM |
| `llama3.1:70b`| ~40 GB  | Best quality, needs a serious GPU |

Verify:

```powershell
docker compose exec ollama ollama list
```

### A.3 Point the app at local Ollama

1. Open **http://localhost:5173** in your browser.
2. Click **AI: Auto** in the top-right toolbar.
3. Set **Provider** = `Ollama on my machine (local)`.
4. Leave **Local Ollama URL** as `http://localhost:11434`.
5. Set **Local model** to whichever tag you pulled (e.g. `llama3.1:8b`).
6. Click **Done**.

Try the "Enhance with AI" button on the summary or an experience bullet. First
generation warms the model (can take 20–60 s on CPU). Subsequent calls are
fast.

### A.4 Stop / restart

```powershell
docker compose down        # stop containers, keep the model cache
docker compose down -v     # also wipe the downloaded model + node_modules
docker compose up -d       # background mode
docker compose logs -f web # tail logs
```

---

## Path B — Full stack: worker + Ollama

Use this when you want the local setup to look exactly like production (SPA →
edge worker → Ollama). The worker runs via `wrangler dev` inside a container
and uses `wrangler.dev.toml` so it does **not** require a Cloudflare account
login.

### B.1 Start everything

```powershell
docker compose --profile worker up
```

Services:

- `web` on **http://localhost:5173**
- `worker` on **http://localhost:8787** (proxied via Vite at `/api/*`)
- `ollama` on **http://localhost:11434**

### B.2 Pull a model (same as A.2)

```powershell
docker compose exec ollama ollama pull llama3.1:8b
```

### B.3 Use it

1. Open **http://localhost:5173**.
2. In **AI Settings**, set **Provider** = `Auto (server default)` — the worker
   is pre-configured with `PROVIDER=ollama` via `wrangler.dev.toml`, so the
   server default is already Ollama.
3. Optionally, set a **Model override** like `llama3.1:8b`.

### B.4 Test the worker directly (optional)

```powershell
curl.exe http://localhost:8787/api/providers
curl.exe -X POST http://localhost:8787/api/enhance `
  -H "Content-Type: application/json" `
  -d '{\"kind\":\"bullets\",\"notes\":\"fixed slow queries on the orders table\"}'
```

---

## GPU acceleration (optional)

On Windows 11 with an NVIDIA GPU + recent Docker Desktop:

1. Ensure your NVIDIA driver is current.
2. In Docker Desktop → Settings → Resources → **enable GPU support**.
3. Uncomment the `deploy.resources.reservations.devices` block for the `ollama`
   service in `docker-compose.yml`:

   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: all
             capabilities: [gpu]
   ```

4. `docker compose up --force-recreate ollama`

Verify:

```powershell
docker compose exec ollama nvidia-smi
```

You should see your GPU listed. Generation speed for `llama3.1:8b` should jump
from ~5 tok/s (CPU) to 40–80 tok/s (mid-range GPU).

---

## Using cloud providers instead (OpenAI / Anthropic / Gemini / Groq)

You don't have to use Ollama. Any cloud provider works the same way:

1. Start only the web service:
   ```powershell
   docker compose up web
   ```
2. In the app, open **AI Settings** → switch the provider to OpenAI, Anthropic,
   Gemini, or Groq.
3. Because no worker is running locally, you'll need to proxy to a deployed
   worker. Either:
   - Deploy the worker once: `npx wrangler deploy` (requires Cloudflare login),
     then set `VITE_AI_ENDPOINT=https://<your-worker>.workers.dev/api/enhance`
     in a `.env.local` file before `docker compose up`; or
   - Run the `worker` profile and store the API key as a local secret with a
     `.dev.vars` file next to `wrangler.dev.toml`:

     ```ini
     # .dev.vars  (git-ignored)
     GROQ_API_KEY = "gsk_..."
     ```

     Then edit `wrangler.dev.toml` to set `PROVIDER = "groq"`.

Recommended free-tier cloud picks:
- **Groq** — fastest, very generous free tier for Llama models.
- **Gemini 1.5 Flash** — Google AI Studio free tier.
- **Cloudflare Workers AI** — only when deployed (the local dev config does
  not bind it to avoid requiring `wrangler login`).

---

## Troubleshooting

### The web container keeps restarting / port 5173 refuses connections
- Port conflict with another Vite/Node app. Stop it or change the left side of
  `"5173:5173"` in `docker-compose.yml` to a free port (e.g. `"5174:5173"`).

### `npm install` is extremely slow or fails with network errors inside the container
- Docker Desktop's DNS can be flaky. Docker Desktop → Settings → Resources →
  Network → try enabling "Use Docker DNS" / reset.
- Or bypass the container and run `npm install` on the Windows host once
  (requires Node 20 locally), then restart compose; the host `node_modules`
  will be masked by the named volume — so prefer fixing DNS.

### "Enhance with AI" says "Could not reach local Ollama at http://localhost:11434"
- Make sure the `ollama` container is up: `docker compose ps`.
- Make sure `OLLAMA_ORIGINS=*` is set (it is, by default in the compose file).
  If you changed it, browser requests will fail CORS.
- If your browser auto-upgrades `http://localhost` to `https://`, either use a
  different browser or disable HSTS for localhost.

### Ollama is slow / OOM
- Pull a smaller model: `docker compose exec ollama ollama pull phi3.5:3.8b`.
- In the app's AI Settings, switch **Local model** to match.

### WSL2 is eating all my RAM
- Create `%UserProfile%\.wslconfig`:
  ```ini
  [wsl2]
  memory=8GB
  processors=4
  swap=4GB
  ```
- Then `wsl --shutdown` and start Docker Desktop again.

### `docker compose exec ollama ollama pull ...` errors with "exec failed"
- Ollama container isn't healthy yet — wait 10–20 s after `docker compose up`,
  or check `docker compose logs ollama`.

### Git / Windows line endings break shell scripts
- Inside the repo root:
  ```powershell
  git config core.autocrlf false
  git rm --cached -r .
  git reset --hard
  ```

---

## Cleaning up

```powershell
# Stop containers
docker compose down

# Remove everything, including downloaded models and node_modules cache
docker compose down -v

# Full wipe — images too
docker compose down -v --rmi all
```

Downloaded models live in the named volume `resumebuilderai_ollama-data`. That
volume also survives `docker compose down` (use `-v` to delete).

---

## Summary cheat sheet

| I want to… | Command |
|---|---|
| Start (simple) | `docker compose up` |
| Start (with worker) | `docker compose --profile worker up` |
| Stop | `docker compose down` |
| Pull model | `docker compose exec ollama ollama pull llama3.1:8b` |
| List models | `docker compose exec ollama ollama list` |
| Tail web logs | `docker compose logs -f web` |
| Tail worker logs | `docker compose logs -f worker` |
| GPU check | `docker compose exec ollama nvidia-smi` |
| Reset everything | `docker compose down -v` |
