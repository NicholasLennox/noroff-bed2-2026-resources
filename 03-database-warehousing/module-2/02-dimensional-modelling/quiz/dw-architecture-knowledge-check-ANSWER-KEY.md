# Data Warehouse Architecture - Knowledge Check - Answer Key

### Architecture and the Parts of a Warehouse

**1. B - Where is the history kept?**

The booking system only holds the current tier, so Classic disappears the moment it's overwritten. Keeping last year's tier for last year's reports is a question of where the history lives.

If you chose A, you read the overwrite as two versions that need combining. Integration is about several sources disagreeing with each other. Here there's one source, and it simply forgets.

§1.1, *The path data takes*.

**2. D - The ETL system, in the back room**

Making every source use the same codes for the same thing is conforming, and conforming is one of the ETL system's jobs, along with extracting and cleaning. Users never see it happen.

If you chose B, you wanted to fix it at the source. Each source system was built for its own purpose, and the warehouse takes them as they are.

If you chose C, a report built on unconformed data would have to fix the codes itself, and every other report would have to do the same.

§2.1, *From source systems to reports*.

**3. A - An ad hoc query**

The query was written on the spot to answer one specific question that someone asked. That's what makes it ad hoc: it isn't part of a report built in advance.

If you chose B, you were thinking of data mining as any query that searches a lot of data. Data mining looks for patterns nobody has asked about yet. Here the manager asked a precise question first.

If you chose C, a fixed report is built once and looked at regularly. This query was written for one afternoon.

**4. C - They follow Kimball, who builds marts around processes such as sales.**

Enrolments and tuition payments are business processes, and each mart covers one process no matter which department uses it. Kimball builds marts that way.

If you chose B, you had the right name but mixed up what the two build their marts around. Building marts to serve departments is Inmon's approach.

If you chose D, data marts are part of the presentation area, which is the front room that users query.

§2.2, *Data marts*.

---

### Operational Schemas

**5. A - They are counted under Premium, though they were paid on Basic.**

The `subscriber` table only holds the plan the subscriber has today. Every past payment reaches the plan through that row, so all of 2025 is counted under Premium. Nobody made a mistake. The database describes the world as it is now.

If you chose D, you assumed the database remembers what the plan used to be. An operational database overwrites the old value, so there's nothing left to say Basic.

If you chose B, splitting by date would need a record of when the plan changed. The operational database doesn't keep one.

§3.4, *Only the world as it is now*.

**6. D - `shipment`, `customer` and `address`**

The report needs `weight_kg` from `delivery` and the zone's `name` from `zone`. Nothing is used from the three tables in between. They're there only because each one holds the key to the next.

If you chose B, you counted `shipment` as useful because `delivery` points straight at it. No column from `shipment` appears in the report, so it's a stepping stone too.

If you chose C, `zone` is the one table the query can't do without, because the zone's name is what the report groups by.

§3.3, *Seven joins*.

---

### Facts and Dimensions

**7. B - Loans**

A fact is something that happens, and a loan is the only event on the list: a member borrows a book from a branch on a date. Books, members and branches are the things involved in that event, so they become dimensions.

If you chose A, you were probably thinking "analyse the collection" means a books table. A book doesn't happen. To analyse books, you look at the event that involves them, which is the loan.

§4.2, *Facts are verbs*.

**8. C - A dimension table, because each row describes one thing**

Each row is one ward, with columns that describe it. Nothing happens in this table, so it's a dimension. Its columns are what you'd filter and group by, such as admissions per specialty or per floor.

If you chose A, you saw a number and called it a measure. A measure is a number recorded about an event. The number of beds describes the ward, the same way a product's category describes the product.

If you chose D, a degenerate dimension is a single column that lives on the fact table, like an order number.

§4.3, *Dimensions are nouns*.

**9. A - `booking_no`**

The booking number describes the booking, but there's nothing else to say about it, so it has no dimension table of its own. It stays on the fact table so each row can be traced back to the source system. That makes it a degenerate dimension.

If you chose B or D, those columns are foreign keys to dimension tables, `dim_event` and `dim_customer`.

If you chose C, `seats` is a measure. It's a number you add up.

§4.4, *Inside `fact_sales`*.

**10. B - Three**

Each part of the question points at one dimension. "Per start station" is one join to `dim_station`. "Per month" and "in 2025" both use `dim_date`, which only needs joining once. "Members on an annual plan" is a filter on `dim_member`. `dim_bike` isn't used.

If you chose A, you remembered the groupings but forgot that a filter needs its dimension joined too.

If you chose D, `plan` is a column on `dim_member`, so it doesn't need its own table. In a star, every dimension joins straight to the fact.

§5.2, *Three joins*.
