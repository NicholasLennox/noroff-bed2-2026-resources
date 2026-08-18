# Introduction to Cloud Computing

> This resource is based on definitions from **NIST** (the U.S. National Institute of Standards and Technology), the organization whose definitions are the industry-standard starting point for describing cloud computing. Where a word might be new or tricky, a plain-English version is given in *[brackets]* right after it.


## 1. What is Cloud Computing?

Cloud computing is the **practice of using the internet to access a set of remote servers** *[computers owned and run by someone else, in a data centre far away]* to **store, manage, and process data**.

Key idea: you use it **on demand** *[whenever you need it, without asking anyone first]* and **pay as you go** *[you only pay for what you actually use, like an electricity or water bill]*.

## 2. The 5 Major Cloud Actors

*(Source: NIST / ISO — the two standards bodies that define these roles)*

These are the five "characters" involved in any cloud computing relationship.

### 1. Cloud Provider
- Owns the **data centres** *[physical buildings full of servers]*.
- **Supplies the services** (e.g., storage, computing power) to others.
- Is an **organization or entity** — usually a company like Amazon, Microsoft, or Google.

### 2. Cloud Consumer
- The **customer**.
- The **principal user** *[main person or organization actually using the service]*.
- Has a **business relationship with the provider** (e.g., a contract, a subscription, a pay-as-you-go account).

### 3. Cloud Broker
- An entity that **manages the use, performance, and delivery** of cloud services on behalf of a consumer.
- **Negotiates the relationship** between the provider and the consumer.
- Example: **consulting firms** that help a business choose and manage the right cloud services for them.

### 4. Cloud Auditor
- Conducts an **independent assessment** *[an outside, unbiased check-up]* of cloud services.
- Mainly concerned with **privacy and security**.
- Example: a **security firm**, or checking compliance with laws like **GDPR** *[General Data Protection Regulation — the EU's data privacy law]*.

### 5. Cloud Carrier
- The **intermediary** *[the "middleman" or connector]* that provides **connectivity and transport** of cloud services between the provider and the consumer.
- In practice, this is usually an **ISP** *[Internet Service Provider]* — for example, Telenor.

### How the Actors Relate to Each Other

- The **Provider** and **Consumer** have the core business relationship.
- The **Broker** sits between them, managing that relationship.
- The **Auditor** independently checks the Provider (privacy/security compliance).
- The **Carrier** is the network connection making the whole relationship possible.

## 3. The 5 Essential Characteristics of Cloud Computing

*(Source: NIST — [csrc.nist.gov](https://csrc.nist.gov), [nvlpubs.nist.gov](https://nvlpubs.nist.gov))*

These are the five features that make a service "cloud computing." If a service is missing one of these, it probably isn't truly cloud.

### 1. On-Demand Self-Service
- The consumer *[customer]* can **provision** *[set up / spin up]* computing power (like storage or servers) automatically, **without needing to talk to a human** at the provider.
- This is often called **"click and go."**
- Related term: **IaC — Infrastructure as Code** *[setting up computer systems using written scripts instead of manually clicking through menus, so it can be automated]*.

### 2. Broad Network Access
- Cloud capabilities are available **over the internet**, from almost anywhere.
- You can access services using **standard tools** *[a web browser, an app, or a command line]*.
- You can connect from **heterogeneous platforms** *[different types of devices — a phone, a laptop, a workstation]*.

### 3. Resource Pooling
- The provider's hardware is **shared between many different customers** at the same time — this is called **multi-tenant**.
- **Physical and virtual resources** *[real hardware, and software-simulated versions of hardware]* are assigned dynamically based on this multi-tenant model.
- Even though resources are shared, your data stays **isolated** *[kept separate and private from other tenants]*.
- The customer usually **doesn't know or care which physical machine** their data is actually running on — this is called **location independence**.

### 4. Rapid Elasticity
- The system's capabilities can **grow and shrink automatically to match demand** — like a rubber band stretching and relaxing.
- Example: a website might need very little computing power at 7 AM, a lot at lunchtime, and taper off by 7 PM. The cloud stretches and shrinks to follow this pattern automatically.
- To the consumer, this capacity **appears unlimited** — you never "run out."

### 5. Measured Service
- Cloud systems **automatically track and control how much you use** — like a **utility meter** *[the box on your house that tracks how much electricity or water you use, so you get billed accurately]*.
- Different services are measured with **different metrics** *[units of measurement]*, for example:
  - **Storage** → measured in **GB** *[gigabytes]*
  - **Virtual Machines (VMs)** → measured in **CPU hours** *[how long and how much processing power was used]*
- This usage data is visible to **both the provider and the consumer**, so both sides can see (and be billed/charged) transparently.

## 4. Sources

This material is based on definitions published by NIST and related standards references:

1. [csrc.nist.gov](https://csrc.nist.gov)
2. [nvlpubs.nist.gov](https://nvlpubs.nist.gov)
3. [csrc.nist.gov](https://csrc.nist.gov)
4. [peasoup.cloud](https://peasoup.cloud)
5. [synopsys.com](https://www.synopsys.com)
6. [cst.gov.sa](https://www.cst.gov.sa)
7. [noraonline.nl](https://www.noraonline.nl)
