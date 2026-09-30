# Software Architecture - Knowledge Check - Answer Key

### The Four Dimensions

**1. B - An architectural characteristic**

The line says what the system has to cope with - thousands of bookings in one minute - and nothing about how it is built. That makes it a characteristic, and this one is scalability.

If you chose A, you read "must cope with" as a choice being made. A decision would be something like "we'll use SQL Server" or "the parts talk over REST".

If you chose C, you picked up on the word "booking". Taking bookings is a logical component, but the line is about how much load it has to handle, not what job it does.

**2. D - An architectural decision**

Choosing MongoDB and choosing REST with JSON are long-term choices about how the system is built, and undoing either one later means rewriting a large part of it. That is what makes them architectural decisions.

If you chose C, you were treating the style as anything to do with how the parts connect. The style answers two narrower questions - how the code is split, and whether it is deployed as one unit or many - and this agreement answers neither.

If you chose A, a characteristic says what the system must support, like availability, not what it is built with.

---

### Partitioning and Deployment

**3. C - It is domain partitioning, and the change is made inside `bookings/`.**

Each top-level folder is a part of the problem - members, classes, bookings - with its own model, service and routes inside it. That is a vertical layer, so a change to bookings stays in one folder.

If you chose B, you saw the model, service and routes and read them as technical partitioning. Those files exist either way. What decides it is what the top-level folders are split by.

If you chose D, you had the right name but pictured horizontal layers. Touching a file in every folder is what a change costs under technical partitioning.

§3.2, *By domain*.

**4. A - The whole application, restaurants and orders included.**

The app is deployed as one unit, so any change - even one line of text - means rebuilding and redeploying all of it.

If you chose C, you mixed up the two questions an architectural style answers. Splitting the code into domain folders is partitioning, and it says nothing about deployment. The folders are still inside one application.

If you chose B, a monolith has no partial redeploy, whatever calls what.

§4.1, *Monolithic*.

**5. C - It goes over the network, so it is slower and can fail.**

Once couriers is its own application, the order code can't reach its function in memory any more. The call has to travel over the network to another container, which is far slower than an in-process call and can get lost on the way.

If you chose D, you took RPC being faster than JSON over REST to mean it is as fast as a local call. RPC makes the network call cheaper, but it is still a network call.

If you chose B, separate containers give you independent deployment, not faster calls between them.

§4.3, *How distributed parts talk*.

**6. D - Modular monolith**

Ask the two questions. It is one application, so it is monolithic. The folders are parts of the problem, each with its own model, service and routes, so it is domain partitioning. Monolithic plus domain partitioning is a modular monolith.

If you chose B, you spotted the domain split but not the deployment. Microservices need each part deployed on its own, and this system ships as one.

If you chose A, layered is a monolith split by technical job, with `models/`, `services/` and `routes/` at the top level.

§5, *Four styles from two questions*.

---

### Microservices

**7. A - A separately deployed service that handles loan renewals and nothing else.**

The definition has two parts: single-purpose, and separately deployed. A is the only option with both.

If you chose B, you took "micro" to mean a small amount of code. Size is not what counts. B does four jobs, so it is four services' worth of work in one.

If you chose C, the module is single-purpose but is not deployed on its own. That is a module in a modular monolith.

§6.2, *One thing, done well*.

**8. B - Invoicing breaks, and the Permits team had no way to know.**

Invoicing depended on the `expires` column, and nothing told the Permits team that. When the column changed, Invoicing's queries broke. Change control prevents this: if Invoicing had asked the Permits service, Permits could change its tables freely as long as it kept answering the same questions the same way.

If you chose C, you applied the rule as though it had been followed. Invoicing went around the gatekeeper, and owning your data only protects you when everyone else asks for it.

If you chose A, nothing checks for this, and that is why the hidden dependency is dangerous.

§6.3, *Each service owns its data*.

**9. C - Run more copies of Returns and leave Guidance and Accounts alone.**

The load is on one service. Scaling independently means you add copies of that service and nothing else.

If you chose A, using a different tech stack is also a real benefit of microservices, but it doesn't answer a traffic spike. The service has more work than one copy can handle, whatever language it is written in.

If you chose B, redeploying everything together is how a monolith works, and it scales the quiet services along with the busy one.

**10. B - Reservations**

Whether a room is free on a given night changes with every booking, and Reservations makes and cancels bookings, so it is the service that can answer that question.

If you chose A, you went by the word "room". Room Catalogue describes what a room is, and that doesn't change when someone books it. Availability is about bookings. Item location in the class activity went the same way: it sounded like a product detail, but where stock is kept is an inventory question.

§7.2, *Discussing the results*.

---

### Discussion

These are for discussion, so there is no single right wording. Each entry says what a strong answer covers.

**11. Netflix**

A strong answer links the outage to Netflix being one deployed unit: the database failed and the whole service went with it. In microservices, each service runs on its own and owns its own data. A failed database then takes down the one service that owns it, and the rest of Netflix keeps running.

Using Cassandra for some services, MySQL for others and Elasticsearch for search shows the tech-stack benefit. Each service picks the database that suits its job, because nothing outside the service can see which one it uses.

**12. Prime Video**

A strong answer puts the cost on what passed between the stages. Every stage wrote its output to S3 and the next stage downloaded it, so the video crossed the network between stages, and the coordinating service charged for every step. Across thousands of live streams, that added up. In one process, the stages hand data to each other in memory, and that costs nothing extra.

What the team gave up is independence. The stages can no longer be deployed or scaled on their own. If defect detection needs more power, the converter now has to come along with it. They did keep the stages as separate parts of the code, so the split by job is still there. Only the deployment changed.

**13. Both**

For Netflix, the characteristic is availability. A three-day outage showed that one failure could take everything down, and services that fail on their own address that.

For Prime Video, the characteristic is cost. The separate stages spent most of their money moving data between each other, and putting them in one process removed that.

A strong answer sees that the same move helped one company and hurt the other. Splitting a system up pays off when isolating failures or scaling parts separately matters most. It costs you when the parts pass so much data between them that the network becomes the expense.
