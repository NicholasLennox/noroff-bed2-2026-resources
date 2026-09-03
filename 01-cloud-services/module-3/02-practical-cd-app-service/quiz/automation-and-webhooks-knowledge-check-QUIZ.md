# Automation and Webhooks - Knowledge Check

This quiz is based on the Intro to Automation lesson and kata with the questions being grouped into topics.

Question **13** is marked *(beyond the lessons)*. It goes past what we covered directly and is meant to be reasoned out from what you do know. Everything else is in the lecture notes or the kata.

## The Gap Automation Closes

**1.** A bakery's order API runs on App Service, pulling `orders-api:latest` from a private registry. You build a new image, tag it `orders-api:latest`, and push it. Ten minutes later the public URL still returns the old response, and there are no errors anywhere. Why?

- **A.** The registry needs time to replicate the new tag before App Service can see it.
- **B.** The managed identity's `AcrPull` role permits a pull only when the container is first created.
- **C.** The push moved the tag in the registry, and nothing told the App Service to pull again.
- **D.** App Service caches the image and refreshes it when the tag's digest changes.

**2.** A student enables **Continuous deployment** on their gym booking app, saves, waits two minutes, and finds the new version of their API is live. They conclude the trigger is working. What have they actually proved?

- **A.** That the registry delivered the image to the App Service when the setting was saved.
- **B.** Saving the change restarted the app, and the restart pulled the current `:latest`.
- **C.** That the webhook fired, since a new version appeared without a manual restart.
- **D.** That App Service polls the registry every few minutes and had just done so.

---

## Webhooks

**3.** A shop's system calls a courier's API every thirty seconds asking whether a parcel has been scanned yet. Most of those calls come back with nothing. The courier offers to switch them to a webhook instead. What changes?

- **A.** The shop keeps one connection open and the courier streams scan events down it.
- **B.** The shop keeps asking, but each response is smaller because only changes are returned.
- **C.** The courier's API responds faster, because it caches the scan status between calls.
- **D.** The courier sends a request to a URL the shop provides, at the moment a parcel is scanned, and the shop stops polling.

---

## The SCM Sidecar

**4.** A museum audio guide API is deployed as a container. Its code contains nothing about deployments, registries or restarts, yet a `POST` request from the registry causes the running container to be replaced. What receives that request?

- **A.** The SCM (Kudu) service that runs alongside the container and holds the platform controls.
- **B.** The container running your API, on a route that Azure adds to your app at runtime.
- **C.** The managed identity, which holds the endpoint and forwards platform commands.
- **D.** The Azure Container Registry, which restarts the app through the management API.

**5.** A cinema listings app is reachable at `https://listings-c3d9.westeurope-01.azurewebsites.net/`. What is the address of its SCM service?

- **A.** `https://scm.listings-c3d9.westeurope-01.azurewebsites.net/`
- **B.** `https://listings-c3d9.scm.westeurope-01.azurewebsites.net/`
- **C.** `https://listings-c3d9.kudu.westeurope-01.azurewebsites.net/`
- **D.** `https://listings-c3d9.westeurope-01.scm.azurewebsites.net/`

---

## Setting It Up, and the Order

**6.** You set up continuous deployment for an allotment sensor API by ticking **Continuous deployment** first, and only afterwards noticing that SCM basic auth was disabled. You enable it. The next push still fails at the webhook. What does it take to fix this?

- **A.** Add the SCM username and password to the App Service's environment variables.
- **B.** Nothing further - the SCM will accept the request on the next push now that basic auth is on.
- **C.** Grant the registry's webhook the `AcrPull` role on the App Service.
- **D.** Delete the webhook, then untick and re-tick Continuous deployment so a new URL is generated with the credentials in it.

**7.** A parking meter API's webhook event log on the registry shows a `401` against the most recent push. What does that tell you?

- **A.** The request reached the SCM service and was refused because it carried no usable credentials.
- **B.** The image was pushed under a tag the webhook is not scoped to.
- **C.** The registry could not reach the App Service at all.
- **D.** The App Service pulled the image but was not allowed to read it from the registry.

**8.** A library catalogue app is deployed from `catalogue:latest`, with a webhook scoped to `catalogue:latest` and the action `push`. A colleague builds and pushes `catalogue:v3` to the same repository. What happens?

- **A.** The webhook fires and returns `202`, but the App Service pulls `:latest`, so nothing visibly changes.
- **B.** The webhook fires and returns an error, because `:v3` is not the tag the app is running.
- **C.** Nothing at all - no webhook event, and no error anywhere to find.
- **D.** The webhook fires and the App Service replaces its container with `:v3`.

---

## Reading the Evidence

**9.** You push a new image for a bike-share API. The webhook event log shows `202` within a second. Twenty seconds later the public URL is still serving the old version. What did the `202` confirm?

- **A.** The image was pulled successfully, but the container has not been started yet.
- **B.** The SCM accepted the request and began work - it says nothing about the pull or the restart finishing.
- **C.** The new container is already running, and the delay is DNS propagation.
- **D.** The registry accepted your push; the webhook itself has not been delivered yet.

**10.** A recipe API redeploys successfully after a push. In the **Application** log, a few seconds after the new version starts answering, these appear in red:

```
[Previous Container] npm error signal SIGTERM
[Previous Container] npm error command sh -c node app.js
```

What are you looking at?

- **A.** The new container failing to start, because `npm start` cannot run in App Service.
- **B.** A crash inside your app's shutdown handler.
- **C.** The platform stopping the new container after a failed warm-up probe.
- **D.** The old container being stopped - `npm` was the main process, and it reports a command ended by a signal as a failure.

**11.** An event ticketing app never responds after a deployment. You open the **Application** log in Kudu and it is empty - not errors, nothing at all. Where do you look next, and why?

- **A.** The Application log with the `ERROR` filter on, since errors are hidden from the default view.
- **B.** The registry's webhook event log, since an app that never answers means the webhook failed.
- **C.** The Platform log, because the application log is your container's stdout.
- **D.** The Environment blade, since a missing app setting stops a container without logging anything.

---

## Credentials

**12.** A student pastes their app's Webhook URL into the class group chat while asking for help. What is the exposure?

- **A.** Anyone holding that URL can make the SCM redeploy that app, because the credentials are part of the URL.
- **B.** Nothing - the portal masks the field, so the value they copied is redacted.
- **C.** Anyone holding it can pull images from the registry, because the URL carries the registry credentials.
- **D.** Nothing meaningful - the endpoint only accepts requests originating from the registry.

---

## Beyond the Lessons

**13.** *(beyond the lessons)* Your team runs a staging app and a production app, both pulling from one registry. Staging should take every new build automatically. Production should change only when a person decides it changes. Which arrangement gives you that?

- **A.** Enable continuous deployment on both, and delete the production webhook from the registry after each release.
- **B.** Tag each build with both `:latest` and a fixed version. Point staging at `:latest` with continuous deployment on, and production at the fixed version with it off.
- **C.** Point both apps at `:latest`, and enable continuous deployment on staging only.
- **D.** Give the two apps different managed identities, so only staging is permitted to pull new images.
