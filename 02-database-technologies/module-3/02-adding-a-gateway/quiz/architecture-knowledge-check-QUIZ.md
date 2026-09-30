# Software Architecture - Knowledge Check

This quiz is based on the Introduction to Software Architecture lesson, with the questions grouped into topics.

## The Four Dimensions

**1.** A cinema chain is planning a new booking system. One line on the planning board reads: *it must cope with 5,000 people trying to book in the same minute when tickets for a premiere go on sale.* Which of the four dimensions of architecture does that line belong to?

- **A.** An architectural decision
- **B.** An architectural characteristic
- **C.** A logical component
- **D.** The architectural style

**2.** A team building a school learning platform agrees that assignment submissions will be stored in MongoDB, and that the parts of the system will talk to each other through a REST API sending JSON. Which of the four dimensions does that agreement belong to?

- **A.** An architectural characteristic
- **B.** A logical component
- **C.** The architectural style
- **D.** An architectural decision

---

## Partitioning and Deployment

**3.** A gym chain's app has this layout, and each folder holds its own model, service and routes:

```
src/
  members/
  classes/
  bookings/
```

A developer adds a waiting list to class bookings. Which statement is true?

- **A.** It is technical partitioning, and the change touches a file in every folder.
- **B.** It is technical partitioning, because every folder has its own model, service and routes.
- **C.** It is domain partitioning, and the change is made inside `bookings/`.
- **D.** It is domain partitioning, and the change touches a file in every folder.

**4.** A food-delivery app is one Express application deployed to a single App Service. Its code is split into `restaurants/`, `orders/` and `couriers/` folders. The team fixes a typo in the text of a courier notification. What gets rebuilt and redeployed?

- **A.** The whole application, restaurants and orders included.
- **B.** The courier code, plus the orders code that calls it.
- **C.** Only the `couriers/` folder, since the code is split by domain.
- **D.** Nothing, since a change to text needs no redeploy.

**5.** The same food-delivery team later splits restaurants, orders and couriers into three services, each in its own container. Before the split, the order code found a driver by calling the courier code's `findNearestCourier()` function. What is different about that call now?

- **A.** Nothing, as long as the function keeps the same name and inputs.
- **B.** It is faster, since each service has a container to itself.
- **C.** It goes over the network, so it is slower and can fail.
- **D.** If it is made with RPC, it is as fast as the old in-process call.

**6.** An airline's check-in system is built and deployed as one application. Inside it, the code is split into `checkin/`, `baggage/` and `seating/`, and each folder has its own model, service and routes. Which architectural style is this?

- **A.** Layered
- **B.** Microservices
- **C.** Event-driven
- **D.** Modular monolith

---

## Microservices

**7.** A library is breaking its system up into microservices. Which of these proposed pieces fits the textbook's definition of a microservice?

- **A.** A separately deployed service that handles loan renewals and nothing else.
- **B.** A 300-line service that handles loans, fines, reservations and memberships.
- **C.** A `renewals/` module inside the library's one deployed application.
- **D.** A shared database that every library service reads its loans from.

**8.** A parking company runs a Permits service and an Invoicing service as microservices. To save a network call, Invoicing reads the Permits service's tables directly. The Permits team later splits the `expires` column into `valid_from` and `valid_to`, and redeploys. What happens?

- **A.** The Permits deploy is rejected, since Invoicing depends on its tables.
- **B.** Invoicing breaks, and the Permits team had no way to know.
- **C.** Invoicing keeps working, since each microservice owns its own data.
- **D.** Both services break, since they share one bounded context.

**9.** In the last week before the tax deadline, a tax service's Returns microservice gets twenty times its usual traffic. Its Guidance and Accounts microservices see no change. What does the microservices style let the team do about it?

- **A.** Rewrite Returns in a faster tech stack without the others noticing.
- **B.** Redeploy all three services together so they share the load.
- **C.** Run more copies of Returns and leave Guidance and Accounts alone.
- **D.** Move the Returns tables into the Accounts database to spread the load.

**10.** A hotel chain's system has four microservices: Room Catalogue, Reservations, Guest Profile and Billing. Room Catalogue holds each room's type, description and photos. Which service should own the table recording which rooms are free on which nights?

- **A.** Room Catalogue
- **B.** Reservations
- **C.** Guest Profile
- **D.** Billing

---

## Discussion

Answer these in a few sentences each, in your own words.

**11. Netflix.** Read [Netflix's Evolution from Monolith to Microservices](https://www.yochana.com/netflixs-evolution-from-monolith-to-microservices-a-deep-dive-into-streaming-architecture/).

In 2008 a corrupted database took Netflix down for three days. At the time Netflix was a monolith: the whole system was built and deployed as one unit. In microservices, each service does one thing, is deployed on its own, and owns its own data. Microservices give you three benefits: each service can be changed on its own, use its own tech stack, and be scaled on its own.


Explain how splitting Netflix into microservices limits the damage a failure like that one can do. Netflix now uses several different databases, including Cassandra, MySQL and Elasticsearch. Which of the three benefits does that show?

**12. Prime Video.** Read [Amazon Prime Video Monitoring Service](https://bytebytego.com/guides/amazon-prime-video-monitoring-service/).

Prime Video had a tool that watched live streams for defects like frozen video. It ran as separately deployed stages: one converted the video, and the next checked it for defects. Each stage saved its output to storage (Amazon S3) for the next stage to download, and the service coordinating the stages charged for every step it ran. The team merged the stages into one process and cut the cost by 90%.

When a system is one unit, its parts call each other in memory. When it is split into separately deployed parts, everything that passes between them goes over the network. Explain where the cost came from in the original design, and why merging the stages removed it. What did the team give up by merging them?

**13. Both.** Netflix split its system apart. Prime Video merged part of one back together. An **architectural characteristic** is something a system needs to support, such as availability, scalability, maintainability or low cost. For each company, name the characteristic that mattered most, and explain why it pushed them in the direction it did.
