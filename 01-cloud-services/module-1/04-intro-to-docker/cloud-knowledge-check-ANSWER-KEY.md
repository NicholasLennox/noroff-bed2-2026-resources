# Cloud Computing - Knowledge Check

### Deployment Models

**1. A** *(Concept: what makes a cloud "private")*
"Private" is about exclusive use by one organisation, not physical location. A private cloud can be self-hosted on-premises or run on a third party's hardware such as dedicated Azure, as long as nobody else's data shares it. Options B and C both wrongly assume that location or ownership decides the label.

**2. D** *(Concept: community cloud)*
Several distinct organisations sharing infrastructure because of the same concerns, such as compliance, security or industry rules, is a community cloud. Hospitals are the classic example. It is not private, which is one organisation only, and not public, which is open to anyone.

**3. B** *(Concept: hybrid cloud and cloud bursting)*
Two distinct models, private and public, that stay separate but are connected so workload can move between them. Pushing overflow demand out to the public cloud during a spike is cloud bursting. Option D is the trap: over-provisioning is a CapEx sizing mistake, not this pattern.

**4. False** *(Concept: resource pooling)*
A public cloud is built on shared hardware. You pool the underlying resources with many other tenants. Guaranteed physical isolation is closer to what a private cloud offers. This checks that they link "public" back to the resource-pooling characteristic.

---

### Service Models

**5. C (IaaS)** *(Concept: who manages which layer)*
The provider supplies the raw building blocks, being the hardware, networking and the VM, while you own everything from the operating system upward. The tell is "installing and securing the OS is left to you."

**6. A (PaaS)** *(Concept: you deploy code, provider runs the platform)*
The provider manages the OS, runtime, patching and servers, and the team only deploys code. "Never logs into a machine" is the giveaway that the platform layer is handled for them.

**7. D (SaaS)** *(Concept: finished software, you just use it)*
Everything is managed by the provider. The user manages only their own data and settings through a browser. Nothing to install, no OS, no code.

**8. B (FaaS or serverless)** *(Concept: event-triggered, pay-per-run)*
It runs on a trigger, stops when done, and is billed only for the time it runs. That is Functions as a Service, or serverless. Worth reinforcing that FaaS is not one of the original three NIST models, but a style of PaaS. Options A and C miss the event-driven, pay-for-runtime billing that defines it.

---

### Shared Responsibility

**9. D** *(Concept: what never shifts to the provider)*
Data and identity, along with devices, are always the customer's, in every model. The operating system (A), network controls (B) and the application (C) all move to the provider as you go from IaaS to PaaS to SaaS, so none of those is "always" yours. Only the data and the identities that access it stay with the customer no matter what. Students who pick A, B or C are treating a layer that shifts as if it were fixed.

**10. C** *(Concept: security "of" the cloud versus "in" the cloud)*
The provider is responsible for the security *of* the cloud, meaning the physical and underlying infrastructure, so the datacentre break-in is on them. The customer is responsible for security *in* the cloud, meaning their own data and configuration, so the misconfigured public database is on the customer. This holds even in IaaS. Option B misses that the physical layer is never the customer's, and option A misses that the customer's own data and access decisions are never the provider's.

---

### CapEx vs OpEx

**11. A** *(Concept: how OpEx appears in the accounts)*
Renting is OpEx. It is recorded as an operating expense on the income statement. Because nothing is owned, it is not a capital asset (B), not a one-time capital expenditure (C), and does not sit on the balance sheet (D). Students have to know where OpEx actually lands in the accounts, not just that it is "pay as you go."

**12. C** *(Concept: the risk carried by over-provisioning)*
This is over-provisioning. Buying for a peak that never arrives leaves capacity idle and depreciating (C). Option A is the opposite failure, under-provisioning, where you have too little and cannot add more fast enough. Option B describes pay-per-use billing, which does not apply once you have already bought the hardware. Option D is wrong because when you own the hardware you carry the idle cost yourself. This is exactly the forecasting risk that rapid elasticity and pay-per-use were designed to remove.

**13. True** *(Concept: what depreciation actually is)*
Depreciation is the practice of spreading the cost of an asset you own across its useful life. A 100,000 NOK server over five years is recorded as roughly 20,000 NOK per year rather than all at once. The concrete numbers come straight from the board example.

---

### Virtualization

**14. B** *(Concept: what a VM actually is)*
A virtual machine is not a spare physical box. It is a set of files, being a configuration file and a virtual hard drive, that runs in software and shares the underlying physical hardware with other VMs, while behaving like a separate computer. Option A is false because each VM does run its own OS. Option C is false because a VM still relies on real hardware underneath. Option D overstates it, since running in software usually costs some performance, not gains it.

**15. A** *(Concept: the hypervisor's job)*
The hypervisor is the layer between the guests and the host. It allocates the real CPU, memory, storage and network to each VM, and it enforces isolation so that no VM can reach into another's memory or steal its resources. The guest OS (B), the virtual disk file (C) and the application (D) all sit inside a single VM and cannot manage the others.

**16. D** *(Concept: Type 1 / bare-metal hypervisor)*
A hypervisor sitting directly on the hardware with no host OS beneath it is Type 1, or bare-metal. It talks straight to the hardware with the least overhead and lowest latency, which is why cloud and production servers use it, for example Hyper-V, ESXi and KVM. Option C is wrong because Type 1 replaces the host OS rather than needing one, and A and B describe Type 2.

**17. B** *(Concept: Type 2 / hosted hypervisor)*
VirtualBox running on a laptop on top of Windows is a Type 2, or hosted, hypervisor. Because it has to go through the existing host OS to reach the hardware, it carries a performance cost. This is the everyday laptop case, the mirror image of the Type 1 cloud case in the previous question. Options A and C wrongly call it Type 1, and D denies the overhead that Type 2 always has.

**18. C** *(Concept: bare-metal hypervisor versus bare-metal server)*
These share the word "bare-metal" but mean different things. A bare-metal hypervisor is a Type 1 hypervisor running directly on hardware with no host OS. A bare-metal server is simply a physical machine that someone rents or owns and runs with no virtualization at all. The shared phrase just means "directly on the hardware," so option A is wrong to call them identical, and B and D invent rules that do not exist.

**19. True** *(Concept: VM versus container, light intro)*
A VM reproduces a whole computer, including its own full guest OS, which makes it heavy, measured in gigabytes and slower to boot. A container shares the host's kernel and only packages the app plus its dependencies, which makes it light, measured in megabytes and fast to start. That shared-kernel design is exactly why containers are lighter.

---

