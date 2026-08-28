# BED 2 Cloud Services - Kata 3

## Intro

A client has come to you with something small. They run a weekly trivia night, and they want an API that hands out a random fact - one endpoint, no database, no users. They will call it from a display screen in the venue. It has to be reachable on the internet, and they would like to see something working before they commit to anything bigger.

You are starting **greenfield** *[a project begun from nothing: an empty folder, no existing code, no earlier decisions to work around. The opposite is brownfield, where you are adding to something that already exists and has to keep working]*.

You can work from the following references:

- Express: https://expressjs.com/en/5x/api/
- dotenv: https://www.npmjs.com/package/dotenv
- `docker build`, and the `-t` flag: https://docs.docker.com/reference/cli/docker/buildx/build/
- `docker image tag`: https://docs.docker.com/reference/cli/docker/image/tag/
- `docker image push`: https://docs.docker.com/reference/cli/docker/image/push/
- Push and pull with Azure Container Registry: https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli
- `az acr login`: https://learn.microsoft.com/en-us/cli/azure/acr#az-acr-login
- Configure a custom container for App Service: https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container

This kata has four stages. Stages 1 to 3 get version `alpha` of the API into production. Stage 4 is the client coming back with a change, and it runs the same road again to create a beta version.

## Stage 1: The API, and an image of it

**Goal:** `GET /fact` answers on `http://localhost:3000`, first from `npm start` and then from a container.

### Target structure

```
facts-api/
├── src/
│   ├── app.js          # Express app, exports app, no .listen()
│   └── server.js       # requires app, calls app.listen()
├── .dockerignore
├── Dockerfile
├── package.json
└── package-lock.json
```

### Steps

1. Make the folder, `npm init -y`, `npm i express`, and `git init` if you want your own history of it.
2. Build the app across `src/app.js` and `src/server.js`, split the way kata 1 and kata 2 split them. Hardcode `const PORT = 3000` in `server.js`.
3. Hold the facts in an in-memory array. **At least ten of them.** Make them up, or ask AI for a list; the content does not matter, having enough of them to see the randomness does.
4. Add an **async** `/fact` route that picks one at random and responds `200` with:
   ```javascript
   {
     fact: 'A group of flamingos is called a flamboyance.'
   }
   ```
5. Point the `start` script in `package.json` at `src/server.js`. Run `npm start`, and in a second terminal `curl -v http://localhost:3000/fact` four or five times. If you get the same fact every time, your route is picking once rather than per request - find out where.
6. Write the `Dockerfile` as we have done before with `node:22-alpine`, a working directory, the package files copied on their own line, `npm ci`, then the rest of the project, `EXPOSE 3000`, and the start script as `CMD`. Put a comment on each instruction saying **why** it is there, not what it does.
7. Write `.dockerignore`. `node_modules` belongs in it. So does `.git`. Be able to say why for each - the two reasons are not the same.
8. `docker build -t facts-api .`, then `docker images` to confirm it exists.
9. Run it and check it from outside:
   ```bash
   docker run -d -p 3000:3000 --name facts facts-api
   curl -v http://localhost:3000/fact
   ```
   If nothing answers, `docker ps -a` and `docker logs facts` before you change anything.
10. Remove the container when you are satisfied: `docker rm -f facts`.

## Stage 2: Publish version alpha to your own registry

**Goal:** a repository in your Azure Container Registry holding two tags of the same image, visible in the portal.

A registry is not one per project. You create **one** and everything you build goes into it, kept apart by name. Look at the `Push a Container Image` panel on your registry's Overview and you will see Microsoft's own example uses `samples/nginx`; on Docker Hub my images sit under `nicholaslennox/`. That leading segment is a **namespace** - a folder inside the registry, and nothing more clever than that.

Looking at it in a way we already know: the registry is the platform - GitHub, or Docker Hub. A repository inside it is a repo. The tags inside the repository are its versions. One account, many repos, many versions each.

### Steps

1. Create a registry, or reuse yesterday's. Put it in the `BED2-2026` resource group, Basic tier. If the create form fails validation with something about a policy, that is the Azure for Students region restriction from yesterday - change the region and try again.
2. On the registry's Overview, find the **Login server**: `<your-registry>.azurecr.io`. That hostname is the only thing that decides where a `docker push` goes.
3. Sign in, both halves:
   ```bash
   az login
   az acr login --name <your-registry>
   ```
4. Decide the full name of your image. It has four parts:
   ```
   <login-server>/<namespace>/<repository>:<tag>
   ```
   Use your own namespace (optional) - `katas`, your name, whatever you will still recognise in six weeks - and `facts` as the repository.
5. Two tags, and they are not arbitrary. **`alpha`** is the convention for a first cut: the version that goes to a small number of people who know it is unfinished. **`latest`** is not a version at all - it means "whatever was pushed here most recently", and right now that happens to be the alpha build. So this image gets both names, and only one of them will still be true of it by the end of the kata.
6. Build once, with both names. `-t` can be given more than once, and each one takes a full reference:
   ```bash
   docker build -t <login-server>/<namespace>/facts:alpha -t <login-server>/<namespace>/facts:latest .
   ```
   That is one command; mind the trailing `.`. If you want it across several lines, the continuation character is `\` in bash.
7. `docker images`. You now have `facts-api` from stage 1 and two registry-prefixed names, and you should be able to say something about the `IMAGE ID` column before you scroll across to it.
8. Push both tags. You can do this with multiple `docker push` commands, or you can learn to do them at the same time. There is a flag that does a whole repository in one go (`--all-tags`) - look it up, then push them explicitly this time so you can read what each push prints.
9. In the portal: your registry → **Services → Repositories** → your repository → the two tags, each with a **digest** beside it.

### Reflection

- Both tags show the same digest in the portal. What is a digest, and what does it mean for those two entries that they share one?
- You did not run `docker tag` once in this stage. Write out the commands you *would* have run to reach the same result with `docker build` plus `docker tag`. Which version is more likely to go wrong the next time you rebuild, and what exactly goes wrong?
- Break it: `docker tag <login-server>/<namespace>/facts:alpha facts:alpha`, then `docker push facts:alpha`. Read the `The push refers to repository [...]` line, then the error under it. Where did Docker try to send it, why there, and what in the name would have prevented it?
- Break it again: `docker logout <login-server>`, then push one of your real tags. What comes back, which single command puts you back in a position to push - and how long will that fix last?

## Stage 3: Deploy alpha to App Service

**Goal:** `https://<your-app>.azurewebsites.net/fact` returning facts, pulled from your private registry.

### Steps

1. Create a Web App in the `BED2-2026` resource group with **Publish: Container**. 
2. On the **Container** tab:
   - **Image Source: Azure Container Registry**, and pick your registry from the dropdown.
   - **Authentication: Managed identity**, using yesterday's user-assigned identity or a new one the wizard creates for you.
   - **Image**: `<namespace>/facts`, typed by hand - these fields do not auto-populate when managed identity is selected.
   - **Tag**: `alpha`. Not `latest`.
3. **Networking**: public access on. **Monitor + secure**: Application Insights off.
4. Create it, and then wait. Azure has to allocate the plan, pull your image and start the container; a couple of minutes of error pages means nothing.
5. Open the **Default domain** from the Overview blade and hit `/fact`. Then `curl -v https://<your-app>.azurewebsites.net/fact` (or open it in a browser) a few times, so you can see it is still random up there.
6. If it never answers: read **Monitoring → Log stream** and work out whether the pull succeeded. To troubleshoot this, you can look at yesturdays lecture notes, or make sure you have EXPOSE 3000 in your dockerfile (if not, WEBSITES_PORT=3000 in the App Services environment settings).

### Reflection

- You deployed `:alpha` while `:latest` pointed at the identical image. Given they are the same bytes today, what does pinning the tag that does not move buy you tomorrow?
- Break it: in **Deployment → Deployment Center**, change the tag to `gamma` - which does not exist - and save. Wait, then hit the app and read the log stream. Where does that failure surface, what does it actually say, and does the old container keep serving in the meantime? Set the tag back to `alpha` afterwards.
- There is no registry password anywhere in this web app, and your registry is private. What proved to the registry that this app was allowed to pull? If that pull *had* failed with an authorization error, what would you check first - and does the thing you would check live on the app or on the registry?
- Your container listens on 3000 and the public URL is HTTPS on 443. You wrote no port mapping anywhere in Azure. Where did App Service get 3000 from, and how does that connect to what you saw when you deleted `EXPOSE` in stage 1?

## Stage 4: The client comes back

The client has been showing it around. Two things came out of that. They cannot tell whether the API is up without calling `/fact` and reading a fact, and they now want a test a new feature.

**Goal:** a `beta` version of the API deployed and reporting `environment: "production"` from Azure, with `alpha` still sitting in the registry untouched.

### Steps

1. `npm i dotenv`. Create a `.env` holding `ENVIRONMENT=development`. Add `.env` to both `.gitignore` and `.dockerignore`.
2. Add an async `/health` route responding `200` with:
   ```javascript
   {
     status: 'ok',
     uptime: process.uptime(),
     timestamp: new Date().toISOString(),
     environment: ENVIRONMENT
   }
   ```
   `ENVIRONMENT` is read from `process.env`, and falls back to `'default'` when nothing supplies it.
3. `npm start`, then `curl -v http://localhost:3000/health`. You are looking for `development`.
4. Rebuild the image, and this time the version names are **`beta`** and **`latest`** - the same two-`-t` command as stage 2 with `alpha` swapped out. `alpha` still exists, on your machine and in the registry, still pointing at the old image. `latest` is about to move.
5. Prove the configuration comes from outside the image, locally, before Azure is involved:
   ```bash
   docker run -d -p 3000:3000 --name facts <login-server>/<namespace>/facts:beta
   curl -v http://localhost:3000/health
   ```
   Read the `environment` field. Then `docker rm -f facts`, run the same image again with `-e ENVIRONMENT=docker` added, and read it again. (A short `docker-compose.yml` with an `environment:` block does the same job if you would rather.)
6. Push `beta` and `latest`. In the portal your repository now lists three tags: check which two share a digest and which one is on its own.
7. **Deployment → Deployment Center** on your web app. Change the **Tag** from `alpha` to `beta`, and **Save**. There is a lot on this blade you have not met - a continuous deployment toggle, a webhook URL, authentication settings. Change nothing else. Saving restarts the app and pulls the new image, so wait again.
8. Hit `/health` on the Azure URL. The endpoint is there at all, which tells you the beta image is deployed - and it reports `environment: "default"`, which tells you something else.
9. **Settings → Environment variables → New application setting**: `ENVIRONMENT` = `production`. **Apply**, and confirm the restart when Azure asks for it.
10. Wait, then check both endpoints on the Azure URL. `/health` should now say `production`, and `/fact` should still be handing out facts.

### Reflection

- Your repository holds `alpha`, `beta` and `latest`. Draw the three tags and the two images they point at. Which of those names changed what it pointed at during this kata, and which two never moved?
- At step 8 the deployed API answered `environment: "default"` even though the deployment had worked. What would you have wrongly believed if the fallback had been `'production'` instead? Describe the situation where that wrong belief costs you an afternoon.
- The value of `ENVIRONMENT` reached the running process three different ways in this kata. List all three. The image was identical in the last two of them - what does that tell you about what an image is for?
- Count every manual action you took between reading the client's request and the change being live: terminal commands, portal clicks, waits. Split them into decisions you had to make and typing that simply had to happen. Which list is longer?
- The Deployment Center has a **Continuous deployment** toggle and a webhook URL next to it. Find out what that URL is for: what sends a request to it, and when? If it had been switched on during step 7, which of the actions you just counted would have disappeared?
- Suppose continuous deployment had been on **and** your app had been pinned to `:latest` rather than `:beta`. What would have happened at the moment you ran `docker push` in step 6 - and would you have wanted it to?
- Automatic deployment still begins with a new image existing in the registry. Which of your steps had to happen before that was true? What would a machine need access to in order to do those steps for you while you were asleep? That question is next week.
