# Running Resume Builder AI locally on Windows (no Docker)

Native setup — just Node.js, Git, and (optionally) Ollama installed directly on
Windows. Nothing runs in containers.

By the end you'll have:

- The SPA at **http://localhost:5173**
- Free, offline AI via **Ollama for Windows** at `http://localhost:11434`

A separate doc covers the Docker flow: [`RUN-ON-WINDOWS-DOCKER.md`](RUN-ON-WINDOWS-DOCKER.md).

---

## 1. Install prerequisites

### 1.1 Node.js 20+
Download the **LTS (20.x or newer)** installer from <https://nodejs.org/> and
run it with defaults. In a fresh PowerShell window verify:

```powershell
node --version   # should print v20.x.x or higher
npm --version
```

> If you manage multiple Node versions, use **nvm-windows**
> (<https://github.com/coreybutler/nvm-windows>) and
> `nvm install 20 && nvm use 20`.

### 1.2 Git for Windows
Download from <https://git-scm.com/download/win>, run the installer.

Before cloning, normalize line endings so shell scripts stay LF-clean:

```powershell
git config --global core.autocrlf input
```

### 1.3 Ollama for Windows (optional but recommended)
Only needed if you want the free local AI backend. Download the installer from
<https://ollama.com/download/windows> and run it. Ollama runs as a background
service and a small tray icon.

Verify:

```powershell
ollama --version
ollama list
```

You can skip this step if you plan to point the app at a cloud provider
(Gemini / Groq / OpenAI / Anthropic) via a deployed worker instead.

---

## 2. Clone and install

In PowerShell, in whatever folder you use for code:

```powershell
git clone https://github.com/shanthsp2002/resumebuilderai.git
cd resumebuilderai
git checkout claude/ai-resume-builder-fkqHK
npm install
```

The install takes ~30 s and writes a local `node_modules/`.

---

## 3. Start the app

```powershell
npm run dev
```

Vite prints something like:

```
  VITE v5.x  ready in 480 ms
  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. You should see the split-screen editor with
the live PDF preview on the right.

Stop the dev server with **Ctrl+C**.

---

## 4. Wire up local AI (Ollama)

### 4.1 Pull a model

Pick one. `llama3.1:8b` is a solid default on most laptops; `phi3.5:3.8b` is
the fastest on an 8 GB machine.

```powershell
ollama pull llama3.1:8b
# optional alternatives:
# ollama pull qwen2.5:7b
# ollama pull phi3.5:3.8b
```

Check it's available:

```powershell
ollama list
```

### 4.2 Allow the browser to talk to Ollama

Ollama blocks cross-origin requests by default. The app's dev server runs on
`http://localhost:5173` and needs to call `http://localhost:11434`, so you
must whitelist origins.

**Persistent (recommended):**

1. Press **Win + R**, type `sysdm.cpl`, press Enter.
2. **Advanced → Environment Variables…**
3. Under **User variables**, click **New…**
   - Name: `OLLAMA_ORIGINS`
   - Value: `*`
4. Click **OK** out of all dialogs.
5. Right-click the Ollama tray icon → **Quit Ollama**, then relaunch it from
   the Start menu. The new env var only takes effect on relaunch.

**Temporary (one shell only):**

```powershell
# In PowerShell, run Ollama manually instead of as a service:
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

Leave that window open while you use the app.

### 4.3 Point the app at local Ollama

1. Open **http://localhost:5173**.
2. Click **AI: Auto** in the top-right toolbar.
3. **Provider** → `Ollama on my machine (local)`.
4. **Local Ollama URL**: `http://localhost:11434`
5. **Local model**: `llama3.1:8b` (or whatever you pulled)
6. **Done**.

Click "Enhance with AI" on the summary or an experience bullet. The first
call warms the model (20–60 s on CPU); subsequent calls are quick.

---

## 5. (Optional) Run the edge worker locally

Only needed if you want to develop / test the Cloudflare Worker proxy itself,
or if you want to use OpenAI / Anthropic / Gemini / Groq while developing
without deploying the worker to Cloudflare.

### 5.1 Keep the SPA running

Leave `npm run dev` running in **Terminal 1**.

### 5.2 Start the worker in local mode

In **Terminal 2** (PowerShell, in the repo root):

```powershell
npm run worker:dev:local
```

This uses `wrangler.dev.toml` (not the production `wrangler.toml`), which
omits the Cloudflare Workers AI binding so no Cloudflare account login is
required. It defaults to `PROVIDER=ollama` and
`OLLAMA_URL=http://localhost:11434`.

The worker binds on **http://localhost:8787**. Vite's dev server already
proxies `/api/*` to `127.0.0.1:8787`, so the app will transparently route
AI calls through the worker.

In the UI, switch **AI Settings → Provider** back to `Auto (server default)`
to use the worker instead of the direct-Ollama path.

### 5.3 Using a cloud provider through the local worker

To try Groq / OpenAI / Anthropic / Gemini while running the worker locally,
create a **`.dev.vars`** file in the repo root (git-ignored):

```ini
# .dev.vars
PROVIDER = "groq"
GROQ_API_KEY = "gsk_..."
```

Swap in whichever key/provider you want:

```ini
PROVIDER = "openai"
OPENAI_API_KEY = "sk-..."
```

```ini
PROVIDER = "anthropic"
ANTHROPIC_API_KEY = "sk-ant-..."
```

```ini
PROVIDER = "gemini"
GEMINI_API_KEY = "..."
```

Restart `npm run worker:dev:local`. Verify:

```powershell
curl.exe http://localhost:8787/api/providers
```

---

## 6. Useful commands cheat sheet

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Start SPA | `npm run dev` |
| Start local worker | `npm run worker:dev:local` |
| Production build | `npm run build` |
| Preview prod build | `npm run preview` |
| Pull a model | `ollama pull llama3.1:8b` |
| List models | `ollama list` |
| Remove a model | `ollama rm llama3.1:8b` |
| Tail Ollama logs (when `ollama serve` is manual) | already in that window |

---

## 7. Troubleshooting

### `npm install` fails with `EACCES` or `permission denied`
Close any open terminals in the repo, delete `node_modules\` and
`package-lock.json`, then retry. Or try:
```powershell
npm cache clean --force
npm install
```

### Port 5173 already in use
Something else is running. Either stop it or start Vite on a different port:
```powershell
npm run dev -- --port 5174
```

### "Enhance with AI" says it can't reach `http://localhost:11434`
- Is Ollama running? Open the tray, make sure the icon is there.
- Did you set `OLLAMA_ORIGINS=*` and **restart** the Ollama app?
- Try `curl.exe http://localhost:11434/api/tags` from PowerShell — it should
  return JSON. If not, the service isn't up.

### Browser blocks the call as "mixed content"
This only happens if you serve the app over HTTPS. For local dev, use
`http://localhost:5173`, not `https://`.

### Ollama is slow / uses all my CPU
- Pick a smaller model: `ollama pull phi3.5:3.8b` and update the **Local model**
  field in the app.
- If you have an NVIDIA GPU, Ollama for Windows uses it automatically.
  Confirm with `ollama ps` while a generation is running — it should show GPU
  memory in use.

### I installed a model but the app still fails
Make sure the **Local model** value in AI Settings matches the tag you
pulled exactly, including the `:8b` suffix.

### I want the app available on my LAN (other devices)
```powershell
npm run dev -- --host 0.0.0.0
```
Then visit `http://<your-windows-ip>:5173` from the other device. Windows
Defender Firewall may prompt the first time — allow it for private networks.

### WSL / antivirus makes file-watching laggy
Run the project from a native Windows folder (e.g. `C:\dev\resumebuilderai`),
not from inside `\\wsl$\...`. Exclude the repo folder from real-time scanning
in Microsoft Defender if reloads are sluggish.

### I only want to build the SPA and serve it statically
```powershell
npm run build
npm run preview      # serves dist/ on http://localhost:4173
```
Host the `dist/` folder anywhere (GitHub Pages, Cloudflare Pages, Vercel).
Set `VITE_AI_ENDPOINT` before `npm run build` to point at your deployed
worker, e.g. `https://resume-proxy.your-subdomain.workers.dev/api/enhance`.

---

## What's running where — mental model

```
Browser (Windows)
  ├─ http://localhost:5173   ← Vite dev server (your app)
  │     │
  │     ├─ [direct path]   browser ──► http://localhost:11434 ──► Ollama.exe
  │     │
  │     └─ [worker path]   browser ──► /api/enhance
  │                           └─ Vite proxy ──► http://localhost:8787 (wrangler dev)
  │                                              └─ worker ──► Ollama / Groq / …
  │
  └─ No data ever leaves this machine in the direct path.
     In the worker path, data leaves only if you configured a cloud provider.
```

Everything is stateless. Your resume data only lives in this browser's
`localStorage`. Exporting PDF or DOCX builds the file in-memory and downloads
it — no upload, no server file storage.
