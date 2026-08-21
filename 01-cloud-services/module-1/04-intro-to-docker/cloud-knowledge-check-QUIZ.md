# Cloud Computing - Knowledge Check

## Deployment Models

**1.** A company tells you their systems run on a "private cloud," but the hardware is actually owned and operated by Microsoft inside an Azure datacentre, and no other customer ever touches it. Is "private cloud" the right term?

A. Yes. A cloud counts as private when one organisation has exclusive use of it, wherever the hardware lives.  
B. No. A private cloud must physically sit in the company's own building.  
C. No. If Microsoft owns the hardware, it is automatically a public cloud.  
D. Yes, but only because Microsoft also lets other tenants share that hardware.

**2.** Five regional hospitals want to pool cloud infrastructure because they all have to satisfy the same strict patient-data and compliance rules. Which deployment model fits best?

A. Public cloud  
B. Private cloud  
C. Hybrid cloud  
D. Community cloud

**3.** An online shop runs its everyday traffic on its own private cloud. During a big seasonal sale, it automatically pushes the extra overflow demand out to a public cloud, then pulls back afterwards. This is best described as:

A. A public cloud that scales itself  
B. A hybrid cloud using cloud bursting  
C. A community cloud arrangement  
D. Over-provisioning a private cloud

**4. (True / False)** In a public cloud, your organisation is guaranteed that no other customer's workload ever runs on the same physical hardware as yours.

---

## Service Models

**5.** You rent a virtual machine from a provider. They keep the physical server powered and running, but installing, updating and securing the operating system is left entirely to you. Which service model is this?

A. PaaS  
B. SaaS  
C. IaaS  
D. FaaS

**6.** A development team pushes only their application code to a service. The provider takes care of the operating system, the runtime, patching and the servers underneath, and the team never logs into a machine. Which model?

A. PaaS  
B. IaaS  
C. SaaS  
D. On-premises

**7.** Your users open Outlook in a web browser to read email. They manage nothing but their own mailbox and settings, with no servers, no OS, and no application code. Which model?

A. IaaS  
B. PaaS  
C. FaaS  
D. SaaS

**8.** A small piece of code runs only when a new file is uploaded, then stops. You are billed just for the fraction of a second it actually ran, and you never manage a server. This is best described as:

A. IaaS, because a server runs the code  
B. FaaS or "serverless": code runs on a trigger and you pay only for the time it runs  
C. SaaS, because it is finished software  
D. A private cloud function

---

## Shared Responsibility

**9.** Under the shared responsibility model, which one of these is **always** the customer's responsibility, in every single model?

A. The operating system, in every model  
B. Network controls, in every model  
C. The application, in every model  
D. Your data and the identities that access it, in every model

**10.** On the same day, two things go wrong for a company using IaaS. First, an intruder physically breaks into the provider's datacentre. Second, one of the company's own staff sets a database to "public" and leaks customer data. Under the shared responsibility model, who is responsible for each?

A. The provider for both  
B. The customer for both  
C. The provider for the datacentre break-in, the customer for the leaked database  
D. The customer for the datacentre break-in, the provider for the leaked database

---

## CapEx vs OpEx

**11.** A startup rents VMs month to month instead of buying its own servers. On the company's financial statements, how does that monthly spend appear?

A. As an operating expense on the income statement  
B. As a capital asset that is depreciated over five years  
C. As a one-time capital expenditure  
D. As a sunk cost recorded on the balance sheet

**12.** A company forecasts heavy demand and buys enough servers to match. The demand turns out to be far lower than expected. What is the main downside they now face?

A. They cannot scale up quickly enough to serve their users.  
B. They are billed for usage they never actually consumed.  
C. They have paid for capacity that now sits idle and keeps losing value.  
D. The provider absorbs the cost of the idle hardware, not them.

**13. (True / False)** A company buys a server for 100,000 NOK expected to last five years. Recording it as costing roughly 20,000 NOK per year, rather than the full 100,000 NOK in the first year, is an example of depreciation.

---

## Virtualization

**14.** A colleague claims "a virtual machine is basically just a spare physical computer sitting in the server room." Why is that description wrong?

A. A VM cannot run its own operating system.  
B. A VM is really a set of files running in software on shared physical hardware, even though it behaves like a separate computer.  
C. A VM needs no hardware at all to run.  
D. A VM is always faster than any physical computer.

**15.** In a virtualized server running several VMs, which component hands out the physical CPU and memory to each VM and stops one VM from reaching into another's memory?

A. The hypervisor  
B. The guest operating system inside each VM  
C. The virtual hard drive file  
D. The application running inside the VM

**16.** A cloud provider virtualizes its production servers using a hypervisor that runs directly on the bare hardware, with no host operating system beneath it. Which type is this, and why does it suit the cloud?

A. Type 2 (hosted), because it runs conveniently on top of Windows.  
B. Type 2 (hosted), because it is the easiest to install on a laptop.  
C. Type 1, but only after a host OS like Linux is installed first.  
D. Type 1 (bare-metal). It talks straight to the hardware with the least overhead and lowest latency.

**17.** A student installs VirtualBox on their Windows laptop so they can run Linux in a window alongside Windows. What kind of hypervisor is this, and what is the trade-off?

A. Type 1, so it gives near-native performance.  
B. Type 2, running on top of the existing OS, which adds a performance cost.  
C. Type 1, because it replaces Windows entirely.  
D. Type 2, but it runs with no overhead at all.

**18.** Your notes mention both a "bare-metal hypervisor" and a "bare-metal server." How do they actually differ?

A. They are two names for the same thing.  
B. A bare-metal server always runs a Type 2 hypervisor.  
C. A bare-metal hypervisor sits directly on hardware with no host OS, while a bare-metal server is a physical machine used without any virtualization at all.  
D. A bare-metal hypervisor can only run on a laptop.

**19. (True / False)** A virtual machine runs its own full guest operating system, whereas a container shares the host's OS kernel, which is the main reason containers are usually much smaller and quicker to start.

---
