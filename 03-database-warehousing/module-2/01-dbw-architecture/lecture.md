# Data Warehouse Architecture and the Dimensional Model

> In this lesson you will follow the path data takes from the systems that run a business to the reports built on it, and name the parts of a data warehouse along the way. You will then answer one business question twice in SQL: once against a normalised operational database, and once against a star schema built from facts and dimensions.
>
> New terms get a plain-English version in brackets.

**By the end of this lesson you should be able to:**

1. **Describe** the three questions every data warehouse architecture has to answer.
2. **Describe** the four parts of a data warehouse in Kimball's architecture.
3. **Explain** the limitations of a normalised operational schema for reporting.
4. **Explain** the difference between a fact table and a dimension table.
5. **Classify** the columns of a fact table as dimension keys, measures or degenerate dimensions.
6. **Explain** how a star schema reduces the joins a report needs.

## Contents

1. [Data warehouse architecture](#1-data-warehouse-architecture)
   - [1.1 The path data takes](#11-the-path-data-takes)
   - [1.2 Inmon and Kimball](#12-inmon-and-kimball)
2. [The parts of a data warehouse](#2-the-parts-of-a-data-warehouse)
   - [2.1 From source systems to reports](#21-from-source-systems-to-reports)
   - [2.2 Data marts](#22-data-marts)
3. [One question, asked of an operational database](#3-one-question-asked-of-an-operational-database)
   - [3.1 The question](#31-the-question)
   - [3.2 The operational schema](#32-the-operational-schema)
   - [3.3 Seven joins](#33-seven-joins)
   - [3.4 Only the world as it is now](#34-only-the-world-as-it-is-now)
4. [The dimensional model](#4-the-dimensional-model)
   - [4.1 Built around the question](#41-built-around-the-question)
   - [4.2 Facts are verbs](#42-facts-are-verbs)
   - [4.3 Dimensions are nouns](#43-dimensions-are-nouns)
   - [4.4 Inside `fact_sales`](#44-inside-fact_sales)
5. [The same question, asked of a star schema](#5-the-same-question-asked-of-a-star-schema)
   - [5.1 The star](#51-the-star)
   - [5.2 Three joins](#52-three-joins)
   - [5.3 Written for reading](#53-written-for-reading)
6. [More than one star](#6-more-than-one-star)
7. [Sources](#7-sources)

## 1. Data warehouse architecture

### 1.1 The path data takes

A data warehouse brings data from many systems together in one consistent place, so it can be analysed and reported on. Its **architecture** is the path that data takes from the **source systems** *[the systems that run the business day to day, like the web shop and the tills]* to the reports, and the **shape** the data takes at each stop along the way.

Every architecture has to answer the same three questions:

1. **Where do the sources get integrated into one consistent version?**
2. **Where is the history kept?**
3. **What shape of data do users actually query?**

Integration is the job ETL does. Each source system was built for its own purpose, so each one describes the same things in its own way. Say two systems both sell a laptop, a screen and a mouse:

| Code | System A | System B |
|---|---|---|
| 1 | Laptop | Screen |
| 2 | Screen | Laptop |
| 3 | Mouse | Mouse |

Product 1 is a laptop in one system and a screen in the other. Add up "sales of product 1" across both and you get a number that means nothing. Before the data can be combined, it has to be **conformed** *[changed so that every source uses the same codes, keys and labels for the same thing]*. Somewhere along the path, the architecture has to decide where that happens.

History needs a home because the source systems don't keep it. When a customer moves, the web shop overwrites the old address with the new one. A warehouse is used to compare this year with last year, so it has to keep the old address somewhere.

The shape of the data is decided by who queries it. The people who query a warehouse are mostly not developers, so the data has to be in a shape that makes their questions easy to ask. Most of this lesson is about that shape.

### 1.2 Inmon and Kimball

There are two foundational answers to the three questions of where data is integrated, where history is kept, and what shape users query. Both come from the early days of data warehousing: Bill Inmon's *Building the Data Warehouse* was published in 1992, and Ralph Kimball's *The Data Warehouse Toolkit* in 1996.

Kimball's approach is the one most businesses use, and it's the one this module follows. Its vocabulary - facts, dimensions, star schemas - is used whichever approach a business takes, and it's what reporting tools like Power BI expect. Microsoft's own Power BI guidance sends readers to Kimball's book for the full treatment ([Understand star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)).

In practice, a real warehouse normally ends up as a combination of the two. Data lakes and the platforms built on them have also changed a lot about how warehouses are built. Both of those come later in the module.

![Board mapping the module: architecture splitting into Inmon and Kimball, then modern lakes and lakehouses, then the star schema with facts, dimensions, granularity, SCDs and measures. In the middle, the definition of architecture and the three questions about integration, history and shape. On the right, two systems numbering a laptop, screen and mouse differently](boards/01.jpeg)

[Back to contents](#contents)

## 2. The parts of a data warehouse

### 2.1 From source systems to reports

Kimball's *Toolkit* splits a warehouse into four parts, in the order the data flows through them:

```
 Operational      -->  ETL system      -->  Presentation area  -->  BI applications
 source systems        (back room)          (front room)
```

**Operational source systems** run the business. For a retailer, that means:

- the **web shop**;
- the **tills** in the physical shops;
- the **CRM** *[customer relationship management system: where the business keeps everything it knows about its customers, such as Salesforce]*;
- the **ERP** *[enterprise resource planning system: one shared database that brings a company's core business processes, such as stock, purchasing and finance, together]*.

These systems are optimised for writing *[built to record many small changes quickly and safely, such as one order at a time]*. They hold only the current state, and each one has its own idea of what a customer or a product is, the way product 1 was a laptop in one system and a screen in the other.

The **ETL system** is the **back room**. It extracts data from the sources, cleans it, conforms it, and delivers it to the next part. Users never see it. The cleaning pipeline you built in module 1 was back-room work.

The **presentation area** is the **front room**: the tables that users and reports actually query. The Kimball Group calls it "the public face of the DW/BI system; it's what business users see and work with day-to-day" ([Technical DW/BI System Architecture](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/technical-dw-bi-system-architecture/)). In Kimball's architecture, the presentation area is a **dimensional model**, built from **star schemas**.

**BI applications** sit on top. **BI** stands for **business intelligence** *[using data to make business decisions]*, and Power BI, which comes later in the course, is one of these tools. They include:

- fixed **reports** and **dashboards**, built once and looked at regularly;
- **ad hoc queries** *[queries written on the spot to answer one small question, rather than being part of a pre-made report]*;
- **data mining** *[searching large amounts of data for patterns nobody has asked about yet]*.

### 2.2 Data marts

Recall the data mart from module 1: a smaller, focused section of a warehouse that serves one area of the business, so the people in that area only see the data they need. In Kimball's terms, a **data mart** is part of the presentation area.

What counts as "one area" is where the two approaches differ:

- **Kimball** builds marts around **business processes**, such as sales or purchasing.
- **Inmon** builds marts to serve **departments**, such as finance or marketing.

A Kimball sales mart is a star schema, and a presentation area can hold several of them, one for each process.

![Board titled Parts of a data warehouse (Kimball): operational source systems, ETL system as the back room, presentation area as the front room, and BI applications, each with notes underneath. Below, the data mart as part of the presentation area, serving one area of the business, with Inmon building marts for departments](boards/02.jpeg)

[Back to contents](#contents)

## 3. One question, asked of an operational database

### 3.1 The question

A presentation area is built to answer questions about a business process. For sales, the typical question is:

> How much did we sell, of which products, in what region, to which customers, in what month?

To see why the presentation area needs a different shape from the source systems, take one concrete version of that question and try to answer it from the web shop's own database:

> **Net sales per customer region, per product category, per month, for 2025.**

### 3.2 The operational schema

The web shop runs on an **OLTP** database *[online transaction processing: a database built to handle many small reads and writes, such as placing one order]*. Recall normalisation from Database Technologies. An OLTP database is normalised, typically to **third normal form (3NF)**, so that every piece of information is stored only once. If a customer changes their email, it changes in one row and nowhere else, so the data can't contradict itself. That's how these systems keep their **data integrity** *[the data staying correct and consistent]* while thousands of writes happen every hour.

Here are the web shop's tables:

| Table | Columns |
|---|---|
| `order_line` | `order_id`, `line_no`, `product_id`, `quantity`, `unit_price`, `discount` |
| `sales_order` | `order_id`, `customer_id`, `order_date` |
| `customer` | `customer_id`, `name`, `email`, `address_id` |
| `address` | `address_id`, `street`, `postcode`, `city_id` |
| `city` | `city_id`, `name`, `region_id` |
| `region` | `region_id`, `name` |
| `product` | `product_id`, `name`, `category_id` |
| `category` | `category_id`, `name` |

An `order_line` is one line on an invoice: one product, the quantity bought and the price. A `sales_order` is the invoice itself, with its date and its customer. Everything else is reached through a foreign key.

Drawn out, each arrow goes from a foreign key (`FK`) to the table it points at:

```
+-----------------+       +-----------------+
| order_line      |       | sales_order     |       +-----------------+
+-----------------+       +-----------------+       | customer        |
| order_id    FK  |------>| order_id        |       +-----------------+
| line_no         |       | customer_id FK  |------>| customer_id     |
| product_id  FK  |       | order_date      |       | name            |
| quantity        |       +-----------------+       | email           |
| unit_price      |                                 | address_id  FK  |
| discount        |                                 +-----------------+
+-----------------+                                          |
         |                                                   v
         v                                          +-----------------+
+-----------------+                                 | address         |
| product         |                                 +-----------------+
+-----------------+                                 | address_id      |
| product_id      |                                 | street          |
| name            |                                 | postcode        |
| category_id FK  |                                 | city_id     FK  |
+-----------------+                                 +-----------------+
         |                                                   |
         v                                                   v
+-----------------+                                 +-----------------+
| category        |                                 | city            |
+-----------------+                                 +-----------------+
| category_id     |                                 | city_id         |
| name            |                                 | name            |
+-----------------+                                 | region_id   FK  |
                                                    +-----------------+
                                                             |
                                                             v
                                                    +-----------------+
                                                    | region          |
                                                    +-----------------+
                                                    | region_id       |
                                                    | name            |
                                                    +-----------------+
```

Each table holds one kind of thing and nothing else. A customer's region isn't stored on the customer. It's three tables away, through the address and the city.

### 3.3 Seven joins

The numbers you want to add up are in `order_line`. Start there and look for each part of the question.

The **category** is two joins away: `order_line` has a `product_id`, and `product` has a `category_id`.

The **region** is much further. `order_line` doesn't know the customer, so you go to `sales_order`, which also has the date. From there, `customer` gives you an `address_id`, `address` gives you a `city_id`, and `city` gives you a `region_id`. That's five joins.

```
order_line --> sales_order --> customer --> address --> city --> region
     |
     +-------> product --> category
```

So the query has to walk both paths:

```sql
SELECT r.name                AS region,
       cat.name              AS category,
       MONTH(o.order_date)   AS month,
       SUM(ol.quantity * ol.unit_price - ol.discount) AS net_sales
FROM order_line ol
JOIN sales_order o  ON o.order_id      = ol.order_id
JOIN customer c     ON c.customer_id   = o.customer_id
JOIN address a      ON a.address_id    = c.address_id
JOIN city ci        ON ci.city_id      = a.city_id
JOIN region r       ON r.region_id     = ci.region_id
JOIN product p      ON p.product_id    = ol.product_id
JOIN category cat   ON cat.category_id = p.category_id
WHERE o.order_date >= '2025-01-01' AND o.order_date < '2026-01-01'   -- for 2025
GROUP BY r.name, cat.name, MONTH(o.order_date);                       -- per region, per category, per month
```

That's seven joins. Four of them - `customer`, `address`, `city` and `product` - are there only to get from one table to the next. The report doesn't use a single column from them.

The query also has to do work that every other sales report will repeat. It calculates net sales from quantity, price and discount, and it works out the month from a raw date. If two analysts calculate net sales slightly differently, their reports won't agree.

### 3.4 Only the world as it is now

There's a worse problem than the joins: the answer is wrong.

`customer.address_id` points at where the customer lives *today*. Say a customer called Ana lived in Bergen all through 2025, then moved to Oslo in March 2026. The web shop updates her address, because that's where her next order should be sent. But now every one of her 2025 purchases joins through to Oslo, and the report counts them under Oslo's region.

Nobody made a mistake. The OLTP database was built to describe the world as it is right now, so it has no record that she ever lived in Bergen. That's the right behaviour for shipping her next parcel, and the wrong behaviour for a report about last year. Keeping that history is what **slowly changing dimensions** are for, later in the module.

So a normalised operational schema can answer the question, but only by joining many tables, and only as the world looks today.

![Board titled Presentation area to dimensional model: the sales question, the normalised OLTP schema with order_line, sales_order, customer, address, city, region, product and category, the join paths counted as 2 and 5 joins for 7 in total, and the note that the address only keeps the latest value, so a customer who moved from Bergen to Oslo has old sales treated as Oslo](boards/03.jpeg)

[Back to contents](#contents)

## 4. The dimensional model

### 4.1 Built around the question

A **dimensional model** reorganises the data around the question instead. It's designed with reporting in mind, the way the OLTP schema was designed with writing in mind. Databases built for this kind of work are called **OLAP** *[online analytical processing: a database built for reporting and analysis, where reading large amounts of data matters far more than writing]*.

Take the sales question, "How much did we sell, of which products, in what region, in what month?", and split it in two:

- **"How much did we sell?"** asks for a number you can add up.
- **"Which products, which regions, which month?"** are the ways you want to break that number down.

A dimensional model gives each half its own kind of table: **fact tables** hold the numbers, and **dimension tables** hold the ways of breaking them down.

### 4.2 Facts are verbs

A **fact** is something that happened. Each row of a fact table records one **business event** *[one thing that happened in the business, at a point in time]*, together with the numbers that describe it. Those numbers are called **measures** *[the numeric values recorded about an event, such as a quantity or an amount]*.

For a sale, one row is one sale, and its measures are the quantity sold and the amount paid. Other business events give other fact tables: a purchase from a supplier, or a stock count in a shop.

A useful test is that facts are **verbs**. A sale, a purchase and a stock count are all things that *happen*. If you can't put the thing in a sentence as something that happened, it isn't a fact.

Microsoft's definition says the same thing: "Fact tables store observations or events, and can be sales orders, stock balances, exchange rates, temperatures, and more" ([Understand star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)).

### 4.3 Dimensions are nouns

A **dimension** describes the event. It holds the **context** of a fact: the **who, what, where and when**. Who bought it? The customer. What did they buy? The product. Where? On the web shop, or at a till. When? On a date.

So dimensions are **nouns**: customer, product, channel, date. Each row of a dimension table describes one thing - one customer, one product, one day.

The descriptive columns on a dimension, such as the customer's region or the product's category, are what you **filter** by and **group** by in a report. In SQL, that's the `WHERE` and the `GROUP BY`. "For 2025" is a filter on the date dimension. "Per region" is a grouping on the customer dimension. In Microsoft's words: "Dimension tables enable *filtering* and *grouping*. Fact tables enable *summarization*" ([Understand star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)).

![Board titled Presentation area to dimensional model: the question split into how much did we sell, a number you can add up, and which products, regions and months, the ways to break it down. A fact is something that happened, one sale per row, a verb, with numeric measures. A dimension describes the event, the who, what, where and when, used to filter with WHERE and group with GROUP BY, and is a noun](boards/04.jpeg)

### 4.4 Inside `fact_sales`

Here is the fact table for sales, one row per sale:

| `fact_sales` column | What it is |
|---|---|
| `date_key` | Foreign key to `dim_date` - **when** |
| `customer_key` | Foreign key to `dim_customer` - **who** |
| `product_key` | Foreign key to `dim_product` - **what** |
| `channel_key` | Foreign key to `dim_channel` - **where** (the web shop or a till) |
| `order_no` | The original order number, kept for tracing a row back to the source system |
| `quantity` | Measure |
| `net_amount` | Measure |

The columns come in three kinds:

- **Foreign keys to dimensions.** Each one points at a row in a dimension table, and answers one of who, what, where or when.
- **Measures.** The numbers you add up. Notice that `net_amount` is stored already calculated, so no report has to work it out from price and discount.
- **The order number.** It describes the sale, so it's a dimension, but there's nothing else to say about an order number, so it doesn't get a table of its own. A dimension that lives on the fact table like this is called a **degenerate dimension**.

Here's what a few rows might look like, with one row from each dimension it points at:

| `date_key` | `customer_key` | `product_key` | `channel_key` | `order_no` | `quantity` | `net_amount` |
|---|---|---|---|---|---|---|
| 20250314 | 1042 | 7 | 1 | SO-10233 | 2 | 1598.00 |
| 20250314 | 1187 | 3 | 2 | T-55120 | 1 | 249.00 |
| 20250315 | 1042 | 12 | 1 | SO-10251 | 1 | 4990.00 |

`dim_customer`:

| `customer_key` | `name` | `city` | `region` |
|---|---|---|---|
| 1042 | Ana | Bergen | Vestland |

`dim_product`:

| `product_key` | `name` | `category` |
|---|---|---|
| 7 | Keyboard | Accessories |

`dim_channel`:

| `channel_key` | `name` |
|---|---|
| 1 | Web shop |

`dim_date`:

| `date_key` | `date` | `month` | `year` |
|---|---|---|---|
| 20250314 | 2025-03-14 | 3 | 2025 |

Read the first fact row through its keys: on 14 March 2025, Ana, from the Vestland region, bought two keyboards on the web shop for 1598.00. The fact row itself is nothing but keys and numbers. All the words are in the dimensions.

That's why the two kinds of table have such different shapes. Fact tables are **long and narrow**: millions of rows, because every sale is a row, and only a few columns, mostly keys and numbers. Dimension tables are **short and wide**: thousands of rows, because a business has far fewer customers than sales, and many columns of descriptive text.

![Board titled Presentation area to dimensional model, linked to OLAP for reporting and analytics, where queries outnumber writes. Fact tables are long and narrow, dimensions short and wide. The fact_sales columns are listed with their meaning: foreign keys to dim_date, dim_customer, dim_product and dim_channel, order number kept for auditing as a degenerate dimension, and quantity and net_amount as numeric measures](boards/05.jpeg)

[Back to contents](#contents)

## 5. The same question, asked of a star schema

### 5.1 The star

Recall the star schema from module 1: a fact table in the middle, with its dimension tables around it. That's exactly what `fact_sales` and its four dimensions make:

```
            dim_channel          dim_date
                     \          /
                      fact_sales
                     /          \
            dim_product          dim_customer
```

Every dimension joins straight to the fact. Each dimension is a single table with everything about that thing on it, so the hierarchies that took several tables in the OLTP schema are already flattened. `dim_customer` has `region` as a column, `dim_product` has `category`, and `dim_date` has `month` and `year`.

### 5.2 Three joins

Go through the question one part at a time, and each part points at exactly one dimension:

| Part of the question | What it does | Where it comes from |
|---|---|---|
| Net sales | Sum it | `fact_sales.net_amount` |
| Per customer region | Group by | One join to `dim_customer` |
| Per product category | Group by | One join to `dim_product` |
| Per month | Group by | One join to `dim_date` |
| For 2025 | Filter | `dim_date` again, already joined |

So net sales per customer region, per product category, per month, for 2025, looks like this against the star:

```sql
SELECT c.region,
       p.category,
       d.month,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_customer c ON c.customer_key = f.customer_key
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE d.year = 2025                       -- for 2025
GROUP BY c.region, p.category, d.month;   -- per region, per category, per month
```

That's three joins instead of seven: one for each way the question breaks the number down. The rule holds for any question. Break sales down by product only, and it's one join. Add region, and it's two. Every join goes straight from the fact to a dimension, and none of them is a stepping stone to another table.

Breaking a number down further like this is often called **slicing** it *[cutting the total into pieces along a dimension, such as by region or by channel]*. If the sales team later wants the same report per channel as well, it's one more join to `dim_channel` and one more column in the `GROUP BY`.

The query has also stopped doing repeated work. Net sales is a stored measure, and the month is a column on `dim_date`, so every report that uses them gets the same answer.

### 5.3 Written for reading

The two schemas hold the same sales, shaped for opposite jobs. The OLTP schema makes *writing* one order safe and cheap, because nothing is stored twice. The dimensional schema makes *reading* millions of orders, broken down several ways, simple, because the tables are arranged the way the questions are asked.

Most people who build reports aren't developers. "Sales, by customer, by product, by month" maps directly onto a fact and three dimensions, which non-technical users understand far more easily than a chain of seven joins.

> A normalised schema is shaped for writing one order. A dimensional schema is shaped for reading all of them.

[Back to contents](#contents)

## 6. More than one star

`fact_sales` answers questions about selling. A business has other processes too: buying stock from suppliers, and counting what's on the shelves. Each process gets its own fact table, such as `fact_purchase` and `fact_stock`, and so its own star.

Those stars don't each need their own copy of every dimension. A purchase happens on a date just as a sale does, so `fact_purchase` can use the same `dim_date` as `fact_sales`. It also brings dimensions of its own, such as `dim_supplier`. A dimension that is shared between several fact tables like this is called a **conformed dimension**.

So a presentation area isn't one star. It's many stars, one per business process, joined up through the dimensions they share. Kimball put it this way in 1997: "The data warehouse is nothing more than the union of all the data marts" (quoted in Inmon, [Data Mart Does Not Equal Data Warehouse](https://web.archive.org/web/20110420134556/http://csis.bits-pilani.ac.in/faculty/goel/Data%20Warehousing/Articles/Data%20Marts/dataWarehouse_com%20%20Article_DM%20VS%20DW.htm)). Conformed dimensions, and the history that slowly changing dimensions keep, come back later in the module.

![Board titled Presentation area to dimensional model: the question mapped to sum fact_sales, one join each to dim_customer, dim_product and dim_date, with 3 joins versus 7. The star with fact_sales in the middle and dim_channel, dim_date, dim_product and dim_customer around it. In green, fact_purchase with dim_supplier and fact_stock sharing dim_date, labelled shared dimension between facts, conformed dimension. Underneath: non-technical people understand this better](boards/06.jpeg)

[Back to contents](#contents)

## 7. Sources

1. Kimball, R. and Ross, M., *The Data Warehouse Toolkit*, 3rd ed., Wiley, 2013. Chapters 1 and 2 cover the parts of a warehouse and the dimensional modelling vocabulary used in this lesson.
2. Kimball Group, [Technical DW/BI System Architecture](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/technical-dw-bi-system-architecture/)
3. Microsoft Learn, [Understand star schema and the importance for Power BI](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)
4. Inmon, W., [Data Mart Does Not Equal Data Warehouse](https://web.archive.org/web/20110420134556/http://csis.bits-pilani.ac.in/faculty/goel/Data%20Warehousing/Articles/Data%20Marts/dataWarehouse_com%20%20Article_DM%20VS%20DW.htm), DM Review, 2000 (archived copy)
5. Inmon, W., *Building the Data Warehouse*, Wiley, 1992.

[Back to contents](#contents)
