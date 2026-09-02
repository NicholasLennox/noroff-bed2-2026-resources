# Containers to Cloud - Knowledge Check

Nineteen questions covering the week: Docker networking and Compose, deploying a container to App Service, pushing to a private registry, and versioned deployments. Closed book.

Two questions - **13** and **19** - are marked *(beyond the lessons)*. They go past what we covered directly and are meant to be reasoned out rather than recalled. Everything else is in the lecture notes or the katas, even if it was an aside you may have skimmed.

## Ports and Addresses

**1.** A warehouse label-printing service listens on port 8080 inside its container. You started it with:

```bash
docker run -d --name labeller -p 9000:8080 label-api
```

A second container, on the same user-defined network, needs to call it. Which address should that second container use?

- **A.** `localhost:9000`
- **B.** `labeller:9000`
- **C.** `labeller:8080`
- **D.** `localhost:8080`

**2.** A ferry timetable API listens on port 5000. Its Dockerfile has no `EXPOSE` instruction. You deploy the image to App Service as a custom container; the container starts, but every request to the public URL eventually times out. What do you add?

- **A.** An app setting `PORT` with the value `5000`
- **B.** A port mapping of `5000:5000` on the Container tab
- **C.** An App Service plan tier that permits custom container ports
- **D.** An app setting `WEBSITES_PORT` with the value `5000`

**3.** The greeting API we deployed in class listens on port 3000, its Dockerfile contains `EXPOSE 3000`, and nobody ever set `WEBSITES_PORT`. It worked anyway. Why, and what should you do on your own projects?

- **A.** `EXPOSE` publishes the port the way `-p` does, so no further setting is ever needed.
- **B.** App Service inspected the image and forwarded traffic to the port `EXPOSE` declares. Set `WEBSITES_PORT` anyway - the documentation describes this detection inconsistently, and a setting that is inferred is one nobody can see.
- **C.** App Service scanned the running container for listening sockets, so `EXPOSE` made no difference.
- **D.** 3000 is on App Service's list of automatically detected ports, alongside 80 and 8080.

---

## Containers Finding Each Other

**4.** A podcast transcription API runs in one container and calls a speech-to-text service running in another, on port 7000. Both containers are on the same user-defined network. The transcription API is configured with `TRANSCRIBER_HOST=localhost`, and its logs show:

```
connect ECONNREFUSED 127.0.0.1:7000
```

What is wrong?

- **A.** `localhost` inside the transcription container means that container itself, so the request never leaves it.
- **B.** The two containers are not attached to the same network.
- **C.** The speech-to-text container has not published port 7000 to the host.
- **D.** Docker's embedded DNS has not yet resolved `localhost` to the speech-to-text container.

**5.** A teammate fixes it by setting `TRANSCRIBER_HOST=host.docker.internal` and using the speech-to-text container's published host port. It works on their machine. Why is this still the wrong fix?

- **A.** It only works while both containers are on the default `bridge` network.
- **B.** The hostname resolves to a new address each time the containers are recreated.
- **C.** It routes traffic out to the host and back in for two containers sitting on the same machine, and there is no equivalent hostname once they run in the cloud.
- **D.** It bypasses Docker's embedded DNS, which makes every request slower.

---

## Configuration from Outside the Image

**6.** A fitness-class booking API is deployed to App Service. Its `/health` endpoint answers `200`, the rest of the API works, and the response body reads:

```json
{ "status": "ok", "environment": "default" }
```

What does that tell you?

- **A.** The image was built without a `.env` file inside it.
- **B.** App Service has not finished pulling the image.
- **C.** The container failed to start and App Service is serving its own placeholder page.
- **D.** The deployment worked, but no `ENVIRONMENT` value reached the process.

**7.** Locally, the same API runs in a container started with `--env-file .env`. A developer edits `.env` to change `ENVIRONMENT` from `development` to `staging`, refreshes `/health`, and still sees `development`. Why?

- **A.** `.env` files are baked into the image when it is built, so a rebuild is needed.
- **B.** `--env-file` is read once, when the container is created; the container has to be removed and recreated.
- **C.** The application read `process.env` at startup and `dotenv` has to be reloaded.
- **D.** Docker cached the environment layer; the build needs `--no-cache`.

**8.** On the booking app's **Environment variables** blade in the portal, the team finds `DOCKER_REGISTRY_SERVER_URL`, `DOCKER_REGISTRY_SERVER_USERNAME` and `DOCKER_REGISTRY_SERVER_PASSWORD`, none of which they typed. What are they?

- **A.** They were set by `ENV` instructions in the image's Dockerfile.
- **B.** They are the credentials the container itself uses to pull its base image when it starts.
- **C.** They are reserved App Service settings the platform uses to pull the image, and they are not handed to the application process.
- **D.** They have to be deleted before the app can use a managed identity to pull.

---

## Docker Compose

**9.** A school timetable project has a `docker-compose.yml` with a `db` service and an `api` service. The `api` service reads:

```yaml
  api:
    image: timetable-api
    ports:
      - "3000:3000"
```

`docker compose up -d` starts the database, then reports that the image for `api` could not be found. What is wrong?

- **A.** `image:` tells Compose which image to run, not to build one; the image has to exist already.
- **B.** The `api` service is behind a profile that was not requested.
- **C.** The file is missing the `version:` key that Compose requires.
- **D.** An `image:` value must include a registry host.

**10.** With that fixed, the timetable API is written to call `process.exit(1)` if it cannot reach the database at startup. The Compose file contains no `depends_on` and no `restart:` key. You run `docker compose up -d`, and by the time you run `docker compose ps` the API container is gone - the database needed a few seconds before it would accept connections. The class demo's API was written differently. What did it do, and why?

- **A.** It retried the connection until it succeeded, which is why `/health` never reports a disconnected database.
- **B.** It exited as well, but Compose restarted it automatically until the database was ready.
- **C.** It refused to start at all until `depends_on` was added to the Compose file.
- **D.** It logged the failure and carried on listening, so `/health` could still be asked and could answer `database: "disconnected"` - a container you can still question tells you more than one that has vanished.

---

## Image Names, Tags and Digests

**11.** A museum builds its audio-guide API with `docker build -t audioguide-api .` and tries to publish it. They are signed in to Docker Hub. The push fails:

```
The push refers to repository [docker.io/library/audioguide-api]
...
denied: requested access to the resource is denied
```

What is wrong?

- **A.** The Docker Hub credential has expired and `docker login` has to be run again.
- **B.** The name carries no registry and no namespace, so Docker expanded it to Docker Hub's `library` namespace, where they have no write access.
- **C.** The image has no explicit `:tag`, and `latest` cannot be pushed.
- **D.** `docker push` needs the destination registry given as a flag.

**12.** The museum now builds with two names in one command - `audioguide-api` and `museumreg.azurecr.io/audioguide-api:v1` - and pushes `:v1` successfully. Later they fix a bug, rebuild with `docker build -t audioguide-api .`, and push `museumreg.azurecr.io/audioguide-api:v1` again. The deployed app is unchanged, and in the portal the `v1` tag still shows the same digest as before. Why?

- **A.** The build reused cached layers, so no new image was produced.
- **B.** The push succeeded, but App Service caches images and the app needs restarting.
- **C.** Only `audioguide-api` moved to the new build; the registry-prefixed name is still pointing at the old image ID.
- **D.** Two names for the same image cannot be pushed independently.

**13.** *(beyond the lessons)* The museum's web app is pinned to the `:latest` tag, and **Continuous deployment** is switched on in the Deployment Center - the toggle we saw but did not use. A developer pushes a half-finished build from their laptop, tagged both `experiment` and `latest`. What happens?

- **A.** The registry notifies the web app, which redeploys with the half-finished build.
- **B.** Nothing happens, because continuous deployment only triggers for the tag the app is pinned to, and that is `experiment`.
- **C.** Nothing happens until someone opens the Deployment Center and saves.
- **D.** The app redeploys, but Azure keeps the previous container serving until the new one passes a health check.

---

## Registries and Credentials

**14.** A developer runs `az login`, completes the browser sign-in, and immediately runs:

```bash
docker push tourreg.azurecr.io/tour-api:v1
```

It fails with `unauthorized`. Why?

- **A.** `az login` needs `--registry` to include the registry in its scope.
- **B.** The image has not been tagged with the registry's login server.
- **C.** A managed identity has to be enabled on the registry before it will accept a push.
- **D.** `az login` authenticates to Azure; it does not put a registry credential into Docker's config. `az acr login --name tourreg` is what does that.

**15.** A nightly build runs on a third-party CI platform outside Azure and has to push an image to the team's ACR every night. A colleague suggests scripting `az login` and `az acr login` into the pipeline using their own Azure account. What is wrong with that, and what fits instead?

- **A.** Nothing is wrong; `az acr login` is intended for pipelines and refreshes itself.
- **B.** It should use the registry's admin account, which is enabled by default for this purpose.
- **C.** The token it produces lasts three hours and belongs to a person; automation running outside Azure should have its own non-human identity - a service principal or token - with its own credential and expiry.
- **D.** It should use a managed identity, which is the recommended option for all automation.

---

## Hosting on Azure

**16.** A veterinary clinic has an appointment API, already containerised and listening on one HTTP port. They want it reachable at an HTTPS URL with a valid certificate, with as little configuration as possible. Which Azure service, and why?

- **A.** Azure Container Instances, because it runs a container from an image with nothing else to configure.
- **B.** Azure App Service, because it is optimised for web applications and supplies the public URL, the certificate and the routing without any decision on their part.
- **C.** Azure Container Apps, because it can scale to zero when the clinic is closed.
- **D.** Azure Container Instances with an App Service plan placed in front of it.

**17.** A research group already runs one web app on a paid App Service plan. They create a second web app and host it in that same plan. What happens to their bill?

- **A.** It does not change. The plan carries the charge, and the two apps now share the same VMs and scale together.
- **B.** It roughly doubles, because each web app is billed on its own.
- **C.** It does not change, and each app gets independent compute, so neither can affect the other.
- **D.** It rises only when the second app receives traffic, because App Service bills per request.

**18.** The same group cannot work out what any individual project costs: resources for three projects are scattered across one subscription with no grouping. What does giving each project its own resource group actually buy them?

- **A.** Each project gets its own spending quota within the subscription.
- **B.** Resources in different resource groups cannot reach one another, so the projects are isolated.
- **C.** Each resource group is billed separately and can be given its own payment method.
- **D.** Everything in a group shares a lifecycle and the group is a natural unit for reading cost - one delete removes a project, and "what is this costing" has an answer.

**19.** *(beyond the lessons)* App Service has a **Health Check** feature, which we saw listed as `Not Configured` and left alone: you nominate a path, and the platform polls it and takes instances that fail out of rotation. Suppose you switched it on and pointed it at the booking API's `/health`, which returns `503` whenever its database is unreachable. What have you actually set up?

- **A.** A platform that pulls the app out of rotation whenever its database is unreachable - appropriate if the API is useless without one, harmful if most of its endpoints are not.
- **B.** Nothing useful, because App Service only accepts a `200` from that path and ignores any other status.
- **C.** A guarantee that App Service will restart the database when it becomes unreachable.
- **D.** The same check App Service already performs to decide the container has started, so the setting changes nothing.

---
