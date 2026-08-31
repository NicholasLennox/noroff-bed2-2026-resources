# Cloud Services M2 – Self Study

> This week you took an API from an empty folder to a container running on the public internet, and you did it twice — once as `alpha`, once as `beta`. This page has three parts, in order of priority: finishing the practical work, the Moodle task and its solution video, and a short set of readings that put what you did into a wider context. The readings are recommended rather than required, and you are not expected to get through all of them.

## 1. Before anything else

The last lesson was a large practical. If Kata 3 is incomplete - if your registry does not yet hold `alpha`, `beta` and `latest`, or if `/health` on your Azure URL is not reporting `production` - complete it before continuing here.

The knowledge check that followed the kata is the second priority. Work through it properly, then check yourself against the answer key.

## 2. Moodle: lesson 2.5, Task 1

Complete Task 1 in Moodle, then **watch the solution video all the way through** it does some things differently from how we did them in class. In particular it shows how Azure can deploy an app **directly from the image in the container registry**, rather than the route we took in class.

## 3. Reading

You do not have to read all the linked artciles fully. What is recommended is that you at least **open each one and see what it is**. Some topics you may skim through, some may interest you more. 

Under each, there are a few things to keep in mind while you look.

## 4. Tags, and what a tag cannot tell you

**Docker — *Docker Best Practices: Using Tags and Labels to Manage Docker Image Sprawl*** (Jay Schmidt, October 2024)

[Read the article](https://www.docker.com/blog/docker-best-practices-using-tags-and-labels-to-manage-docker-image-sprawl/)

This is the article version of the confusion we worked through in the kata — the `-t` flag, the `:tag` inside the name, `docker tag` on top of that, and `latest` meaning something other than what it sounds like. It makes the same argument we did, that `latest` only ever means "the last thing pushed here", and it introduces the `LABEL` instruction as a way of writing version information *into* the image itself, using a set of standard names.

The distinction that makes it worth reading is that a tag is a name pointing *at* an image and can be moved to point somewhere else, whereas a label is baked *into* the image and travels with it.

Consider:

1. In the kata, `latest` pointed at your alpha build and then at your beta build. If you had been handed one of those images with no tag at all, what could you have worked out about which version it was?
2. What does a `LABEL` give you that a tag cannot, and what does it cost you to add one?
3. The article talks about "image sprawl" across an organisation. Your registry has one repository and three tags — what would this look like with three hundred?

## 5. Configuration, and the health endpoint

### 5.1 Config belongs outside the code

**The Twelve-Factor App — *III. Config***

[Read the page](https://12factor.net/config)

The Twelve-Factor App is a set of twelve principles for building applications that get deployed to services rather than installed on a machine you own. It was written in 2011 by developers at Heroku, and it has become one of the most widely referenced pieces of writing in this area — you will meet it cited in job adverts, in architecture documents, and in the documentation of platforms that were built to follow it. It is not a specification and nobody enforces it, but it named a set of practices clearly enough that the industry largely adopted the vocabulary.

Factor III is the one you have been doing all week without being told why. It defines config as "everything that is likely to vary between deploys", argues it must live in environment variables rather than in the code, and offers a test you can apply to any project you have ever written:

> A litmus test for whether an app has all config correctly factored out of the code is whether the codebase could be made open source at any moment, without compromising any credentials.

Consider:

1. Apply the litmus test to the facts API you built. Then apply it to something you wrote last year.
2. Your `ENVIRONMENT` value reached the running process three different ways in the kata, and the image was identical for the last two. Which factor III argument does that demonstrate?
3. Read the titles of the other eleven factors. Which ones describe something you have already been made to do this week?

### 5.2 Your health endpoint, used by the platform

**Microsoft Learn — *Monitor the health of App Service instances***

[Read the article](https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check)

You built `/health` for yourself — somewhere to point `curl` at to find out whether the container had really started and whether the config had really arrived. This page is about what happens when you hand that same endpoint to Azure and let the platform use it.

Given a path, App Service pings it on every instance once a minute. An instance that fails to answer with a 2xx status often enough gets taken out of the load balancer, and if it stays unhealthy for an hour it gets replaced with a new one. The endpoint stops being a debugging convenience and becomes something the platform makes decisions with.

This article is long and it keeps going well past the useful part — authentication headers, diagnostic dumps, slot swaps, a long FAQ. **The first two sections are the ones that matter**: the introduction, and *How Health check works*. Read those, look at the limitations if you are curious about why nothing would visibly happen on your own app, and stop there.

Consider:

1. Your app runs on a single instance. Read the FAQ entry on that, and work out what health check would and would not do for you today.
2. The article says the path "should check critical components of your application" and return a 500-level code if it cannot reach them. Your `/health` returns 200 and reports the environment. What would you have to add for it to be honest by that standard?
3. If an endpoint decides whether an instance gets destroyed and replaced, what happens if you get it wrong in either direction — too strict, or too forgiving?

> An endpoint you built to answer your own question becomes infrastructure the moment something else starts asking it.

## 6. Two views of the same machinery

The last two are shorter and are there for perspective rather than technique. One is what this looks like when it goes wrong; the other is what it looks like at a scale you have not seen yet.

### 6.1 When the images were not there any more

**Logto — *Postmortem: Docker image not found*** (17 December 2023)

[Read the incident report](https://blog.logto.io/postmortem-docker-image-not-found)

An automated cleanup job at Logto deleted their production container images, and their service was unavailable for eighteen minutes. The cause was a retention policy that could not correctly distinguish the images it was supposed to keep from ones it was supposed to remove.

This is a **postmortem** *[a document written after an incident that sets out what happened, what caused it, and what will change — the convention in most engineering organisations is that it examines the system rather than blaming a person]*. It is short, it is honest, and it is about exactly the layer you have just been working in: images, tags, and what those names actually point at. Some of the technical detail goes past what we have covered, and you can let that wash over you — the shape of the failure is the part to take away.

Consider:

1. The images still existed as data, and the deployment still failed. What does that tell you about the relationship between an image and the name used to fetch it?
2. Everything in this incident was automated, and the automation is the reason it happened. Would doing it by hand have been safer, or just slower to go wrong?
3. Read how the report is written — what it does and does not spend its words on. Would you be able to write one of these about a failure of your own?

### 6.2 The same mechanics, at a different scale

**Docker — *Case study: Itaú Unibanco***

[Read the case study](https://www.docker.com/customer-stories/itau-unibanco/)

Itaú Unibanco is the largest private bank in Latin America. This case study describes it standardising on containers across more than four thousand developers, with roughly 65% of its infrastructure migrated to the cloud so far, under the constraints a bank operates with — who is allowed to pull which image, and being able to prove it afterwards.

Your registry currently holds one repository and three tags. The commands and concepts behind theirs are the ones you used yesterday; what changes is the number of them and what it costs when the process is unclear.

Consider:

1. Which of the problems described here exist because of scale, and which ones you already have in miniature?
2. The organisation needed to control who can pull which image. Nothing in what you built this week does that — where would it have to go?
3. If you were assessing this claim rather than reading it, what would you want to see that a vendor case study will never show you?

> The commands do not change with scale. What changes is the cost of not having agreed on how to use them.

## 7. Sources

1. Docker Blog, *Docker Best Practices: Using Tags and Labels to Manage Docker Image Sprawl* (Jay Schmidt, October 2024) - [docker.com/blog/docker-best-practices-using-tags-and-labels-to-manage-docker-image-sprawl](https://www.docker.com/blog/docker-best-practices-using-tags-and-labels-to-manage-docker-image-sprawl/)
2. The Twelve-Factor App, *III. Config* - [12factor.net/config](https://12factor.net/config)
3. Microsoft Learn, *Monitor the health of App Service instances* - [learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check](https://learn.microsoft.com/en-us/azure/app-service/monitor-instances-health-check)
4. Logto Blog, *Postmortem: Docker image not found* (17 December 2023) - [blog.logto.io/postmortem-docker-image-not-found](https://blog.logto.io/postmortem-docker-image-not-found)
5. Docker, *Case study: Itaú Unibanco* - [docker.com/customer-stories/itau-unibanco](https://www.docker.com/customer-stories/itau-unibanco/)
