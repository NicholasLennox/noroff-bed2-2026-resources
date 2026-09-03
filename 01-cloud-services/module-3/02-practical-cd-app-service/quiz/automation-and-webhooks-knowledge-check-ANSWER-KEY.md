# Automation and Webhooks - Knowledge Check - Answer Key

Read this against your own answers. Each entry gives the correct option, why it is correct, and what a particular wrong choice usually means.

Question **13** is marked *(beyond the lessons)*. Getting it wrong tells you nothing except that you have not met it yet; read the answer as the guidance it is meant to be.

### The Gap Automation Closes

**1. C - The push moved the tag in the registry, and nothing told the App Service to pull again**

By default, a registry does not announce its pushes and a running container does not go looking for new versions.

If you chose **D**, you are close and it is worth being clear: the digest *did* change. The gap is not that App Service failed to notice, it is that App Service never looks. If you chose **B**, you have the managed identity doing more than it does - it governs *whether* a pull is allowed, never *when* one happens.

**2. B - Saving the change restarted the app, and the restart pulled the current `:latest`**

Saving on the Deployment Center or Environment variables blade restarts the app, and a restart pulls the tag. So the new version appearing after a save proves a restart happened, and nothing more.

If you chose **C**, this is the misconception the section was built around, and it can cost people an enire afternoon to fix. To prove the trigger, you need to push an image without touching the portal. If you chose **D**, you have webhooks and polling the wrong way round - see question 3.

### Webhooks

**3. D - The courier sends a request to a URL the shop provides, at the moment a parcel is scanned, and the shop stops polling**

The direction of the first move flips. The party that will have the data is given a URL in advance and calls it when the event happens.

If you chose **A**, you have chosen a valid strategy - a streamed, held-open connection - but not the one we are looking for. A webhook is one ordinary HTTP request per event, with nothing held open in between. **B** and **C** both keep the shop asking, which is the thing being replaced.


### The SCM Sidecar

**4. A - The SCM (Kudu) service that runs alongside the container and holds the platform controls**

Your container serves requests; the sidecar next to it runs the platform. Your app could not restart itself even if it wanted to, which is why the endpoint has to live somewhere else.

If you chose **B**, you are imagining Azure injecting a route into your app. Nothing is added to your code - the endpoint is on a different service at a different hostname. **D** has the direction backwards: the registry sends the request, it does not perform the restart.

§4, *The SCM sidecar: who is listening*.

**5. B - `https://listings-c3d9.scm.westeurope-01.azurewebsites.net/`**

`.scm.` goes in immediately after the app name, leaving the region and the rest of the hostname untouched.

**C** is the understandable one: the service is called Kudu everywhere in the documentation and in this lesson, but the subdomain is `scm`. **A** and **D** put the label in a position that would name something else entirely - Azure's subdomains are structure, and the order carries meaning.

§4, *The SCM sidecar: who is listening*.

### Setting It Up, and the Order

**6. D - Delete the webhook, then untick and re-tick Continuous deployment so a new URL is generated with the credentials in it**

The URL was generated once, with empty credential slots, and handed to the registry. Nothing goes back and rewrites it.

If you chose **B**, this is the important gap and it is the one the kata asks you to prove for yourself. A generated credential is a snapshot, not a live link: turning basic auth on creates credentials, but the registry is still holding the URL that has none in it. **A** treats the SCM credentials as app configuration; they are platform credentials and your app never sees them.

§7, *When the credentials were never there*, and the break-it question in stage 3 of the kata.

**7. A - The request reached the SCM service and was refused because it carried no usable credentials**

A `401` is a specific and quite friendly failure. It rules out the URL, the endpoint, the scope and the registry in one line, because none of those could have been wrong for the request to arrive and be understood.

If you chose **B**, look at what a scope mismatch actually produces - see question 8. If you chose **D**, you have the two directions crossed: the webhook is something arriving *at* your app, not your app reaching *out* to the registry.

§7, *When the credentials were never there*.

**8. C - Nothing at all - no webhook event, and no error anywhere to find**

The webhook is scoped to one repository and one tag. A push to `:v3` does not match it, so it never fires, and something that never fires produces no row and no status code.

If you chose **A**, you have assumed the webhook fires on any push to the repository and the scope only affects what happens afterwards. It is the other way round: the scope decides whether anything happens at all. That is worth holding on to, because silence is the hardest failure to debug - there is nothing to read.

§5.3, *The other end*.

### Reading the Evidence

**9. B - The SCM accepted the request and began work - it says nothing about the pull or the restart finishing**

`202 Accepted` is the correct code precisely because the work is not done: Kudu is not going to hold the connection open while it pulls an image and swaps a container.

If you chose **C**, you are treating the `202` as a completion. It is a receipt. Confirming a deployment means watching the platform log for the new container, or checking something in the app that changes per build - which is why the kata has you put a version marker in the startup line.

§5.4, *Push, and watch it fire*.

**10. D - The old container being stopped - `npm` was the main process, and it reports a command ended by a signal as a failure**

Two things in the log say so. The `[Previous Container]` prefix, which Azure puts on lines from the container being replaced, and the order: the new version was already answering before these appeared.

If you chose **A**, the timing is what rules it out - a container that failed to start would not have logged a working server first. Nothing is broken here. It is a normal shutdown being reported in the vocabulary of a failed command.

§6.3, *One error you can ignore*.

**11. C - The Platform log, because the application log is your container's stdout**

An empty application log is itself the finding. If your process had run at all, its own output would be there, so the failure happened before your code was reached.

If you chose **A**, you have read the two log types as one stream split by severity. They are different sources: yours and the platform's. **D** points at a real cause of container failures, but you would still diagnose it from the platform log - which is where to go first.

§6.2, *Two kinds of log*, and the table in §8.

### Credentials

**12. A - Anyone holding that URL can make the SCM redeploy that app, because the credentials are part of the URL.**

The URL and the credential are the same object. That is what the `<user>:<password>@` at the front of it means, and it is why the portal shows the field as dots.

If you chose **C**, you have the two credentials crossed - this one gets a caller *into* the SCM, not into the registry. If you chose **D**, you assumed an IP restriction that is not part of the mechanism: the endpoint authenticates the caller by the credentials it presents, and it does not care where the request came from.

§5.2, *Tick continuous deployment*, and the last reflection question in the kata.

### Beyond the Lessons

**13. B - Tag each build with both `:latest` and a fixed version. Point staging at `:latest` with continuous deployment on, and production at the fixed version with it off**

This falls out of two things you have seen. The webhook is scoped to one repository and one tag, so the tag an app is pinned to decides whether a push concerns it. And a fixed tag never moves, so production changes only when someone changes the tag on the app.

**C**. The webhook is off for production, so no push redeploys it. But production is still pinned to `:latest`, and `:latest` moves - so the next time that app restarts for any reason, a config save, a platform update, it pulls whatever the newest build happens to be. You could have an app that changes when nobody deployed anything.

**A** works, but only while somebody remembers to do it every release, and re-ticking the checkbox recreates the webhook. **D** confuses permission with version: an identity governs whether an app may pull at all, not which tag it gets.
