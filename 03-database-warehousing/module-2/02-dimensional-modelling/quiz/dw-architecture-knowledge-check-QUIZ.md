# Data Warehouse Architecture - Knowledge Check

This quiz is based on the Data Warehouse Architecture and the Dimensional Model lesson, with the questions grouped into topics.

## Architecture and the Parts of a Warehouse

**1.** A hotel chain's booking system stores each guest's current loyalty tier. When a guest moves up from Classic to Premier, the system overwrites Classic with Premier. The warehouse team wants last year's reports to still show which guests were Classic at the time. Which of the three questions every warehouse architecture has to answer are they working on?

- **A.** Where do the sources get integrated into one consistent version?
- **B.** Where is the history kept?
- **C.** What shape of data do users actually query?
- **D.** Which BI application will the reports be built in?

**2.** A car rental company has two booking systems. In one, vehicle class `C` means compact. In the other, `C` means convertible. Before rentals from both systems can be added up per vehicle class, the codes have to agree. In which part of a Kimball warehouse does that happen?

- **A.** The presentation area, where users query the data
- **B.** The operational source systems, where bookings are made
- **C.** The BI applications, where the report is built
- **D.** The ETL system, in the back room

**3.** After an unusually cold week in October, a manager at an energy company asks how many households used more than twice their normal amount of electricity. An analyst writes a query that afternoon to answer it. Which kind of BI application is this?

- **A.** An ad hoc query
- **B.** Data mining
- **C.** A fixed report
- **D.** A dashboard

**4.** A university's warehouse has one data mart for course enrolments and another for tuition payments. Each mart covers one business process, whichever department wants to use it. Which statement describes these marts?

- **A.** They follow Inmon, who builds marts to serve departments such as finance.
- **B.** They follow Kimball, who builds marts to serve departments such as finance.
- **C.** They follow Kimball, who builds marts around processes such as sales.
- **D.** They sit in the back room, where users never see them.

---

## Operational Schemas

**5.** A streaming service's `subscriber` table holds each subscriber's current plan. In March 2026, a subscriber upgraded from Basic to Premium. An analyst runs revenue per plan for 2025 straight from this operational database. What happens to that subscriber's 2025 payments?

- **A.** They are counted under Premium, though they were paid on Basic.
- **B.** They are split between Basic and Premium by date.
- **C.** They are left out, because the plan has changed.
- **D.** They are counted under Basic, because they are older than the change.

**6.** A courier company's operational database has these tables:

| Table | Columns |
|---|---|
| `delivery` | `delivery_id`, `shipment_id`, `delivered_at`, `weight_kg` |
| `shipment` | `shipment_id`, `customer_id` |
| `customer` | `customer_id`, `name`, `address_id` |
| `address` | `address_id`, `street`, `zone_id` |
| `zone` | `zone_id`, `name` |

An analyst wants the total weight delivered per zone. The query starts at `delivery` and joins its way to `zone`. Which tables are joined only to get from one table to the next?

- **A.** `zone` only
- **B.** `customer` and `address`
- **C.** `shipment`, `customer`, `address` and `zone`
- **D.** `shipment`, `customer` and `address`

---

## Facts and Dimensions

**7.** A city library wants to analyse how its collection is used. Its systems hold books, members, branches and loans. Which of these should become a fact table?

- **A.** Books
- **B.** Loans
- **C.** Members
- **D.** Branches

**8.** A hospital's warehouse has a table with one row per ward. Its columns are the ward's name, floor, specialty and number of beds. What kind of table is this?

- **A.** A fact table, because number of beds is a measure
- **B.** A fact table, because each row records a business event
- **C.** A dimension table, because each row describes one thing
- **D.** A degenerate dimension, because it has no fact table of its own

**9.** A concert promoter's fact table has one row per booking, with these columns: `date_key`, `event_key`, `customer_key`, `booking_no`, `seats`, `amount`. Which column is a degenerate dimension?

- **A.** `booking_no`
- **B.** `event_key`
- **C.** `seats`
- **D.** `customer_key`

**10.** A bike-share company has a star schema with `fact_trip` in the middle and `dim_date`, `dim_station`, `dim_member` and `dim_bike` around it. `dim_member` has a `plan` column. The question is: number of trips per start station, per month, in 2025, for members on an annual plan. How many joins does the query need?

- **A.** Two
- **B.** Three
- **C.** Four
- **D.** Five
