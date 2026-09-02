# BED 2 Cloud Services - Kata 4

## Intro

We have manually deployed a container to an App Service a few times so far. This kata is about learning to automate the deployment process using Webhooks on Azures platform. 

**Bring your own API.** Any Node API you have built — an API from a previous kata, something from class, or something of your own. It needs one thing only: at least one `GET` endpoint returning a response you can read in a browser. Its recommended to use something you wrote rather than the greeting API from class.

You can work from the following references:

- Kudu service overview: https://learn.microsoft.com/en-us/azure/app-service/resources-kudu
- Azure Container Registry webhook schema reference: https://learn.microsoft.com/en-us/azure/container-registry/container-registry-webhook-reference
- What is a webhook (Red Hat): https://www.redhat.com/en/topics/automation/what-is-a-webhook
- `docker build`, and the `-t` flag: https://docs.docker.com/reference/cli/docker/buildx/build/
- `docker image push`: https://docs.docker.com/reference/cli/docker/image/push/
- `az acr login`: https://learn.microsoft.com/en-us/cli/azure/acr#az-acr-login
- Configure a custom container for App Service: https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container

This kata is split into 3 stages: the first is a fully manual deployment, the second is setting up the trigger, the third is automating a the deployment after a locally changed image is pushed to the container registry.

## Stage 1: Deployed by hand

**Goal:** your own image in your registry, running on an App Service, answering on its public URL.

### Steps

1. Pick your API and get it running locally with `npm start` and confirm the endpoint is functional.
2. Add a **version marker** to the line your server prints on startup. Whatever it says now, make it say something you can change:
   ```javascript
   console.log(`Server running on port ${PORT} - build 1`)
   ```
   You will change `build 1` to `build 2` in stage 3 and go looking for it in Azure's logs. Nothing else in this kata tells you *which* version of your code is running, so having something simple in the server logs helps.
3. Check the `Dockerfile` you are going to use. It needs `EXPOSE` on the port your app listens on. If it does not have one, you will be setting `WEBSITES_PORT` on the App Service instead - decide now which of the two you are doing.
4. Sign in to Azure and to your registry:
   ```bash
   az login
   az acr login --name <your-registry>
   ```
   Reuse an existing registry or make a new one in `BED2-2026`.
5. Build with the full registry name, tagged **`:latest` only**:
   ```bash
   docker build -t <login-server>/<namespace>/<repo>:latest .
   ```
6. `docker push` it. Then in the portal: your registry → **Services → Repositories** → your repository → `latest`, with a digest beside it.
7. Create a Web App in you resource group. On the **Container** tab: **Image Source: Azure Container Registry**, your registry from the dropdown, **Authentication: Managed identity**, **Image** `<namespace>/<repo>` and **Tag** `latest`, both typed by hand.
8. Wait for it to start up. Then go to your endpoint on the **Default domain** from the Overview blade.
9. If it never answers, go to **Monitoring → Log stream** before you change anything, and work out whether the failure is the pull or the container. The port is the other usual suspect - see step 3.

**Verification:** your endpoint answers on the public Azure URL.

## Stage 2: Wire up the trigger

**Goal:** a webhook that exists on both sides - a populated Webhook URL on the App Service, and a matching webhook in the registry that you did not create.

### Steps

1. On the App Service, go to and turn on **SCM Basic Auth Publishing Credentials**. Save.
2. Go to **Deployment → Deployment Center**, tick **Continuous deployment**, and save. The **Webhook URL** field should fill in with a long masked value. If it instead says SCM basic authentication is disabled, step 1 did not save - go back and check.
3. Look at the structure of that URL. It is `https://<user>:<password>@<something>/api/registry/webhook`
4. Now go to your **registry → Services → Webhooks**. There is one there that you did not create. Open it and read two fields on the Essentials panel:
   - **Actions** - what kind of registry event fires it.
   - **Scope** - which repository and which tag.

   The scope has to match what you pushed in stage 1, character for character.
5. Open the SCM service itself: App Service → **Development Tools → Advanced Tools → Go**. Compare the URL in the address bar against your app's public URL and note the one difference.
6. In Kudu, go to **Environment → Settings & Variables**. Find `DOCKER_ENABLE_CI` and `WEBSITE_DEFAULT_HOSTNAME`. These were injected by the App Service and are used to enable the CD process.
7. Still in Kudu, open **Logs & Diagnostics** and read both **Application** and **Platform** logs now, while everything is working.

**Verification:** the Webhook URL field on the App Service is populated, and the registry has a webhook whose scope names your repository and the `latest` tag.

### Reflection

- Two things now exist that did not before: a webhook on the registry, and a set of credentials on the App Service. You created one of them with a checkbox and Azure created the other for you. Which is which, and which of the two holds the URL?
- `DOCKER_ENABLE_CI` appeared in your app settings without you typing it. What put it there?

## Stage 3: Fire it

**Goal:** a change you make on your machine reaches the public URL with no portal clicks in between.

### Steps

1. Make sure you have two tabs open before you start: the webhook blade on your registry (the event log is at the bottom), and Kudu's **Log Stream** with **Platform** selected. Watch this happen rather than finding out afterwards.
2. Change something visible in the response of your endpoint, and change the startup log from `build 1` to `build 2`.
3. Rebuild and push under the **same** name as stage 1. Two commands, no portal:
   ```bash
   docker build -t <login-server>/<namespace>/<repo>:latest .
   docker push <login-server>/<namespace>/<repo>:latest
   ```
4. Refresh the webhook event log. A new row: an action, your image, an HTTP status and a timestamp. You are looking for **202**.
5. Watch the platform log. You should see the container being stopped and a new one created and started. This takes a few minutes; the `202` arrives long before anything visible happens.
6. Switch the log stream to **Application** and find your `build 2` line.
7. Hit your endpoint on the public Azure URL and read the change.

**Verification:** `202` on the webhook event log, `build 2` in the application logs, and your new response on the public URL.

### Reflection

- **Break it.** Turn SCM Basic Auth Publishing Credentials back **off**. Make another small change, rebuild, push, and read the webhook event log. What status comes back, and does the deployed app change? Now get it working again - and find out whether turning basic auth back on is enough on its own, or whether the webhook has to be rebuilt. Write down the sequence that actually worked.
- The `202` came back in under a second. The new version took minutes. What did the `202` confirm, and what did it not confirm?
- Your webhook's **Scope** names one repository and one tag. If you pushed the same image again as `:v2`, would it fire? Answer first, then push a `:v2` and check whether you were right.
- Back in kata 3 you deployed `:alpha`, a fixed tag: the running app never changes unless you deploy something new on purpose. Here you chose `:latest`, which moves — every redeploy pulls whatever the newest build is. What does that cost you in stability?
- The webhook URL has a username and password inside it. If you pasted that URL into a group chat, what could someone do with it, and what would you have to do to make it useless to them?
