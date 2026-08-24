# Cloud Services M1 – Self Study

## Moodle tasks

Complete the following activities in Moodle before moving on to the case studies.

* **Task 1:** A short quiz to recap some of the general concepts around cloud deployment models and service models.

* **Task 2:** Explore the SLA for an AWS EC2 instance. EC2 is Amazon's general-purpose compute service, commonly used to run applications and workloads.

  You will then complete the **Learn by Doing with AI** task, comparing EC2 with equivalent services from Azure and Google Cloud. There may be more than one comparable service, so take some time to explore the differences and consider why they exist.

* **Task 3:** Read the article provided in Moodle. Alternatively, you can move directly to the case studies in the next section, which will build on some of the same ideas.

Once you have completed the Moodle tasks, move on to the case study readings and reflections below.


## Case Study Reading and Reflection

Once you have completed the Moodle activities, spend the remaining self-study time working through the case studies below.

These readings approach cloud and infrastructure decisions from different angles. As we will be working with Microsoft and Azure later in the course, the Microsoft case also provides some useful context for that work.

You do not need to produce a formal report. Read the cases, consider the questions, and connect them to the practical work and discussions from this week.

### 1. Microsoft: Improving efficiency through software

Read:

**InfoQ — Microsoft Claims Reduction in Cloud Cost from Migrating Internal Services to .NET 6**

[Read the article](https://www.infoq.com/news/2022/10/microsoft-dotnet-6-reduces-cost/?utm_source=chatgpt.com)

This case looks at how changes to the software itself can affect the infrastructure required to run it. Microsoft found that moving internal services to .NET 6 created opportunities for greater efficiency and lower cloud costs.

Consider:

1. What changed as a result of the move to .NET 6?
2. How can improvements in software efficiency affect infrastructure costs?
3. What does this suggest about the relationship between application design and cloud usage?
4. How might this connect to the .NET work we will do later in the year?

### 2. Amazon Prime Video: Matching architecture to demand

Read:

**Amazon Prime Video Technology Blog — Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%**

This is an example we have already discussed in class.

The interesting part of this case is how the team reconsidered its architecture based on the actual behaviour of the workload. The workload remained within AWS, but a different architectural approach proved to be a much better fit.

Consider:

1. What characteristics of the workload made the original approach expensive?
2. Why did the chosen architecture become less suitable as the workload operated at scale?
3. What does this case tell us about serverless architectures?
4. How important is understanding real workload behaviour when making architectural decisions?

Think about whether the best architecture depends on the technology itself, or on how well it fits the specific workload.

### 3. Dropbox: Should we stay or should we go?

Read:

**Fortune — Dropbox IPO cloud stock**

[Read the article](https://fortune.com/2018/02/23/dropbox-ipo-cloud-stock?utm_source=chatgpt.com)

Dropbox provides a different perspective. As its infrastructure requirements grew, the company reconsidered where some of its workloads should run and invested in its own infrastructure.

This raises questions about how technology decisions can change as an organisation, its workloads and its requirements evolve.

Consider:

1. Why might cloud infrastructure be an attractive choice for an organisation?
2. How might the economics change as workloads grow and become more predictable?
3. What advantages and responsibilities come with operating your own infrastructure?
4. What factors would you consider before deciding where a workload should run?
5. How should an organisation recognise when it is time to revisit an earlier technology decision?

## Optional reading: Microsoft and cloud migration

If you have additional time, read:

**Fortune — Microsoft Claims Another Cloud Win as Symantec Moves Onto Azure**

[Read the article](https://fortune.com/2017/10/16/microsoft-azure-cloud-symantec?utm_source=chatgpt.com)

We will be working with Azure later in the course. This case provides an example of a large organisation moving workloads onto Microsoft's cloud platform.

As you read, consider what an enterprise-scale migration involves. Think about the technical work, but also the people, processes and operational changes that may be required.

## Bringing the cases together

The three main cases look at efficiency and technology decisions at different levels:

* **Microsoft:** improving the software.
* **Prime Video:** changing the architecture to better fit the workload.
* **Dropbox:** reconsidering where the workload should run.

As you finish the readings, keep one question in mind:

> **Where is the biggest opportunity for improvement in this system?**

The answer might lie in the software, the architecture, or the infrastructure strategy. Understanding which of these is most relevant is an important part of making good technology decisions.
