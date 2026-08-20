# CapEx vs OpEx, and Hardware Virtualization

## 1. CapEx vs OpEx

**CapEx (Capital Expenditure)**: buying an asset outright. A large payment upfront, recorded on the balance sheet as an asset, and its cost is spread out over time through depreciation *[the accounting practice of writing off an asset's cost gradually over its useful life; a 100,000 NOK server "costs" 20,000 NOK/year on paper over a 5-year lifespan]*.

**OpEx (Operating Expenditure)**: paying for a service as it is used. A recurring cost, recorded directly as an expense on the income statement *[the report of revenue and expenses over a period]*. There is nothing to depreciate, because nothing was owned to begin with.

Buying a server is CapEx. Renting a VM or using any other service from a provider is OpEx.

### 1.1 Considerations regarding capital investment

- **Cash flow**: CapEx requires a large amount of money at once. OpEx spreads the same total cost over time. A startup with limited cash on hand may not have the option to choose CapEx even if it works out cheaper over 5 years.
- **Flexibility**: OpEx can be scaled down or cancelled. CapEx is a sunk cost *[money already spent that cannot be recovered]* - once the hardware is bought, it is owned whether it is needed or not.

### 1.2 Costs beyond the purchase price

Pricing a server usually starts with the visible components: CPU, RAM, disk, chassis. A full ownership cost includes several things beyond that:

- Power and cooling, ongoing every month.
- Rack space, either your own office or a paid colocation contract.
- Bandwidth and network uplink.
- Staff time for patching, monitoring, and replacing failed parts.
- The refresh cycle. Hardware is typically phased out over 3-5 years, after which it is slower and harder to get support or spare parts for.
- Money spent on a server cannot be spent or invested elsewhere in the business.

> The purchase price is usually a small fraction of the total cost of owning the hardware over its life.

### 1.3 Who carries the risk

Buying hardware means forecasting future demand and committing money to that forecast today. There are two ways to get the forecast wrong:

- **Under-provisioning**: demand grows faster than expected, the hardware cannot keep up, and new hardware takes weeks to arrive and be installed while users or revenue are lost in the meantime.
- **Over-provisioning**: hardware is bought for peak demand "just in case," and most of that capacity sits idle and depreciating.

The `rapid elasticity` and `measured service` characteristics exist to solve exactly this problem. The provider absorbs the forecasting risk and the cost of idle capacity across many customers, and the customer pays only for what is actually used. 

> CapEx means carrying your own demand-forecasting risk. OpEx means paying a provider to carry it for you.


## 2. Hardware Virtualization

This section is based on the following article: https://www.ibm.com/think/topics/virtualization 

### 2.1 What virtualization is

Virtualization uses software to create an abstraction layer over physical hardware, splitting a single machine's CPU, memory, storage, and network into multiple virtual machines. Each VM runs its own operating system and behaves like a separate physical computer, despite all of them sharing the same underlying hardware underneath.

### 2.2 The three components

- **Physical machine (the "host")**: the actual hardware. Supplies the real CPU, memory, storage, and network resources.
- **Virtual machine (the "guest")**: a virtual environment that simulates a physical computer in software. A VM is made up of files: a configuration file, a virtual hard drive, and a few other dependencies.
- **Hypervisor**: the software layer that sits between the guests and the host. It hands out physical resources to each VM and makes sure no VM can interfere with another by reaching into its memory or stealing its CPU cycles.

### 2.3 Type 1 vs Type 2 hypervisors

- **Type 1 ("bare-metal")**: interacts directly with the physical hardware, replacing the traditional host operating system entirely. This is how production servers are virtualized, including in the cloud. Azure runs on Microsoft's own Type 1 hypervisor, Hyper-V. Other examples: VMware ESXi, KVM.
- **Type 2 ("hosted")**: runs as an application on top of an existing operating system. Common on individual laptops and desktops for running a second OS. Because it has to go through the host OS to reach the hardware, it carries a performance cost. Examples: VirtualBox, VMware Workstation.

The word "bare-metal" here describes the hypervisor sitting directly on hardware with no OS underneath it. It is a separate idea from a "bare-metal server," the term for a physical machine a customer rents or owns without virtualization. Renting a VM from Azure and running a server yourself can both involve a Type 1 hypervisor; the difference is who owns and operates that layer, not the type of hypervisor.

### 2.4 CPU virtualization

CPU virtualization is what allows a single physical CPU to be divided into multiple virtual CPUs, one or more per VM. Early virtualization handled this entirely in software, translating each guest instruction on the fly. Since the mid-2000s, CPUs from Intel (VT-x) and AMD (AMD-V) have included instruction sets built specifically to support virtualization, taking on more of this work directly in hardware and making VMs significantly faster.

### 2.5 VMs vs containers

Install and get started with Docker: https://docs.docker.com/get-started/introduction/get-docker-desktop/ 

A VM reproduces an entire computer, including a full guest operating system, and that OS then runs one application. Containers take a lighter approach: they share the host's operating system kernel and only package the application itself along with its dependencies (code, runtime, libraries, configuration). This makes containers smaller and faster to start than VMs.

| | Virtual machine | Container |
|---|---|---|
| Virtualizes | Hardware | The operating system |
| Includes | A full guest OS | The application and its dependencies only |
| Isolation | Own kernel per VM, enforced by the hypervisor | Shared kernel, isolation enforced by kernel features |
| Typical size | Gigabytes | Megabytes |
| Typical boot time | Seconds to minutes | Milliseconds to seconds |

![Container vs VMs](https://substackcdn.com/image/fetch/$s_!kurQ!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F53593a6c-5217-4c1a-9a32-c9225e975f97_1920x972.jpeg)

On Linux, that kernel-level isolation is built from two features: **namespaces**, which give each container its own isolated view of things like processes, network interfaces, and mounted filesystems, and **cgroups (control groups)**, which limit and account for how much CPU, memory, and I/O each container is allowed to use. Neither of these is a hypervisor. They are features of a single, shared Linux kernel, which is why containers are so much lighter than VMs and why a container built for Linux does not run natively on a non-Linux kernel.

**Docker** is the tool that made this practical for everyday development and deployment. It does not invent namespaces and cgroups, it packages them behind a simple workflow:

- A **Dockerfile** describes how to build an application's environment: base OS layer, dependencies, code, configuration, startup command.
- Building that Dockerfile produces an **image**, a read-only, versioned snapshot of that environment.
- Running an image produces a **container**, a live, running instance of it. The same image can be run as many containers, simultaneously, all identical.
- Images can be pushed to and pulled from a registry (Docker Hub, or a private registry), so the exact same image that ran on a developer's laptop is what gets deployed to a server.

That last point is the practical reason Docker matters for backend work specifically: it removes "it works on my machine" as a category of problem, because the image is the environment, not just the code. It is also why containers pair naturally with the cloud service models already covered: a container is a natural unit of deployment for PaaS, and it is the foundation the FaaS/serverless model builds on underneath.

Containers are not a replacement for the hypervisor. In practice, a containerized workload in the cloud is still running inside a VM, so there are two layers of isolation stacked: the hypervisor separating tenants' VMs from each other, and namespaces/cgroups (via Docker) separating containers from each other within a VM.

## 3. Sources

1. NIST SP 800-145, *The NIST Definition of Cloud Computing* - [csrc.nist.gov](https://csrc.nist.gov/pubs/sp/800/145/final)
2. Intel, Intel Virtualization Technology (VT-x) documentation - [intel.com](https://www.intel.com)
3. AMD, AMD-V and AMD EPYC Server Processors - [amd.com/en/products/processors/server/epyc.html](https://www.amd.com/en/products/processors/server/epyc.html)
4. Microsoft Learn, Hyper-V Architecture - [learn.microsoft.com](https://learn.microsoft.com)
