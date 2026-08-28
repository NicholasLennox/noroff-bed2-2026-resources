# Containers to Cloud - Knowledge Check - Answer Key

Read this against your own answers. Each entry gives the correct option, why it is correct, and what you were probably thinking if you chose one of the others - that second part is the useful bit, because a wrong answer here usually means one specific idea is bent rather than missing.

Two questions, **13** and **19**, are marked *(beyond the lessons)*. They go past what we covered directly. Getting them wrong tells you nothing except that you have not met them yet.

Everything else is in the notes, including a few things that were asides rather than headline points. Where that is the case, the section number is given, so if a question felt unfamiliar you can go and read the paragraph it came from.

### Ports and Addresses

**1. C - `labeller:8080`**

On a user-defined network the two containers talk to each other directly, so you use the container's name and the port the process actually listens on - 8080. The `9000` in `-p 9000:8080` exists only so that *you*, on the laptop, have a door into the container. Nothing on the path between two containers goes near it.

**A** and **D** treat `localhost` as a place. It is not: it means "the machine I am running on", and inside the second container that is the second container. **D** is the closer of the two, because you got the port right - you have understood `-p` and not yet understood `localhost`. **B** is the mistake we hit in class: the name resolves correctly, but 3307-style published ports are the host's side of `-p`, so you get a connection refused at a real address.

**2. D - An app setting `WEBSITES_PORT` with the value `5000`**

App Service expects a custom container on port 80, and can also detect 8080. Anything else has to be declared, and `WEBSITES_PORT` is the only channel for declaring it. With no `EXPOSE` in the Dockerfile there is nothing for the platform to inspect either, so nothing at all tells it where to send traffic - which is why the container runs happily and every request times out.

If you chose **A**, you reached for `PORT` because that is the name applications commonly use for their own listening port. This one is not yours, it is the platform's, and the name matters. If you chose **B**, you were looking for something like `-p` on the Container tab. There isn't one: you never choose the outside port on App Service, because it is 80 and 443 in front of Azure's own front ends. **C** treats a routing problem as a pricing-tier capability.

**3. B - App Service inspected the image and forwarded traffic to the port `EXPOSE` declares. Set `WEBSITES_PORT` anyway - the documentation describes this detection inconsistently, and a setting that is inferred is one nobody can see**

This is the one that surprised us in the registry lesson: we expected to need `WEBSITES_PORT`, never set it, and the app worked. The cause is almost certainly `EXPOSE 3000`. Which is a good result for an instruction module 1 introduced as "documentation only" - it *is* documentation, and this is a platform reading it.

The practical half matters more than the mechanism. Microsoft's own sources do not agree on when detection happens: one pairs `EXPOSE` with `WEBSITES_PORT`, another says detection only covers 80 and 8080, a third says `WEBSITES_PORT` is for images without `EXPOSE`. Set it regardless. It costs one app setting, and it makes explicit something that is otherwise inferred - which is what stops a deployment breaking after a platform update for no reason you can see.

**A** is the misconception this course has been correcting since module 1: `EXPOSE` opens nothing and publishes nothing. `-p` does that. **C** is a reasonable guess at how a platform might work, but detection is described as inspecting the image, not watching the running process. **D** invents a list of default ports; the documented ones are 80 and 8080, which is exactly why the ferry API on 5000 in question 2 had to be told.

---

### Containers Finding Each Other

**4. A - `localhost` inside the transcription container means that container itself, so the request never leaves it**

The error names the address: `127.0.0.1:7000`. The request resolved to the transcription container's own loopback interface, found nothing listening, and was refused. It is not the wrong port. It is the wrong machine, and the request never reached the network at all.

**B** is the right diagnosis for a different error - containers on separate networks fail at name resolution, with `getaddrinfo ENOTFOUND`, not with a connection refused at `127.0.0.1`. Read the error before you read the setup. If you chose **C**, you believe `-p` is what makes a container reachable from another container; it is what makes one reachable from the host. **D** puts DNS in the picture, and it is not there at all - `localhost` never gets looked up on a network.

**5. C - It routes traffic out to the host and back in for two containers sitting on the same machine, and there is no equivalent hostname once they run in the cloud**

`host.docker.internal` genuinely resolves, and the symptom genuinely goes away, which is why it is worth taking seriously before putting it down. It is a Docker Desktop convenience for local development. Addressing the service by name on its own port is the answer that still works when these containers run somewhere with no laptop in the path.

If this one felt unfamiliar, it is **§4.6 of the networking lecture** - a short aside called "An aside: `host.docker.internal`". It is in the notes, and it is easy to skim past.

**A** has it backwards, and picks the wrong network as the special case. **B** borrows the argument about container IP addresses changing and applies it to a hostname - but the hostname is exactly the part that is stable. **D** objects on performance grounds; the round trip is real, but the reason to reject this is that it does not survive deployment.

---

### Configuration from Outside the Image

**6. D - The deployment worked, but no `ENVIRONMENT` value reached the process**

`default` is the fallback your own code supplies when nothing sets `ENVIRONMENT`. The endpoint answered, so the image was pulled and the container is running. This is a configuration failure sitting inside a successful deployment, and the health response reports the two separately on purpose. The fix is one row on the Environment variables blade. You did this in kata 3, stage 4, step 8.

**A** is the one to watch. The image *should* have been built without a `.env` inside it - that is what `.dockerignore` is for - so if you picked it, you have a correct fact filed as a cause. **B** and **C** both assume that a `200` carrying your application's own JSON could have come from something other than your application.

**7. B - `--env-file` is read once, when the container is created; the container has to be removed and recreated**

Docker reads the file at `docker run` and sets those variables on the container as it is built. There is no route by which a later edit to that file reaches a container that is already running. `docker rm -f` and run it again - which is normal, because the container is the disposable part and the image is the thing you keep.

**A** describes the opposite arrangement, where configuration is fixed at build time; `--env-file` exists precisely to avoid that. **C** is the closest wrong answer, and it is half right: the application did read `process.env` at startup. But the value it read was already stale, and `dotenv` is not involved at all when Docker is supplying the variables. **D** applies build-cache reasoning to something that is not a build.

**8. C - They are reserved App Service settings the platform uses to pull the image, and they are not handed to the application process**

These three are how App Service itself authenticates to the registry when it pulls your image. The names are reserved, and Microsoft's documentation is explicit that for security reasons they are not exposed to your code. So the blade is a shared surface: the platform writes its own configuration through the same channel it offers you, which means an application setting is not automatically your application's setting.

**A** confuses `ENV` in a Dockerfile with settings on the hosting platform; nothing in a Dockerfile writes to this blade. **B** has the pull happening inside the container at runtime, but the pull is how the container comes to exist. **D** is the interesting near-miss: managed identity removes the *need* for these values, but they are not something you clear out by hand to make it work.

---

### Docker Compose

**9. A - `image:` tells Compose which image to run, not to build one; the image has to exist already**

`image:` is a reference, the same way the last argument of `docker run` is. Compose will pull it from a registry if it can, and fail if it cannot find it there or locally. Building is a separate key, `build:`, and the class demo deliberately does not use it - `docker build -t timetable-api .` has to have happened first.

**B** is a real Compose behaviour attached to the wrong symptom: a service held back by a profile is simply not started, and says nothing about a missing image. **C** is the obsolete `version:` key, which produces a warning when it is present and nothing at all when it is absent. **D** imports the registry lesson into a place it does not apply - a bare name is perfectly valid locally, and only becomes a destination when you push it.

**10. D - It logged the failure and carried on listening, so `/health` could still be asked and could answer `database: "disconnected"` - a container you can still question tells you more than one that has vanished**

This is §2.3 of the networking lecture. The obvious thing to write in that `catch` is `process.exit(1)`, and we deliberately did not. A container whose process exits just disappears: `docker ps` shows nothing, and there is nothing left to ask questions of. By staying up, the API keeps answering `/health`, and `/health` can tell you which of the two things is broken. The error is still printed, so `docker logs` still has the detail.

This is a debugging decision for a teaching demo, not a universal rule. Production systems often *do* want to fail fast, so that something else can restart or reschedule them - which is what a `restart:` policy is for, and why the question mentions there isn't one in the file. Worth looking up what you would have had to write.

**A** takes the endpoint's whole purpose away. Reporting `disconnected` is the diagnostic we spent the lesson building; an API that quietly retried until it succeeded would have nothing to report and no way to tell you it was stuck. **B** assumes a restart policy is already in force - nothing in the file sets one, and Compose does not add one for you. **C** treats `depends_on` as required and as a readiness guarantee. It is neither: it orders services *starting*, not services *being ready*, so a database that has started but is still initialising would produce this same failure with `depends_on` in the file.

---

### Image Names, Tags and Digests

**11. B - The name carries no registry and no namespace, so Docker expanded it to Docker Hub's `library` namespace, where they have no write access**

The `repository [...]` line in the output tells you exactly where the push went. One word became `docker.io/library/audioguide-api`: Docker fills in `docker.io` when no host is given, and `library` when no namespace is given - the namespace holding Docker's own official images, `node` and `nginx` and `mysql`. They are authenticated. They are authenticated as somebody with no business writing there. The fix is a name, not a login.

**A** is the reflex, because `denied` reads like an authentication problem - and the question says they are signed in specifically so you have to look past it. **C** confuses the version label with the address; `latest` was supplied automatically and is perfectly pushable. **D** is the Git mental model, where the destination is a remote you configure separately. In Docker there is no destination argument at all - the name is the only instruction the command has.

**12. C - Only `audioguide-api` moved to the new build; the registry-prefixed name is still pointing at the old image ID**

A build produces a new image with a new ID, and the names you pass to `-t` move to it. Every other name stays where it was, still pointing at the old image, which is still sitting on your machine. The rebuild used one `-t`, so the registry-prefixed name is an alias for the previous image - and that is what got pushed, which is why the digest in the portal never changed. Either re-apply every name after a rebuild, or pass them all to `-t` in one build, as you did in kata 3.

**A** is ruled out by the situation: changing source invalidates the cache from that layer down. **B** is genuinely plausible in the abstract, and the unchanged digest is what rules it out - if the registry never received new content, there is nothing for App Service to have cached. **D** misunderstands aliases as things that must move together. They are independent names, which is both the feature and the hazard.

**13. A - The registry notifies the web app, which redeploys with the half-finished build** *(beyond the lessons)*

Switching continuous deployment on registers a hook on the registry, so that a push to the image and tag your app is pinned to tells the app to pull again. The app is pinned to `:latest`, and `latest` is not a version - it means "whatever was pushed here most recently", which is now the half-finished build. The push and the deployment become the same event.

That is the argument for pinning a tag that does not move. `alpha` and `beta` stay where you put them, so only a deliberate change in the Deployment Center moves the app. This is the last reflection in kata 3, and it is what next week is about.

**B** reads the pin as `experiment`, but the app is pinned to `latest` - and `latest` moved too. **C** is the manual process from the kata, which is exactly what the toggle removes. **D** describes a safety net that is not switched on: App Service's Health Check has to be given a path before it holds anything back, and in class it was `Not Configured`. Question 19 picks that up.

---

### Registries and Credentials

**14. D - `az login` authenticates to Azure; it does not put a registry credential into Docker's config. `az acr login --name tourreg` is what does that**

`az login` gets you a token for your Azure subscription and writes it into the Azure CLI's own directory, under `~/.azure/`. Docker knows nothing about it. `az acr login` is the bridge: it exchanges that Azure token for a registry credential and writes it into `~/.docker/config.json`, keyed by the registry hostname - which is the file `docker push` reads.

**A** invents a flag. **B** is ruled out by the command in the question, which already carries the login server - so if you chose it, read the command again. **C** has the two directions crossed: managed identity is how a resource inside Azure *pulls*, and has nothing to do with you pushing from a laptop.

**15. C - The token it produces lasts three hours and belongs to a person; automation running outside Azure should have its own non-human identity - a service principal or token - with its own credential and expiry**

Two things are wrong with the suggestion and both matter. The credential expires in three hours, so a nightly job finds it dead. And it is a person's identity, so every push appears as them, and the pipeline breaks the day they leave. A service principal is the identity built for this: non-human, its own credential, its own expiry, scoped to what it needs.

**A** misses the three hours entirely. **B** gets two things wrong - the admin account is disabled by default, and Microsoft's guidance says it is designed for a single user and should not be shared. **D** is the one worth thinking hardest about, because managed identity *is* the right answer whenever the thing running is inside Azure. This build agent is not. That line in the table - managed identity for anything running inside Azure, service principal for automation outside it - is the easiest one to over-generalise.

---

### Hosting on Azure

**16. B - Azure App Service, because it is optimised for web applications and supplies the public URL, the certificate and the routing without any decision on their part**

The requirement is one container answering HTTP on a URL, with as little configuration as possible. Microsoft describes App Service as fully managed hosting for web applications and APIs, deployable as code or containers, which is a precise description of this situation. Everything the clinic does not want to think about, it does; everything they do care about, it exposes.

**A** is the answer that sounds right, and is the one we deliberately walked into first in class. ACI is a lower-level building block, and Microsoft says plainly that scale, load balancing and certificates are not provided with it - which is the entire requirement here. **C** would work, and is the "not yet" answer: reaching it means configuring ingress, and ingress brings clusters and revisions with it. **D** invents a combination that does not exist - an App Service plan hosts App Service apps, it is not a front end you put in front of something else.

**17. A - It does not change. The plan carries the charge, and the two apps now share the same VMs and scale together**

The plan is the rented compute: the operating system, the region, how many VM instances there are, how big they are, and the tier. The web app is a thing hosted in it. Adding an app to a plan you are already paying for adds no cost line. Creating a second *plan* is what costs money.

§5.2 of the App Service lecture says this almost word for word, sharing included: "several apps can share one plan, and if they do, they share those same VMs and scale together." If you worked it out from first principles instead, you did more work than you needed to and arrived at the same place.

**B** treats the app as the billable thing, which is the natural assumption and the one worth correcting. **C** is the closest wrong answer, because it gets the billing right and the consequence wrong: sharing a plan means sharing the same VMs, so the two apps compete for the same CPU and scale as one unit. **D** describes consumption billing, which belongs to a different kind of service.

**18. D - Everything in a group shares a lifecycle and the group is a natural unit for reading cost - one delete removes a project, and "what is this costing" has an answer**

A resource group is a plain container - a folder - and two properties make it worth using. Shared lifecycle: deleting the group deletes everything in it, which is your cleanup mechanism. And it is the unit you can read cost through, which is the CapEx/OpEx lesson arriving in practice: metered billing only helps if you can see and stop what is running.

**A** and **C** both push a resource group up a level. Quotas belong to the *subscription*, and payment to the billing account above it. **B** is the misconception worth getting rid of now: a resource group is not a network boundary. Resources in different groups reach each other perfectly well. Grouping is organisational, not a security control.

**19. A - A platform that pulls the app out of rotation whenever its database is unreachable - appropriate if the API is useless without one, harmful if most of its endpoints are not** *(beyond the lessons)*

Health Check polls the path you nominate and takes failing instances out of rotation. Your `/health` returns `503` exactly when the database is unreachable. Wire the two together and you have handed the platform a rule: no database, no traffic at all. Whether that is the right rule is a judgement about your application, not a technical question. An API where every endpoint needs the database is better off out of rotation. One where two routes out of twenty touch it has just taken itself entirely offline over a partial failure.

The App Service lesson noted that the health endpoint you built is exactly the interface a platform expects to find. This is what happens when the platform actually uses it - and it is why the shape of a health response is a design decision rather than boilerplate.

**B** invents a restriction; a non-2xx response is the entire point of a health path. **C** has App Service managing a database it knows nothing about - the database is not in App Service, and Compose does not follow you into the cloud. **D** is the closest wrong answer, and confuses Health Check with the **Runtime status** on the same overview blade. That one only decides whether the container started, by making a request and seeing whether anything answers at all - a 404 counts, which is why `GET /robots933456.txt` turns up in container logs. The two sit near each other in the portal and do different jobs.

---

## Where to look if a section went badly

| If you struggled with | Go back to |
|---|---|
| **1, 4, 5** - ports and `localhost` | [Docker Networking and Docker Compose](../01-docker-networking-and-compose/lecture.md) §3.3, §4.5, §4.6 and §5.4 |
| **2, 3** - container ports on App Service | [A First Deployment](../02-first-azure-deployment/lecture.md) §5.3, and [Private Registries](../03-azure-container-registry/lecture.md) §9 |
| **6, 7, 8** - configuration | [Docker Networking and Docker Compose](../01-docker-networking-and-compose/lecture.md) §4.3 and §6.6, then [A First Deployment](../02-first-azure-deployment/lecture.md) §6.2 |
| **9, 10** - Compose | [Docker Networking and Docker Compose](../01-docker-networking-and-compose/lecture.md) §6, and §2.3 for why the demo API stays up when its database is missing |
| **11, 12** - names and tags | [Private Registries](../03-azure-container-registry/lecture.md) §3, §4 and §7 |
| **14, 15** - registry credentials | [Private Registries](../03-azure-container-registry/lecture.md) §2, §6 and §8 |
| **16, 17, 18** - Azure hosting | [A First Deployment](../02-first-azure-deployment/lecture.md) §3, §4 and §5.2 |

Both lectures also end with a table of recurring mistakes - §7.1 in the networking lecture, §11.1 in the registry one. If a question felt like something you had already hit and forgotten, that is where it is written down.

**13 and 19** are not on this list, on purpose. They are the two that go past the lessons. If you want to chase them: 19 is the Health Check feature on the App Service overview blade, and 13 is the Continuous deployment toggle in the Deployment Center - which is also the last reflection in kata 3, and what next week is about.
