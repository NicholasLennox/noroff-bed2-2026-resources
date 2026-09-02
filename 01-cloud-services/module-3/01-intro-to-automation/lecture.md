# Automating a Deployment: Webhooks and the SCM Sidecar

> Everything we have deployed so far has needed a human at the end of it. We push an image, and then we go and tell Azure to use it. This lesson removes that last step, and the removal is one checkbox — which makes it a poor lesson about clicking and a good one about what has to be true underneath before the checkbox does anything. The central failure is a webhook that fires perfectly and gets a `401` back, because the credentials it needed were never created. Where a word might be new, a plain-English version follows it in *[brackets]*.

## 1. Where we left off

Over the last two lessons we assembled a deployment by hand. [Pushing to Azure Container Registry](../../module-2/03-azure-container-registry/lecture.md) established the naming and credential mechanics, and the [versioned deployments kata](../../module-2/04-practical-acr-app-service/kata/) had you run the whole thing yourself.

The workflow, in the state we ended the week in:

![Recap of the Docker to ACR to App Service path](./boards/01-lesson-overview.jpeg)

In black, what we already had. Make a change locally, `docker build`, `docker tag`, and — with a credential already in `~/.docker/config.json` from `az acr login` — `docker push` to the registry. On the Azure side, an App Service configured to pull `greeting-api:latest` from `beddemo`:

![The App Service container settings, pointing at the ACR](./images/01-app-service-config.png)

The authentication row is the piece worth re-reading, because it is the one that is already automated. **Managed Identity**, with `ua-id-ad15` selected — and that identity holds the `AcrPull` role on `beddemo`:

![The managed identity's role assignment on the registry](./images/01-2-managed-identity.png)

No password anywhere. Azure is on both ends of that pull, so it can hold the credential itself. Keep that shape in mind, because everything new in this lesson is a credential that Azure does *not* handle for you.

In green on the board is the part we had not built: the arrow from ACR back to the App Service.

## 2. The gap: a new image that nobody mentions

We started by running the old workflow. Change a line in `app.js`, build, tag, push to `beddemo.azurecr.io/greeting-api:latest`. The registry now holds a new image under the `latest` tag.

Then we hit `/greeting` on the running app and got the old response.

Nothing is broken. The App Service is running the container it pulled the last time it was told to pull, and it has no reason to believe anything has changed. A registry does not announce its pushes, and a running container does not go looking. The two halves of the workflow were never connected — we were the connection, and this time we did not do our half.

### 2.1 The restart button, and the misconception it breeds

The fix by hand is on the Overview blade: **Restart**. The App Service stops the container, pulls `greeting-api:latest` again, gets the new digest this time, and starts it. Hit `/greeting` a minute or two later and the new response is there.

That is worth doing deliberately once, because it is the thing that gets mistaken for automation later. Saving a change on the Configuration or Environment variables blade also restarts the app — which means that if you tick a box, save it, and see your new version appear, **you have not necessarily proved the box works**. You proved that saving restarted the container, and the restart pulled the image. The two are indistinguishable from the outside unless you go and check whether the mechanism actually fired.

> Restarting the App Service is a deployment. Automating the deployment means automating the restart.

## 3. Webhooks

So we need the registry to *tell* somebody. That is what the second option in the Deployment Center is for, and it is worth naming the pattern before wiring it up, because it turns up everywhere: payment providers telling your shop that a payment cleared, GitHub telling a build server that a branch moved, a chat platform telling your bot that someone typed.

The version of this you already know is a client asking a server for something. The client wants data, sends a request, gets a response. If the data is not ready yet, the client waits and asks again — **polling** *[repeatedly asking "is it there yet?" on a timer]*. Polling is wasteful in both directions: most requests come back with nothing, and however short you make the interval, you are still that far behind the event.

A **webhook** inverts it. The party that will eventually have the data is given, in advance, a URL to call. When the event happens, *it* makes an HTTP `POST` to that URL carrying the details as a JSON payload. Red Hat's write-up (linked in the sources) calls them "reverse APIs" for this reason: the roles are the same, the direction of the first move is flipped. Nobody asks. The event arrives.

Which reframes what we need. There is an event — an image pushed to `greeting-api:latest` — and there is something that needs to know about it. The registry can be given a URL. The question is what URL, and what is on the other end of it.

## 4. The SCM sidecar: who is listening

The answer is not the container running your API, and this is the part that needs building up carefully, because your API cannot restart itself.

When Azure provisions an App Service, it does not only start your container. It creates an environment around it: somewhere to keep files, somewhere the configuration lives, and a separate service that manages the whole thing. That service is called the **SCM** — Source Control Manager — and by its project name, **Kudu**. It runs as a **sidecar** *[a second container deployed alongside the main one, sharing its environment, whose job is to support the main container rather than to serve your users]*.

The clearest evidence that it is a separate thing is in the URLs. Our app is at:

```
https://greeting-aafwcke7hvhzevhg.westeurope-01.azurewebsites.net/
```

and its SCM service is at:

```
https://greeting-aafwcke7hvhzevhg.scm.westeurope-01.azurewebsites.net/
```

Same host, one extra subdomain. Azure uses subdomains as structure — `westeurope-01` says where in Azure this is running, and `.scm.` says which of the two services you are talking to.

Kudu is the one that holds the platform controls. It feeds configuration into your container, it can restart it, and it exposes an HTTP API for doing so. One of the endpoints on that API is `/api/registry/webhook`, which accepts a `POST` and responds by pulling the image again and restarting the container.

So the listener is the SCM service, and the App Service plus its sidecar behave as a single unit: the SCM is the gatekeeper, your container is behind it. Anything that wants to make the platform do something goes through Kudu first, and Kudu wants to be told who is asking.

> Your container serves requests. The sidecar next to it runs the platform. Only one of them can restart the other.

## 5. The green path

We built this the way it is meant to work first, so that the failure in section 7 is recognisable as a failure. There are two settings, and **the order matters** — which is the whole reason this section has an order at all.

### 5.1 SCM basic auth, first

**Settings → Configuration → Platform settings**, and enable **SCM Basic Auth Publishing Credentials**:

![Enabling SCM basic auth publishing credentials](./images/02-scm-basic-auth.png)

This creates a username and password for the SCM service. **Basic auth** *[the simplest HTTP authentication scheme: a username and password sent with the request itself, rather than exchanged for a token first]* is the mechanism Kudu's webhook endpoint uses, and until this is on, no such credentials exist.

You can get here from the Deployment Center too — the **Enable here** link next to the Webhook URL field goes to the same place.

### 5.2 Tick continuous deployment

Back in the Deployment Center, tick **Continuous deployment** *[CD: the practice of getting a change into the running environment automatically once it is built, with no manual deploy step]* and save:

![Continuous deployment ticked, with a webhook URL generated](./images/03-cd-webhook-url.png)

The Webhook URL field fills in. That is the sign it worked, and its shape is:

```
https://<$username>:<password>@<app-name>.scm.azurewebsites.net/api/registry/webhook
```

The credentials are *in the URL*, in front of the host. That form is how basic auth is carried when nobody is around to be prompted for a password — the caller is a registry, not a person. It also means the URL and the credential are the same object: anyone holding that string can restart your app. Treat it exactly as you would a password, which is why the portal shows it as dots.

The username begins with a `$`. The explanation I have seen for this is that it stops the surrounding system from reading the name as a variable to be substituted; that is plausible but is not something I can point you at documentation for, so hold it loosely.

### 5.3 The other end

Ticking that box did a second thing. Over on the registry, **Services → Webhooks**, there is now one we did not create by hand:

![The webhook Azure created on the ACR](./images/04-webhook-acr.png)

Read the two boxed fields, because they are the whole configuration. **Actions: push** — it fires on a push and nothing else. **Scope: `greeting-api:latest`** — that repository, that tag. Push `greeting-api:v2` and this webhook stays quiet.

So the wiring, stated once: the App Service generated a URL to itself with its own credentials embedded, and Azure handed that URL to the registry to call. The registry is now the party that makes the first move.

### 5.4 Push, and watch it fire

Change `app.js`, build, tag, push. Then open the webhook on the ACR side and look at the event log at the bottom:

![The webhook firing with a 202 response](./images/05-webhook-202.png)

A `202 Accepted` — the request got through and the work has been started, but is not finished. That is the right code for this: Kudu is not going to hold the connection open while it pulls an image and restarts a container.

Give it a couple of minutes and `/greeting` returns the new response. We have automated the restart button.

The whole loop, with the credential used at each hop:

```
  laptop                 ACR                    App Service
    |                     |                          |
    |-- docker push ----->|                          |
    |   (acr login token) |                          |
    |                     |-- POST webhook --------->|  SCM endpoint
    |                     |   (basic auth in URL)    |  (basic auth on)
    |                     |                          |
    |                     |<---- docker pull --------|  restart
    |                     |   (admin creds / MI)     |
```

Three hops, three different credentials, and none of them interchangeable. The token from `az acr login` gets your push in and expires in three hours. The basic auth pair in the webhook URL gets the registry's `POST` past the SCM gatekeeper. The managed identity gets the App Service back into the registry to pull. Every failure in the next two sections is one of these three arrows being unable to prove who it is.

That is also a fair first impression of what automation work feels like. The mechanism itself is a `POST`. Almost everything you actually do is setup, permissions, and finding out which of the two ends is unhappy.

## 6. Inside Kudu

Before looking at what goes wrong, it is worth opening the SCM service, because it is where the evidence lives. **Development Tools → Advanced Tools → Go**:

![Getting to Kudu from the App Service](./images/06-accessing-kudu.png)

That drops you on the same `.scm.` host from section 4:

![The Kudu dashboard](./images/07-kudu-dashboard.png)

The header names the app, the platform version and the specific **instance** your app is running on. Below it, the SKU (`LinuxFree`) and OS, and then the two things we came for: **Environment** and **Logs & Diagnostics**.

### 6.1 Environment: what your app actually received

**Environment → Settings & Variables** lists every setting the platform is feeding into your container. This is the fastest way to check that a variable you configured in the portal is genuinely reaching the app, rather than sitting in a form you forgot to save.

Add `TEST` with the value `testvalue` under the App Service's Environment variables blade, save — which restarts the app — and it appears here:

![The TEST setting visible in Kudu's App Settings](./images/07-2-app-settings.png)

Two other rows in that list are worth noticing, because they are what the last section did. `DOCKER_ENABLE_CI = true` is the app setting behind the Continuous deployment checkbox — the box is a nicer way of writing this. And `WEBSITE_DEFAULT_HOSTNAME` holds the same hostname we compared against the `.scm.` one earlier. Most of the settings here are Azure's own, and reading them is a reasonable way to find out what the platform thinks it is doing.

### 6.2 Two kinds of log

**Logs & Diagnostics** splits into **Application** and **Platform**, and the split is the useful part. These are the same logs the App Service's Log Stream blade shows, in a view that is considerably easier to read.

Application logs are your container's stdout — the process you wrote:

![Application logs, showing the API start up](./images/08-application-logs.png)

`> greeting-api@1.0.0 start`, `> node app.js`, and then `Server running on port 3000`, which is the `console.log` in `app.js`. If your code printed it, it is here.

Platform logs are Azure managing the container around your code:

![Platform logs, showing a successful container start](./images/09-platform-logs.png)

`CreatingContainer`, `Container start method finished after 4442 ms`, `InitiatingSiteWarmUpProbe`, `WarmUpProbeSucceeded`, `Site started`. None of this comes from your app, and this is the list to go to when the app never gets far enough to log anything of its own. A deployment that silently does not happen leaves its explanation here.

## 7. When the credentials were never there

Now the failure, which is the one you are most likely to hit, and it comes from doing section 5's two steps in the other order.

Suppose you go straight to the Deployment Center and tick Continuous deployment without enabling SCM basic auth first. The checkbox works. The webhook gets created. But the Webhook URL field looks like this:

![Continuous deployment ticked with SCM basic auth still disabled](./images/11-scm-disabled.png)

No URL — just the notice that SCM basic authentication is disabled. And the URL that did get sent to the registry has nothing to put in the credential slots:

```
https://REDACTED:REDACTED@greeting-aafwcke7hvhzevhg.scm.westeurope-01.azurewebsites.net/api/registry/webhook
```

Everything downstream of this is still correct. Push an image and the registry does its job: the event fires, the `POST` goes out to exactly the right endpoint. It arrives at the gatekeeper with no credentials, and the gatekeeper does what a gatekeeper does:

![The webhook event log showing a 401](./images/12-webhhok-401.png)

A `401 Unauthorized`, on the webhook's own event log on the ACR side. Which is a genuinely good failure to get, because it is specific: the request was delivered and understood, and refused for one reason. It rules out the scope, the URL, the endpoint and the registry in one line.

**The fix is not to re-tick the box.** The URL was generated once, with empty credentials, and handed over. Nothing regenerates it on its own. You have to:

1. Delete the webhook on the ACR.
2. Enable SCM Basic Auth Publishing Credentials on the App Service.
3. In the Deployment Center, untick Continuous deployment, save, tick it again, save.

Then check both ends. The App Service should show a populated Webhook URL, and the ACR should have a fresh webhook whose URL contains credentials rather than `REDACTED`:

![SCM basic auth re-enabled, with a real webhook URL](./images/13-scm-reenabled.png)

> A generated credential is a snapshot, not a live link. Change what it was made from and it does not follow — it has to be made again.

## 8. A different kind of "unauthorized"

One more thing turns up in the platform logs, and it is worth being able to tell apart from the `401` above, because both are credential problems and they are not the same credential problem:

![ImagePullUnauthorizedFailure in the platform logs](./images/10-missing-creds-error-log.png)

```
State: Stopping, Action: StoppingSite, LastError: ImagePullUnauthorizedFailure,
LastErrorDetails: Failed to pull image: beddemo.azurecr.io/greeting-api:latest.
Image pull failed with forbidden or unauthorized. Check registry credentials.
```

Read the direction of travel. This is the App Service failing to get *into the registry* — the arrow from section 1, the one the managed identity holds the `AcrPull` role for. It has nothing to do with SCM basic auth or the webhook. The webhook is about getting a message *in* to your app; this is about your app reaching *out* to ACR.

Which one you are looking at tells you where to go. A `401` on the ACR webhook event log means the SCM credentials. `ImagePullUnauthorizedFailure` in the platform logs means the identity and its role assignment. We will come back to that second one properly, and to what has to be arranged by hand when there is no managed identity to do it for you.

## 9. Where to look when it breaks

| Symptom | Where to look | Usual cause |
|---|---|---|
| Pushed a new image, app still serves the old response | ACR → Services → Webhooks → event log | The webhook never fired, or fired and was refused |
| Webhook event log shows `401` | App Service → Configuration → Platform settings | SCM basic auth was off when the webhook URL was generated |
| Webhook URL field is empty in the Deployment Center | Same place | SCM basic auth is disabled |
| Webhook exists but never fires on push | ACR → the webhook's **Scope** field | The scope names a different repository or tag than the one you pushed |
| The new version appeared, but only after you saved a setting | — | The save restarted the app; the webhook is not proven to work |
| Platform logs show `ImagePullUnauthorizedFailure` | Managed identity → Azure role assignments | The identity does not hold `AcrPull` on the registry |
| A variable you set is not visible to your code | Kudu → Environment → Settings & Variables | It was not saved, or was set on the wrong app |

## 10. Sources

1. Microsoft Learn, *Kudu service overview* — [learn.microsoft.com/en-us/azure/app-service/resources-kudu](https://learn.microsoft.com/en-us/azure/app-service/resources-kudu)
2. Red Hat, *What is a webhook?* — [redhat.com/en/topics/automation/what-is-a-webhook](https://www.redhat.com/en/topics/automation/what-is-a-webhook)
3. Microsoft Learn, *Azure Container Registry webhook schema reference* — [learn.microsoft.com/en-us/azure/container-registry/container-registry-webhook-reference](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-webhook-reference)
4. Azure App Service OSS blog, *Using Webhooks for image pulls with Web App for Containers* — [azureossd.github.io/2025/12/16/Using-Webhooks-for-image-pulls-with-Web-App-for-Containers](https://azureossd.github.io/2025/12/16/Using-Webhooks-for-image-pulls-with-Web-App-for-Containers/)
