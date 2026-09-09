# Cloud Deployment Models, Service Models & Shared Responsibility

> Builds on the 5 essential characteristics and the 5 cloud actors. As before, tricky terms get a plain-English version in *[brackets]*.

## 1. Cloud Deployment Models

*(Source: NIST SP 800-145 - [nvlpubs.nist.gov](https://nvlpubs.nist.gov))*

Deployment model answers the question: **"Whose hardware is this running on, and who gets to use it?"** NIST defines four models.

### Public Cloud
- Infrastructure is provisioned for **open use by the general public**.
- Owned and operated by the provider (e.g. Microsoft, AWS, Google) on **the provider's own premises**.
- You share the underlying hardware with many other organizations (recall, this is the **resource pooling** characteristic).

### Private Cloud
- Infrastructure is provisioned for **exclusive use by a single organization**.
- ⚠️ **Common misconception:** "private" does **not** automatically mean "on our own building." A private cloud can be:
  - **On-premises** *[hosted in your own company's building, on your own hardware]*, or
  - **Hosted by a third party** *[a provider owns and runs the hardware, but it's dedicated only to you - nobody else's data touches it]*.
- What makes it "private" is **exclusivity of use**, not physical location.

### Community Cloud
- Infrastructure is shared by **several organizations with shared concerns** *[e.g. the same industry, security requirements, or compliance rules]* - for example, a group of hospitals in the same region, or several government agencies.
- Like private cloud, it can be hosted on-premises or by a third party.

### Hybrid Cloud
- A **composition of two or more** of the above (private, community, or public) that remain distinct but are **connected by technology** that allows data and applications to move between them.
- Example: an organization runs day-to-day operations on a private cloud, but automatically bursts extra workload out to a public cloud during a demand spike (this is sometimes called **cloud bursting**).

## 2. Cloud Service Models

*(Source: NIST SP 800-145)*

Service model answers a different question: **"Which layer of the technology stack do I manage, and which layer does the provider manage?"** NIST defines three core service models.

### IaaS - Infrastructure as a Service
**What it is:** The provider gives you the raw building blocks - virtual machines, storage, and networking. You install and manage the operating system, and everything above it, yourself.

**Example:** **Azure Virtual Machines** *[you rent a virtual computer in the cloud; Microsoft handles the physical server and hardware, but you install and manage the operating system, updates, and any software on it, just like you would with a physical PC]*.

### PaaS - Platform as a Service
**What it is:** The provider manages the operating system, runtime, and underlying infrastructure for you. You just deploy your application code on top.

**Example:** **Azure App Service** *[you upload your website or application code, and Microsoft handles the server, operating system, and patching for you - you never have to think about the machine underneath]*.

### SaaS - Software as a Service
**What it is:** The provider manages everything - infrastructure, platform, and the application itself. You just use the finished software through a browser or app.

**Example:** **Microsoft 365 / Outlook** *[you just log in and use email - you never manage a server, an operating system, or even the application code; Microsoft runs all of it]*.

> **A note on "FaaS":** You may see **FaaS - Functions as a Service** *[also called "serverless"]* mentioned alongside these three. This is **not** one of NIST's original three service models - it's a more recent industry term for a style of PaaS where you deploy small pieces of code ("functions") that only run when triggered, and you're billed only for the exact time they run. Example: **Azure Functions**. 

### The Big Picture

| | You Manage | Provider Manages |
|---|---|---|
| **IaaS** | OS, runtime, apps, data | Physical hardware, virtualization, network |
| **PaaS** | Apps, data | OS, runtime, physical hardware, virtualization, network |
| **SaaS** | Just your data & user settings | Everything else |


## 3. The Shared Responsibility Model

*(Source: Microsoft - "Shared responsibility in the cloud," [learn.microsoft.com](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility))*

This is the **security and management version** of the table above. As you move from IaaS → PaaS → SaaS, more responsibility shifts from *you* to the *provider* - but some things are **always yours**, no matter which model you use.

### What you're always responsible for, regardless of model:
- **Your data** *[classifying it, protecting it, deciding on encryption]*
- **Identity and access management** *[deciding who's allowed to log in and what they can do]*
- **Devices** *[the laptops, phones, and computers your users connect from]*

### What shifts depending on the model:

| Layer | IaaS | PaaS | SaaS |
|---|---|---|---|
| Applications | You | Shared *[provider manages the platform, you manage your app's configuration and code]* | Provider |
| Operating System | You | Provider | Provider |
| Network Controls | You | Shared | Provider |
| Physical Hardware / Datacentre | Provider | Provider | Provider |


![Shared responsibility model - Azure](https://learn.microsoft.com/en-us/azure/security/fundamentals/media/shared-responsibility/shared-responsibility.svg) 

**The core idea in one sentence:** the cloud provider is always responsible for the **security *of* the cloud** *[the physical stuff, the underlying infrastructure]*, while you are always responsible for the **security *in* the cloud** *[your data, your access controls, and - depending on the service model - however much of the stack sits above the infrastructure]*.

## 4. Reading an SLA

An **SLA** *[Service Level Agreement - the part of the contract where a provider commits to a level of service, and states what you get if it misses]* is the closest thing to a promise you get from a provider, and it promises less than most people assume.

| Service | Committed monthly uptime | Published in |
|---|---|---|
| Azure App Service, Basic tier and above | 99.95% | [SLAs for Online Services](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services) |
| **Azure App Service, Free and Shared tiers** | **No SLA** | [App Service pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/windows/) |
| Google Cloud Run | 99.95% | [Cloud Run SLA](https://cloud.google.com/run/sla) |

Start with the second row. App Service is the PaaS example from section 2, and the tier you choose changes what the provider commits to: Microsoft's pricing page states there is no SLA for Free and Shared plans, and that they are not supported for production use. Free tiers across all three providers tend to work this way, and the Free tier is what we will deploy to later in the course.

Each provider publishes their SLAs in one place: [Azure](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services), [AWS](https://aws.amazon.com/legal/service-level-agreements/), [Google Cloud](https://cloud.google.com/terms/sla).

### 4.1 What the percentage buys you

99.9% and 99.99% sound close together. Over a month they are not:

| Uptime | Allowed downtime per month |
|---|---|
| 99.99% | about 4 minutes |
| 99.95% | about 22 minutes |
| 99.9% | about 43 minutes |
| 99% | about 7 hours |

### 4.2 Two things an SLA does not do

**It pays in service credits, which you have to claim.** Miss the target and you get a percentage of that month's bill back as account credit. Providers do not monitor their own violations for you: you detect the outage, document it, and file within a deadline, commonly 30 to 60 days. Microsoft's [own guidance](https://learn.microsoft.com/en-us/azure/reliability/concept-service-level-agreements) states the limit plainly: "Credits don't cover lost revenue, customer attrition, or reputational damage."

**It measures the service, not your application.** If your code crashes, if you deploy something broken, if you misconfigure it, the SLA was met and the outage is yours. That is the shared responsibility model from section 3 arriving as a contract term: the provider is accountable for the availability *of* the cloud, you for what you run *in* it.

### 4.3 The percentage is not the whole promise

The percentage means nothing without the definitions under it. Whether the promise attaches to one instance or to a whole region, what counts as downtime, whether you were required to retry before a failure counts, and which tiers are excluded all vary between services and between providers. Two services can both advertise 99.95% and be committing to quite different things.

Microsoft publishes a guide to this, [*How to Read a Service-Level Agreement*](https://learn.microsoft.com/en-us/azure/reliability/concept-service-level-agreements). It is not Azure-specific, and it treats the reading as a method: five passes over the document, starting with the definitions and ending with how you would claim a credit. It demonstrates this on an invented service, Pigeon Post as a Service, whose SLA covers dispatching a message and says nothing about whether the pigeon arrives.

Two ideas from it apply to any SLA:

- **An SLA is a floor, not a target.** It is the minimum the provider commits to, not the reliability your users need. The name for that second thing is a **service-level objective (SLO)** *[the reliability target you set for your own application, based on what your users can tolerate]*, and it is yours to decide.
- **Read the exclusions before the percentage.** Planned maintenance, your own misconfiguration, exceeding a quota, and anything still in preview are commonly carved out.

> An SLA tells you what a provider owes you when it fails, not how often it will.

## 5. Sources

1. NIST SP 800-145, *The NIST Definition of Cloud Computing* - [csrc.nist.gov](https://csrc.nist.gov/pubs/sp/800/145/final)
2. Microsoft Learn, *Shared responsibility in the cloud* - [learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility)
3. Microsoft Learn, *How to Read a Service-Level Agreement (SLA)* - [learn.microsoft.com/en-us/azure/reliability/concept-service-level-agreements](https://learn.microsoft.com/en-us/azure/reliability/concept-service-level-agreements)
4. Microsoft, *Service Level Agreements for Online Services* - [microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services)
5. Microsoft Azure, *App Service pricing* - [azure.microsoft.com/en-us/pricing/details/app-service/windows](https://azure.microsoft.com/en-us/pricing/details/app-service/windows/)
6. AWS, *Service Level Agreements* - [aws.amazon.com/legal/service-level-agreements](https://aws.amazon.com/legal/service-level-agreements/)
7. Google Cloud, *Service Level Agreements* - [cloud.google.com/terms/sla](https://cloud.google.com/terms/sla)
8. Google Cloud, *Cloud Run Service Level Agreement* - [cloud.google.com/run/sla](https://cloud.google.com/run/sla)

