# Containerising a Node.js API with Docker

> This resource follows the class demo step by step. We took a small Express API (the `/health` kata from a previous lesson) and containerised it. The Dockerfile we started with was **deliberately naive** - each problem we hit afterwards is the reason a particular best practice exists. Where a word might be new, a plain-English version is given in *[brackets]* right after it.

## 1. Docker architecture recap

Docker uses a **client-server architecture**. The piece you type commands into is not the piece that does the work.

![Docker architecture](https://docs.docker.com/get-started/images/docker-architecture.webp)

- **Docker client (`docker`)**: the CLI you type into. It does almost nothing itself - it turns your command into an API call and sends it away.
- **Docker daemon (`dockerd`)**: the background service that does the actual work - building images, running containers, managing networks and volumes. The client and daemon talk over a **REST API** *[a standard way for programs to send each other requests over HTTP]*, across a UNIX socket or a network interface.
- **Registry**: where images are stored and shared. **Docker Hub** is the default public one.
- **Docker Desktop**: the bundle we all installed. It ships the daemon, the client, Docker Compose, Kubernetes and credential management in one application, and gives us a GUI over the same daemon.

Because the client and daemon are separate, the daemon *could* be on another machine entirely. On Windows and Mac it already is, in a sense - the daemon runs inside a small Linux VM that Docker Desktop manages for you. This is worth remembering: **the container's "computer" is not your computer**, which is exactly why the port and file exercises later behave the way they do.

**Docker objects** - the two we care about now:

- An **image** is a read-only template, built up out of stacked layers. It is the environment: OS files, runtime, dependencies, your code, and the command to start.
- A **container** is a running instance of an image, with its own isolated filesystem, networking and process space. One image can run as many containers.

`docker run` looks like one action but is really several: pull the image if it is not local, create a container from it, allocate a writable filesystem layer for it, attach it to a network, and start the process.

> The client is a remote control. The daemon is the machine.

### 1.1 Tooling

Install the **Docker extension for VS Code**. It gives you autocomplete and inline documentation in the Dockerfile, syntax highlighting, and a view of your local images and containers. Writing a Dockerfile without it means guessing at instruction names.

## 2. The application we containerised

A minimal Express API with a single endpoint, from a previous kata:

```js
// src/app.js
const ENVIRONMENT = process.env.ENVIRONMENT || 'default'

app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT
  });
});
```

```js
// src/server.js
const PORT = process.env.PORT || 3000
app.listen(PORT, ...)
```

Two details matter for everything that follows:

1. Both `PORT` and `ENVIRONMENT` come from environment variables, **with fallbacks** (`3000` and `'default'`).
2. Locally, those variables come from a `.env` file loaded by `dotenv`:

```
PORT=5000
ENVIRONMENT=development
```

So running locally, the app is on port **5000** in the **development** environment. Keep those two numbers in mind.

## 3. Choosing a base image

We browsed [Docker Hub](https://hub.docker.com) to see how official images are published: one **repository** (`node`), many **tags** (`22`, `22-slim`, `22-alpine`, ...). A tag is just a label pointing at a specific build of that image.

We pulled two variants and compared them:

```bash
docker pull node:22-slim
docker pull node:22-alpine
docker images
```

| Tag | Base OS | Size (as pulled in class) |
|---|---|---|
| `node:22` | Full Debian | ~1.1 GB |
| `node:22-slim` | Debian, stripped back | 227 MB |
| `node:22-alpine` | Alpine Linux | 165 MB |

They all contain the same Node runtime. The difference is how much Linux distribution comes along with it. Docker Hub (and Docker Desktop) also shows a **vulnerability count** per tag - fewer packages in the image means fewer things that can have a published CVE *[a publicly catalogued security vulnerability]*. That is the real argument for a small base image: not just disk space, but a smaller **attack surface** *[the amount of software an attacker could potentially exploit]*.

We chose `node:22-alpine`.

> Alpine is very small but uses `musl` instead of `glibc` as its C library. Most Node packages are fine, but native modules that expect `glibc` can misbehave. If a dependency breaks in a strange way on Alpine, `slim` is the usual fallback.

## 4. Our first Dockerfile

```dockerfile
# Base image containing the node runtime we need + a linux distro
FROM node:22-alpine

# The working directory inside the container - every command after this runs here
WORKDIR /app

# Copy only the package files first, so this layer can be cached
COPY package*.json .

# Install dependencies into /app/node_modules
RUN npm ci

# Copy the rest of the project
COPY . .

# The command that runs when a container starts
CMD ["npm", "start"]
```

Line by line:

- **`FROM`** - the starting layer. Everything else is stacked on top of it.
- **`WORKDIR /app`** - creates and moves into `/app` inside the container's filesystem. Without this, we would be building into the Linux root directory.
- **`COPY package*.json .`** - copies `package.json` **and** `package-lock.json` (the wildcard catches both) into `/app`.
- **`RUN npm ci`** - `ci` rather than `install`: it installs exactly what the lock file specifies and fails if the lock file is out of sync. Repeatable builds are the point of the whole exercise, so we do not want dependency versions drifting between builds.
- **`COPY . .`** - the rest of the project.
- **`CMD`** - what runs when a **container** starts. Note the difference: `RUN` executes at **build time** and its result is baked into the image; `CMD` executes at **run time** and is not.

### 4.1 Why the copy is split in two

This is the part that looks redundant and is not. Each instruction creates a **layer**, and Docker caches layers. On a rebuild it reuses every layer up to the first one whose inputs changed, then rebuilds everything after it.

Your source code changes constantly. Your dependencies barely change at all. By copying the package files and running `npm ci` **before** copying the source, a normal code change invalidates only the last two layers - the install layer is reused and the build takes seconds.

If we had written a single `COPY . .` before `npm ci`, every one-character change to a route handler would re-run the full install.

> Order your Dockerfile from least-likely-to-change to most-likely-to-change.

## 5. Building and running it

```bash
docker build -t simple-api .
```

- `-t simple-api` names *[tags]* the image. We deliberately used a bare name with no version and no account prefix - section 9 is where that comes back to bite us.
- The `.` is the **build context**: the directory that gets sent to the daemon and that `COPY` can read from. Remember the daemon is a separate process - it cannot see your disk, so the context is packed up and handed over.

```bash
docker run -p 8000:5000 simple-api
```

`-p` **publishes** a port, and reads **`host:container`**. So: "traffic arriving at port 8000 on my machine should be forwarded to port 5000 inside the container." Visiting `http://localhost:8000/health` returned our JSON, showing `"environment": "development"`.

### 5.1 Looking inside the container

Using the **Files** tab in Docker Desktop (or `docker exec -it <container> sh` from the CLI) we opened `/app` in the container's filesystem and found the whole project sitting there - including things that have no business being in a production image:

- `.gitignore`, `.vscode/` - development tooling, irrelevant at runtime
- `lecture-steps.md` - notes
- `.env` - **secrets**
- `node_modules` - the copy from *your laptop*, built for *your* operating system, which just overwrote the one `npm ci` correctly built inside the image

That last one is the dangerous one. It quietly defeats the careful layer caching from section 4.1 and can produce an image that works on your machine and crashes on Linux.

> A container's filesystem is a real Linux filesystem. Go and look at it - most Docker confusion disappears the moment you do.

## 6. Fixing the context with `.dockerignore`

`.dockerignore` works like `.gitignore`, but it excludes files from the **build context** - so `COPY . .` never sees them at all.

```
.vscode
node_modules
.gitignore
lecture*.md
.env
```

Rebuilding gives a smaller, cleaner image with no secrets and no host-built `node_modules`. It is also a faster build, because less data is shipped to the daemon in the first place.

### 6.1 The break this caused

We reran the exact same command as before:

```bash
docker run -p 8000:5000 simple-api   # no longer works
```

`localhost:8000` now returned nothing. Nothing had changed in the code - but `.env` was no longer being copied, so `dotenv` found no file, `process.env.PORT` was undefined, and the fallback took over. **The app inside the container was listening on 3000, not 5000.** We were forwarding host port 8000 to container port 5000, where nothing was listening.

The fix:

```bash
docker run -p 8000:3000 simple-api
```

The `/health` response also confirmed the second consequence: `"environment": "default"`, not `"development"`.

This is worth sitting with, because it is the single most common Docker error you will hit:

- The container has **its own network namespace** - its own interfaces and its own `localhost`. `localhost` inside the container is *the container*, not your machine.
- The container port is whatever your app actually binds to. Nothing about `-p` changes that; publishing a port does not make an app listen on it.
- Only the **left-hand** number is negotiable. Pick any free host port you like; the right-hand number is dictated by the application.

> "It works locally but not in the container" is, more often than not, a port mismatch or a missing environment variable. Both were true here at the same time.

## 7. Documenting the port with `EXPOSE`

Once the app relies on its default, hard-coding `PORT` for the container buys us nothing - each container has its own isolated network, so two containers can happily both use 3000 internally without clashing. Conflicts only happen on the **host** side of `-p`, which the person running the image chooses anyway.

But that leaves a real problem: how does anyone else know which port to map to?

```dockerfile
EXPOSE 3000
```

`EXPOSE` **publishes nothing and changes no behaviour**. It is metadata - documentation baked into the image. It tells the next developer, and tooling like Docker Desktop (which will offer you the right port when you click Run), which port the application listens on. It is also what `docker run -P` uses to auto-assign host ports.

> `EXPOSE` documents. `-p` publishes. Only one of them actually opens anything.

## 8. Configuration: build time vs run time

`ENVIRONMENT` was still falling back to `default`. There are two places to fix that, and choosing between them is a genuine design decision.

### 8.1 Build-time configuration with `ENV`

```dockerfile
ENV ENVIRONMENT=development
```

The value is baked into the image at build time. Every container from this image starts with it, and it is available to processes as a normal environment variable.

The catch: it is **permanently visible**. It is in the Dockerfile, which is in source control, and it is in the image itself - anyone who pulls it can read it back with `docker inspect` or `docker history`. That makes `ENV` fine for non-sensitive defaults (a log level, a default port, `NODE_ENV=production`) and completely unsuitable for passwords, API keys or connection strings.

We commented ours out for exactly that reason.

### 8.2 Run-time configuration with `-e`

```bash
docker run -p 8000:3000 -e ENVIRONMENT=production simple-api
```

The same image now runs as production without being rebuilt. That is the property we want: **one image, many environments**. If the environment is baked in at build time, dev/staging/production are three different images, and the thing you tested is not the thing you shipped.

There is also `--env-file`, which reads a file of `KEY=value` pairs at run time:

```bash
docker run -p 8000:3000 --env-file .env simple-api
```

Note the difference from where we started: the file is read **by the Docker client on your machine at run time**, not copied into the image. The secret stays out of the image either way.

| | `ENV` in Dockerfile | `-e` / `--env-file` at run |
|---|---|---|
| Applied at | Build time | Run time |
| Stored in the image | Yes | No |
| Visible to anyone with the image | Yes | No |
| Change requires | A rebuild | Nothing, just rerun |
| Use for | Non-sensitive defaults | Secrets, per-environment values |

This is also the groundwork for **Docker Compose**, which we will get to later. Once an app needs a database alongside it, passing five `-e` flags by hand on every run stops being practical - Compose is where that configuration gets written down properly.

> Build the image once. Configure it at run time.

## 9. Sharing the image on Docker Hub

An image that only exists on your laptop solves nothing. The whole point is that the artefact you tested is the artefact that gets deployed.

Our first attempt:

```bash
docker push simple-api
```

```
denied: requested access to the resource is denied
```

The image name **is** its address. A bare name like `simple-api` is expanded to `docker.io/library/simple-api` - and `library/` is the namespace reserved for Docker's own official images. We were, quite literally, trying to publish over the top of the official library. Hence the authentication error.

Images destined for a registry have to be named for where they are going:

```bash
docker tag simple-api <your-dockerhub-username>/simple-api:1.0.0
docker push <your-dockerhub-username>/simple-api:1.0.0
```

Reading a full image reference: `registry / namespace / repository : tag`. Docker Hub is assumed when the registry is left out, which is why `<username>/<repo>:<tag>` is enough. Later in the course we will point the same workflow at a private registry instead, and only that first part changes.

### 9.1 What tagging actually does

`docker tag` does **not** copy or rebuild anything. Run `docker images` after tagging and both names show the same **IMAGE ID** - two labels pointing at one set of layers. The same is true for `latest`, which is not a special "newest" mechanism, just a conventional default tag that Docker assumes when you do not supply one.

Get in the habit of pushing a real version tag (`1.0.0`) as well as `latest`. Deploying `latest` means you cannot say for certain which build is running.

## 10. Building a Dockerfile with Gordon

Once we understood the mechanics by hand, we asked **Gordon** (Docker's AI agent, in Docker Desktop and via `docker ai`) to write a Dockerfile for the same project. What it produced was essentially identical to what we had written ourselves.

That was the point of doing it in that order. The agent is fast and generally correct, but you can only *see* that it is correct, or spot the moment it is not, if you already know what the file should say. Reviewing generated infrastructure is exactly the same skill as reviewing generated code.

### 10.1 A look ahead: multi-stage builds

We then asked for something harder: a build that runs the test suite and ships only production dependencies. **You do not need this yet** - treat it as a preview of where we are heading.

The idea is to use several `FROM` stages in one Dockerfile. An early stage installs *all* dependencies (including `jest` and `supertest`) and runs `npm test`; if the tests fail, the build fails and no image is produced. A later, clean stage installs only production dependencies and copies in the application. Only the final stage ships, so the test tooling never reaches the runtime image.

In class the multi-stage image came out around **170 MB** against **214 MB** for our single-stage version, with the dev dependencies gone.

One quirk to notice if you try it: our test asserts `environment` is not `'default'`, so the test stage needs `ENVIRONMENT` set for the suite to pass during the build. A good illustration that tests carry environment assumptions with them.

## 11. Command reference

```bash
# Images
docker pull node:22-alpine              # download an image from a registry
docker images                           # list local images (note the IMAGE ID column)
docker build -t simple-api .            # build from the Dockerfile in "."
docker rmi simple-api                   # remove an image

# Containers
docker run -p 8000:3000 simple-api                       # run, publishing host:container
docker run -p 8000:3000 -e ENVIRONMENT=production simple-api   # with runtime config
docker run -d -p 8000:3000 simple-api                    # detached (background)
docker ps                               # running containers
docker ps -a                            # including stopped ones
docker logs <container>                 # its stdout - the first place to look
docker exec -it <container> sh          # a shell inside a running container
docker stop <container>                 # stop it

# Sharing
docker tag simple-api <username>/simple-api:1.0.0
docker login
docker push <username>/simple-api:1.0.0
```

### 11.1 The recurring mistakes

| Symptom | Usual cause |
|---|---|
| `localhost:<port>` returns nothing | The right-hand side of `-p` does not match the port the app binds to |
| Config is missing inside the container | `.env` is (correctly) excluded - pass it with `-e` or `--env-file` |
| Rebuilds are slow every time | `COPY . .` sits before `npm ci`, invalidating the dependency layer |
| `denied: requested access to the resource is denied` | The image is not tagged with your registry namespace |
| Works locally, crashes in the container | Host `node_modules` copied in - check `.dockerignore` |

## 12. Sources

1. Docker Docs, *Docker overview* (architecture, objects, registries) - [docs.docker.com/get-started/docker-overview](https://docs.docker.com/get-started/docker-overview/)
2. Docker Docs, Docker architecture diagram - [docs.docker.com/get-started/images/docker-architecture.webp](https://docs.docker.com/get-started/images/docker-architecture.webp)
3. Docker Docs, *Dockerfile reference* - [docs.docker.com/reference/dockerfile](https://docs.docker.com/reference/dockerfile/)
4. Docker Docs, *Build context and `.dockerignore`* - [docs.docker.com/build/concepts/context](https://docs.docker.com/build/concepts/context/#dockerignore-files)
5. Docker Docs, *Multi-stage builds* - [docs.docker.com/build/building/multi-stage](https://docs.docker.com/build/building/multi-stage/)
6. Docker Docs, *Ask Gordon* - [docs.docker.com/ai/gordon](https://docs.docker.com/ai/gordon/)
7. Docker Hub, official `node` image - [hub.docker.com/_/node](https://hub.docker.com/_/node)
