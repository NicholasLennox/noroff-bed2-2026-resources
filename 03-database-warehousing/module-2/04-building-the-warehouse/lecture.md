# Building the Warehouse

> In this lesson you will start SQL Server with Docker Compose, create two source systems - a web shop and a till system - and build a data warehouse from them in T-SQL. You will generate a date dimension with a loop, load three more dimensions from the sources, load every sale from both systems into one fact table, check that nothing went missing, and then query the result.
>
> New terms get a plain-English version in brackets.

**By the end of this lesson you should be able to:**

1. **Compare** two source systems to find the columns that identify the same customer, product and sale.
2. **Use** a T-SQL loop to populate a calendar date dimension.
3. **Use** a `LEFT JOIN` to combine customers from two source systems into one dimension.
4. **Explain** why a sale with no known customer points at an Unknown row in the customer dimension.
5. **Use** joins to look up surrogate keys while loading a fact table.
6. **Assess** whether a fact load is complete by comparing its totals with the sources.
7. **Use** `GROUP BY` queries on a star schema to answer a business question.

## Contents

1. [Two systems, one question](#1-two-systems-one-question)
   - [1.1 Starting the server](#11-starting-the-server)
   - [1.2 The sources](#12-the-sources)
   - [1.3 Where the two systems meet](#13-where-the-two-systems-meet)
   - [1.4 The question](#14-the-question)
2. [The star](#2-the-star)
   - [2.1 Grain and dimensions](#21-grain-and-dimensions)
   - [2.2 The dimension columns](#22-the-dimension-columns)
   - [2.3 The fact columns](#23-the-fact-columns)
3. [Loading the dimensions](#3-loading-the-dimensions)
   - [3.1 The warehouse database](#31-the-warehouse-database)
   - [3.2 dim_date](#32-dim_date)
   - [3.3 dim_channel](#33-dim_channel)
   - [3.4 dim_customer](#34-dim_customer)
   - [3.5 dim_product](#35-dim_product)
4. [Loading the facts](#4-loading-the-facts)
   - [4.1 The fact table](#41-the-fact-table)
   - [4.2 Online sales](#42-online-sales)
   - [4.3 Till sales with a loyalty card](#43-till-sales-with-a-loyalty-card)
   - [4.4 Till sales without a card](#44-till-sales-without-a-card)
5. [Using the warehouse](#5-using-the-warehouse)
   - [5.1 Checking the load](#51-checking-the-load)
   - [5.2 Answering the question](#52-answering-the-question)
   - [5.3 Smaller reports](#53-smaller-reports)
6. [What you learned](#6-what-you-learned)
7. [Sources](#7-sources)

## 1. Two systems, one question

### 1.1 Starting the server

Everything in this lesson runs on one SQL Server, in a container started from `class-demo/docker-compose.yml`:

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2025-latest
    container_name: bed2-sqlserver
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "YourStr0ng!Passw0rd"   # local teaching password only
      MSSQL_PID: "Developer"                      # free, full-featured, non-prod
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql                 # keeps the databases between down and up
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"$$MSSQL_SA_PASSWORD\" -C -Q 'SELECT 1' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

volumes:
  mssql-data:
    name: bed2-sqlserver-data
```

From the `class-demo` folder, start it:

```bash
docker compose up -d
```

Then connect from VS Code with the SQL Server extension, as `sa` on `localhost`, the same way you connected to SQL Server in Database Technologies.

Next, open `class-demo/sources.sql` and run the whole file. It creates two databases and fills them with a year of sales:

- `online_store` is the web shop's system.
- `tills` is the till system in the physical shops.

They stand in for two separate operational systems, so they don't share any keys. The file drops and recreates both databases, so you can run it again any time you want clean sources.

### 1.2 The sources

Here's what each system holds. Ana Hansen, cola and Ana's web order `W-8812` from the last two lessons are all in there.

`online_store`:

| Table | Rows | Columns |
|---|---|---|
| `customer` | 13 | `customer_id`, `first_name`, `last_name`, `email`, `city`, `created_at`, `updated_at` |
| `product` | 14 | `sku`, `name`, `brand`, `category`, `department`, `list_price` |
| `orders` | 240 | `order_id`, `order_no`, `customer_id`, `order_date` |
| `order_line` | 511 | `order_id`, `line_no`, `sku`, `quantity`, `unit_price`, `discount` |

`tills`:

| Table | Rows | Columns |
|---|---|---|
| `store` | 3 | `store_id`, `name`, `city` |
| `loyalty_member` | 13 | `card_no`, `full_name`, `email`, `city`, `joined_on` |
| `receipt` | 360 | `receipt_id`, `receipt_no`, `sold_at`, `card_no`, `store_id` |
| `receipt_line` | 944 | `receipt_id`, `line_no`, `sku`, `quantity`, `line_total` |

Because both databases live on the same server, one query can read from both of them, and from the warehouse you're about to build. You name a table with its database in front: `online_store.dbo.customer`, `tills.dbo.receipt`.

> That's called a **three-part name** *[database, then schema, then table, separated by dots; `dbo` is SQL Server's default schema]*.

So every load in this lesson is a single statement: `INSERT INTO` a warehouse table, `SELECT` from the sources.

### 1.3 Where the two systems meet

Where the two systems agree and where they differ is the integration job the warehouse has to do.

**Customers.** The web shop knows Ana as customer `88213`, with `first_name` Ana and `last_name` Hansen. The tills know her as loyalty card `L-55190`, with one `full_name`, Ana Hansen. Neither key means anything to the other system. What they share is her email, `ana.hansen@example.no`. So the email is what links a web shop customer to a loyalty member.

Not everybody is in both systems. There are 18 people in total: 8 shop in both places, 5 only online and 5 only at the tills. Lars Johansen, card `L-60321`, has never bought anything online.

**Customers with no card.** Look at `tills.dbo.receipt` and you'll see rows where `card_no` is `NULL`:

| `receipt_no` | `sold_at` | `card_no` | `store_id` |
|---|---|---|---|
| T-0441 | 2025-03-14 17:42 | L-60321 | 2 |
| T-6443 | 2025-03-15 08:35 | NULL | 3 |

That's somebody who paid at the till without scanning a loyalty card. It's an ordinary sale, and 129 of the 360 receipts are like that. The sale happened, but nobody knows who made it.

**Products.** Only the web shop has a product table. A till receipt line just stores the SKU, and it's the same SKU the web shop uses: cola is `4410` in both. So the web shop's `product` table describes every product sold in either system.

**Amounts.** The two systems store the money differently. A web shop line stores the `quantity`, the `unit_price` on the day, and a `discount`, which is money off the whole line. A till line stores `line_total`, which is what was actually paid for the line. To get the same number out of both, the web shop line needs a calculation:

```
quantity * unit_price - discount
```

Order `W-8784` has one bottle of laundry detergent at 89.00 with 8.90 off, so the line is worth 1 × 89.00 − 8.90 = 80.10. On the tills, Lars's six colas on receipt `T-0441` simply say 120.00.

**Dates.** Orders have an `order_date`, which is a date. Receipts have `sold_at`, which is a date and a time.

**Stores.** A receipt has a `store_id`, so the tills know which shop a sale happened in: Bergen Sentrum, Oslo Grünerløkka or Trondheim Solsiden. The web shop isn't a shop anyone walks into, so it has no store at all.

### 1.4 The question

A warehouse is built to answer questions. This one starts with a single question from the business:

> Net sales per customer city, per product category, per channel, per month, for 2025.

**Net sales** is the money actually taken, after discounts. Everything else in the question is a way of breaking that number down, and each one lives somewhere in the sources: the customer's city on the customer, the category on the product, the month on the order or receipt date, and the channel - web or till - on which system the sale came from.

![Board showing the source tables. On the left, the online store: order_line, orders, customer and product, with sku, customer_id, order_date, email and category circled, quantity, unit_price and discount marked net sales, first_name and last_name marked to merge, and an "online channel?" question. On the right, the till system (POS): receipt_line, receipt, loyalty_member and store, with sold_at marked dim_date, card_no and email marked dim_customer, store marked dim_channel, and quantity and line_total marked net sales. At the top: Q: net sales per customer city, per product category, per month, for 2025. Grain: order line, product and order, which is receipt_line and order_line](boards/01-sources.jpeg)

[Back to contents](#contents)

## 2. The star

### 2.1 Grain and dimensions

Recall that the grain is declared first, because it decides which dimensions a fact table can have. The atomic grain here is **one product on one order**: an `order_line` in the web shop, a `receipt_line` at the tills. Both systems record sales at that level, so the warehouse keeps that level too.

The dimensions come straight out of the question. Each "per" is something a report needs to group by, so each one needs a dimension that holds it:

| The question says | Dimension | Column |
|---|---|---|
| per customer city | `dim_customer` | `city` |
| per product category | `dim_product` | `category` |
| per channel | `dim_channel` | `channel` |
| per month | `dim_date` | `month` |

### 2.2 The dimension columns

Each dimension holds its surrogate key, the natural keys from the sources, and the descriptive columns a report might group or filter by.

| Table | Columns |
|---|---|
| `dim_channel` | `channel_key`, `channel`, `store_id`, `store_name`, `store_city` |
| `dim_product` | `product_key`, `sku`, `name`, `brand`, `category`, `department` |
| `dim_customer` | `customer_key`, `webshop_id`, `loyalty_card`, `name`, `email`, `city` |
| `dim_date` | `date_key`, `full_date`, `day`, `day_name`, `day_of_week`, `week`, `month`, `month_name`, `quarter`, `year`, `is_weekend` |

`dim_channel` says whether a sale was on the web or at a till, and for a till sale, which store. `channel` holds `Web` or `Till`.

`dim_customer` has both natural keys, `webshop_id` and `loyalty_card`, because one person can be known to both systems. Ana's row will hold `88213` and `L-55190`. Lars's row will hold only `L-60321`, with `NULL` for the web shop id.

`dim_date` is the longest by far. Most of its columns can be worked out from the date itself, but storing them means a report can say `GROUP BY month_name` instead of calling date functions in every query.

![Board titled Dimensional model, listing the columns of dim_channel, with channel marked web or till and store_city circled; dim_product, with category marked; dim_customer, with webshop_id and loyalty_card both nullable, the unknown customer when loyalty_card is null marked as key 1, and city circled; and dim_date, with date_key as 20250314. On the right, fact_sales at order-line grain with date_key, customer_key, product_key, channel_key, order_no, quantity and net_amount, with product_key and order_no marked as the primary key, and net_amount as qty * unit_price - discount for the web shop and line_total for the till](boards/02-dimensional-model.jpeg)

### 2.3 The fact columns

`fact_sales` has one surrogate key for each of the four dimensions, the order number, and two measures:

| Column | What it is |
|---|---|
| `date_key` | The day of the sale, as an integer such as `20250314` |
| `customer_key` | Who bought it |
| `product_key` | What was bought |
| `channel_key` | Web, or which store |
| `order_no` | The order or receipt number, the degenerate dimension |
| `quantity` | How many |
| `net_amount` | What was paid for the line |

`order_no` and `product_key` together are the primary key, because together they are the grain: one product on one order.

Each fact column has to be filled from both systems. This table is the plan for the loads in section 4:

| `fact_sales` column | From `online_store` | From `tills` |
|---|---|---|
| `date_key` | `orders.order_date` as `20250314` | `receipt.sold_at` as `20250314` |
| `customer_key` | `orders.customer_id`, looked up on `dim_customer.webshop_id` | `receipt.card_no`, looked up on `dim_customer.loyalty_card` |
| `product_key` | `order_line.sku`, looked up on `dim_product.sku` | `receipt_line.sku`, looked up on `dim_product.sku` |
| `channel_key` | the Web row | `receipt.store_id`, looked up on `dim_channel.store_id` |
| `order_no` | `orders.order_no` | `receipt.receipt_no` |
| `quantity` | `order_line.quantity` | `receipt_line.quantity` |
| `net_amount` | `quantity * unit_price - discount` | `line_total` |

[Back to contents](#contents)

## 3. Loading the dimensions

Recall the load order: the fact table stores surrogate keys, and a surrogate key can only be looked up once its dimension row exists. So the dimensions are created and loaded first, one at a time, and the fact table comes last.

### 3.1 The warehouse database

The warehouse is a third database on the same server, `sales_dw`:

```sql
USE master;
GO

IF DB_ID('sales_dw') IS NOT NULL
BEGIN
    ALTER DATABASE sales_dw SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE sales_dw;
END
GO

CREATE DATABASE sales_dw;
GO

USE sales_dw;
GO
```

The `IF` block drops `sales_dw` if it already exists, the same way `sources.sql` does for the sources, so you can rerun the build from scratch. Everything from here on runs inside `sales_dw`, so a warehouse table needs no prefix and a source table needs its three-part name.

### 3.2 `dim_date`

No source system has a calendar. The web shop and the tills only store the dates something happened on, and a month with no sales wouldn't appear in either. So the warehouse makes its own calendar: one row for every day, whether anything was sold that day or not.

```sql
CREATE TABLE dim_date (
    date_key    INT          NOT NULL PRIMARY KEY,   -- 20250314
    full_date   DATE         NOT NULL,
    day         TINYINT      NOT NULL,
    day_name    NVARCHAR(10) NOT NULL,
    day_of_week TINYINT      NOT NULL,               -- 1 = Monday, 7 = Sunday
    week        TINYINT      NOT NULL,
    month       TINYINT      NOT NULL,
    month_name  NVARCHAR(10) NOT NULL,
    quarter     TINYINT      NOT NULL,
    year        SMALLINT     NOT NULL,
    is_weekend  BIT          NOT NULL
);
GO
```

`date_key` has no `IDENTITY`. Recall that `dim_date` is the one dimension without a made-up surrogate key: its key is the date written as an integer, because a date never changes and no two sources disagree about it.

To fill it, a `WHILE` loop starts at 1 January 2025 and inserts one row per day, up to the end of 2026:

```sql
SET NOCOUNT ON;    -- otherwise the loop prints "(1 row affected)" 730 times
SET DATEFIRST 1;   -- weeks start on Monday: Monday is day 1, Sunday is day 7

DECLARE @d DATE = '2025-01-01';

WHILE @d <= '2026-12-31'
BEGIN
    INSERT INTO dim_date (date_key, full_date, day, day_name, day_of_week, week,
                          month, month_name, quarter, year, is_weekend)
    VALUES (
        YEAR(@d) * 10000 + MONTH(@d) * 100 + DAY(@d),   -- 2025-03-14 becomes 20250314
        @d,
        DAY(@d),
        DATENAME(WEEKDAY, @d),
        DATEPART(WEEKDAY, @d),
        DATEPART(ISO_WEEK, @d),
        MONTH(@d),
        DATENAME(MONTH, @d),
        DATEPART(QUARTER, @d),
        YEAR(@d),
        CASE WHEN DATEPART(WEEKDAY, @d) >= 6 THEN 1 ELSE 0 END   -- Saturday and Sunday
    );

    SET @d = DATEADD(DAY, 1, @d);
END
GO
```

Run the whole block at once. `@d` is a variable, and it only exists while the batch that declared it is running, so running the loop on its own fails.

The key is built with arithmetic. For 14 March 2025, `2025 * 10000` is 20250000, `3 * 100` is 300, and the day is 14, which adds up to 20250314.

`SET DATEFIRST 1` matters for `day_of_week` and `is_weekend`. SQL Server's default for US English counts Sunday as day 1 ([SET DATEFIRST](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-datefirst-transact-sql)), which would make Saturday day 7 and Sunday day 1, and the `>= 6` test would mark Friday and Saturday as the weekend.

That gives 730 rows. Here are three of them:

```sql
SELECT * FROM dim_date WHERE date_key BETWEEN 20250314 AND 20250316;
```

| `date_key` | `full_date` | `day` | `day_name` | `day_of_week` | `week` | `month` | `month_name` | `quarter` | `year` | `is_weekend` |
|---|---|---|---|---|---|---|---|---|---|---|
| 20250314 | 2025-03-14 | 14 | Friday | 5 | 11 | 3 | March | 1 | 2025 | 0 |
| 20250315 | 2025-03-15 | 15 | Saturday | 6 | 11 | 3 | March | 1 | 2025 | 1 |
| 20250316 | 2025-03-16 | 16 | Sunday | 7 | 11 | 3 | March | 1 | 2025 | 1 |

A calendar is the same in every warehouse, so you rarely write one from nothing. Teams keep a date dimension script like this one and reuse it, adding whatever their business needs, such as fiscal periods or public holidays. The Kimball Group's advice is to look these things up in the date dimension rather than work them out in every query: "You would never want to compute Easter in SQL" ([Calendar Date Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/calendar-date-dimension/)).

### 3.3 `dim_channel`

```sql
CREATE TABLE dim_channel (
    channel_key INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    channel     NVARCHAR(10) NOT NULL,
    store_id    INT          NULL,       -- natural key from tills.store
    store_name  NVARCHAR(50) NOT NULL,
    store_city  NVARCHAR(50) NULL
);
GO
```

`IDENTITY(1,1)` makes SQL Server hand out the surrogate keys itself: 1 for the first row inserted, 2 for the next, and so on.

The tills have a `store` table, so the three stores can be loaded with a `SELECT`. The web shop has nothing to select from, because it has no stores. So the Web row is inserted by hand, first:

```sql
INSERT INTO dim_channel (channel, store_id, store_name, store_city)
VALUES ('Web', NULL, 'Online', NULL);
```

Then the stores:

```sql
INSERT INTO dim_channel (channel, store_id, store_name, store_city)
SELECT 'Till', store_id, name, city
FROM tills.dbo.store;
GO
```

`'Till'` is a constant, so every store row gets the same `channel`. The result is four rows, with Web as key 1 and the stores as 2, 3 and 4:

| `channel_key` | `channel` | `store_id` | `store_name` | `store_city` |
|---|---|---|---|---|
| 1 | Web | NULL | Online | NULL |
| 2 | Till | 1 | Bergen Sentrum | Bergen |
| 3 | Till | 2 | Oslo Grünerløkka | Oslo |
| 4 | Till | 3 | Trondheim Solsiden | Trondheim |

The Web row has `NULL` in `store_id` and `store_city` because those columns don't apply to it: the web shop has no store number and no city. `store_name` says `Online` instead, so a report grouped by store still gets a readable label for web sales.

### 3.4 `dim_customer`

```sql
CREATE TABLE dim_customer (
    customer_key INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    webshop_id   INT           NULL,     -- natural key from online_store
    loyalty_card VARCHAR(10)   NULL,     -- natural key from tills
    name         NVARCHAR(100) NOT NULL,
    email        NVARCHAR(100) NULL,
    city         NVARCHAR(50)  NOT NULL
);
GO
```

Both natural keys allow `NULL`, because a customer can be missing from either system.

The customers go in with three inserts.

**The Unknown customer.** Think back to the till receipts with no `card_no`. Those sales still belong in `fact_sales`, but their `customer_key` can't be left empty, because every fact row has to point at a real dimension row. So the warehouse adds a customer that means "we don't know who this was", and inserts it first so it gets key 1:

```sql
INSERT INTO dim_customer (webshop_id, loyalty_card, name, email, city)
VALUES (NULL, NULL, 'Unknown', NULL, 'Unknown');
```

| `customer_key` | `webshop_id` | `loyalty_card` | `name` | `email` | `city` |
|---|---|---|---|---|---|
| 1 | NULL | NULL | Unknown | NULL | Unknown |

Every till sale without a loyalty card will point at customer 1. The Kimball Group gives the same rule: a fact table's foreign keys must never be `NULL`, so the dimension gets a default row with its own surrogate key for the unknown case ([Nulls in Fact Tables](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/fact-table-null/)).

The Unknown row and the Web row both carry `NULL`s, but they mean different things. The Web row's `store_city` is `NULL` because a city doesn't apply to the web shop. The Unknown customer does exist and does live somewhere; the warehouse just doesn't know where. That's why its `city` is the word `Unknown`, which a report can show, rather than `NULL`.

**The web shop customers.** Start with a plain `SELECT` from the web shop:

```sql
SELECT c.customer_id,
       c.first_name + ' ' + c.last_name AS name,
       c.email,
       c.city
FROM online_store.dbo.customer c;
```

That gives 13 rows, one per web shop customer. Here are two of them:

| `customer_id` | `name` | `email` | `city` |
|---|---|---|---|
| 88213 | Ana Hansen | ana.hansen@example.no | Bergen |
| 88225 | Emil Strand | emil.strand@example.no | Stavanger |

`first_name + ' ' + last_name` joins the two name columns into one, in the same shape as the tills' `full_name`. `AS name` gives the result a column name; without it, SQL Server shows the column as `(No column name)`.

Ana also has a loyalty card, and `dim_customer` is supposed to hold one row per person with both her keys on it. Nothing in this query knows about her card.

The card is in `tills.dbo.loyalty_member`, and the column the two systems share is the email. So join the loyalty members on email, and add `m.card_no` to the columns:

```sql
SELECT c.customer_id,
       m.card_no,
       c.first_name + ' ' + c.last_name AS name,
       c.email,
       c.city
FROM online_store.dbo.customer c
LEFT JOIN tills.dbo.loyalty_member m ON m.email = c.email;
```

The same two rows now look like this:

| `customer_id` | `card_no` | `name` | `email` | `city` |
|---|---|---|---|---|
| 88213 | L-55190 | Ana Hansen | ana.hansen@example.no | Bergen |
| 88225 | NULL | Emil Strand | emil.strand@example.no | Stavanger |

Ana's row has `L-55190` next to `88213`. Emil has never joined the loyalty programme, so his `card_no` is `NULL`.

It has to be a `LEFT JOIN`. Emil is one of five web shop customers with no loyalty card, so there's no member with their email. A plain `JOIN` keeps only the rows that match, and those five customers would disappear. A `LEFT JOIN` keeps every row from the left table, `customer`, and fills `card_no` with `NULL` where nothing matched. The query still returns 13 rows: 8 with a card and 5 without.

With the `SELECT` right, put the `INSERT` in front of it:

```sql
INSERT INTO dim_customer (webshop_id, loyalty_card, name, email, city)
SELECT c.customer_id,
       m.card_no,
       c.first_name + ' ' + c.last_name,
       c.email,
       c.city
FROM online_store.dbo.customer c
LEFT JOIN tills.dbo.loyalty_member m ON m.email = c.email;
```

That adds 13 rows, keys 2 to 14. Ana and Emil are now in `dim_customer`:

| `customer_key` | `webshop_id` | `loyalty_card` | `name` | `email` | `city` |
|---|---|---|---|---|---|
| 5 | 88213 | L-55190 | Ana Hansen | ana.hansen@example.no | Bergen |
| 8 | 88225 | NULL | Emil Strand | emil.strand@example.no | Stavanger |

**The till-only customers.** The 8 loyalty members who also shop online are now in `dim_customer`. The 5 who only shop at the tills, Lars among them, are not. Load the members whose email isn't in the web shop:

```sql
INSERT INTO dim_customer (webshop_id, loyalty_card, name, email, city)
SELECT NULL, m.card_no, m.full_name, m.email, m.city
FROM tills.dbo.loyalty_member m
WHERE m.email NOT IN (SELECT email FROM online_store.dbo.customer);
GO
```

That adds 5 rows, keys 15 to 19. Here are two of them, Henrik and Lars:

| `customer_key` | `webshop_id` | `loyalty_card` | `name` | `email` | `city` |
|---|---|---|---|---|---|
| 15 | NULL | L-58830 | Henrik Moen | henrik.moen@example.no | Bergen |
| 16 | NULL | L-60321 | Lars Johansen | lars.johansen@example.no | Oslo |

Their `webshop_id` is `NULL`, because neither has ever shopped online. Without the `WHERE`, Ana would get a second row here, and her till sales and web sales would be split across two customers.

`dim_customer` now has 19 rows: Unknown, plus 18 people.

### 3.5 `dim_product`

```sql
CREATE TABLE dim_product (
    product_key INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    sku         INT           NOT NULL,  -- natural key
    name        NVARCHAR(100) NOT NULL,
    brand       NVARCHAR(50)  NOT NULL,
    category    NVARCHAR(50)  NOT NULL,
    department  NVARCHAR(50)  NOT NULL
);
GO
```

Only the web shop has a product table, and the tills use the same SKUs, so one `SELECT` covers every product sold in either system:

```sql
INSERT INTO dim_product (sku, name, brand, category, department)
SELECT sku, name, brand, category, department
FROM online_store.dbo.product;
GO
```

That gives 14 products. Here are three of them:

| `product_key` | `sku` | `name` | `brand` | `category` | `department` |
|---|---|---|---|---|---|
| 3 | 4410 | Cola 0.5L | FizzCo | Beverages | Food |
| 1 | 3120 | Orange juice 1L | Sunny | Beverages | Food |
| 14 | 7220 | Laundry detergent 1kg | Rein | Cleaning | Household |

`list_price` stays behind in the source: the price a product was actually sold for is already on each sale, as `net_amount`.

[Back to contents](#contents)

## 4. Loading the facts

### 4.1 The fact table

With all four dimensions loaded, the fact table can be created:

```sql
CREATE TABLE fact_sales (
    date_key     INT           NOT NULL REFERENCES dim_date (date_key),
    customer_key INT           NOT NULL REFERENCES dim_customer (customer_key),
    product_key  INT           NOT NULL REFERENCES dim_product (product_key),
    channel_key  INT           NOT NULL REFERENCES dim_channel (channel_key),
    order_no     VARCHAR(10)   NOT NULL, -- degenerate dimension
    quantity     INT           NOT NULL,
    net_amount   DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_no, product_key)  -- the grain: one product on one order
);
GO
```

Every key is `NOT NULL` and `REFERENCES` its dimension, so SQL Server refuses a fact row whose dimension row doesn't exist yet. That's the load order enforced by the database.

The primary key is the grain written as a constraint. One row is one product on one order, so the order number and the product together identify the row.

Each load is the surrogate key pipeline written as joins. Recall that the sources send natural keys and the fact table stores surrogate keys, so the load looks up each natural key in its dimension and writes the surrogate key it finds. In SQL, every lookup is a `JOIN` to a dimension on its natural key.

There are three loads: online sales, till sales with a loyalty card, and till sales without one. Build and run them one at a time.

### 4.2 Online sales

```sql
INSERT INTO fact_sales (date_key, customer_key, product_key, channel_key, order_no, quantity, net_amount)
SELECT YEAR(o.order_date) * 10000 + MONTH(o.order_date) * 100 + DAY(o.order_date),
       dc.customer_key,
       dp.product_key,
       ch.channel_key,
       o.order_no,
       ol.quantity,
       ol.quantity * ol.unit_price - ol.discount
FROM online_store.dbo.order_line ol
JOIN online_store.dbo.orders o ON o.order_id    = ol.order_id
JOIN dim_customer dc           ON dc.webshop_id = o.customer_id
JOIN dim_product dp            ON dp.sku        = ol.sku
JOIN dim_channel ch            ON ch.channel    = 'Web';
```

Here are three of the rows it loads into `fact_sales`: Ana's order `W-8812`, and Thea's order `W-8784`, which had 8.90 off:

| `date_key` | `customer_key` | `product_key` | `channel_key` | `order_no` | `quantity` | `net_amount` |
|---|---|---|---|---|---|---|
| 20250314 | 5 | 3 | 1 | W-8812 | 2 | 50.00 |
| 20250314 | 5 | 1 | 1 | W-8812 | 1 | 39.00 |
| 20250129 | 9 | 14 | 1 | W-8784 | 1 | 80.10 |

The query starts from `order_line`, because one order line is one fact row. The join to `orders` brings in the order number, the customer and the date, which are stored once per order rather than on each line.

`date_key` needs no join. It's the same arithmetic that built the keys in `dim_date`, so Ana's `2025-03-14` becomes `20250314`, and that value is guaranteed to be in `dim_date`.

`customer_key` is a lookup. The order has `customer_id` `88213`, the join finds the `dim_customer` row whose `webshop_id` is `88213`, and `dc.customer_key` is Ana's surrogate key, 5.

`product_key` is the same kind of lookup: the line's `sku` matched against `dim_product.sku`.

`net_amount` is the calculation from the board: `quantity * unit_price - discount`. Ana's colas are 2 × 25.00 − 0.00 = 50.00, and Thea's detergent is 1 × 89.00 − 8.90 = 80.10.

`channel_key` works differently. Every other lookup takes a value from the source row and matches it in a dimension. But an order in the web shop has no channel column and no store column, because the web shop only knows about itself. There's nothing on the row to look up.

What you do know is that every row in this load is a web sale. So the join condition doesn't use the source at all:

```sql
JOIN dim_channel ch ON ch.channel = 'Web'
```

For each order line, SQL Server looks for the `dim_channel` rows where `channel` is `'Web'`. There's exactly one, the row with `channel_key` 1, so each line is paired with that one row. That's why all three output rows have `channel_key` 1, and so does every one of the 511 order lines.

You could write the number `1` in the `SELECT` instead of joining. The join looks the Web row up by what it is rather than by the number it happened to get, so the query still works if the rows in `dim_channel` are ever loaded in a different order.

> Online sales get their channel by joining to the one Web row, because the web shop has no channel of its own to look up.

### 4.3 Till sales with a loyalty card

```sql
INSERT INTO fact_sales (date_key, customer_key, product_key, channel_key, order_no, quantity, net_amount)
SELECT YEAR(r.sold_at) * 10000 + MONTH(r.sold_at) * 100 + DAY(r.sold_at),
       dc.customer_key,
       dp.product_key,
       ch.channel_key,
       r.receipt_no,
       rl.quantity,
       rl.line_total
FROM tills.dbo.receipt_line rl
JOIN tills.dbo.receipt r ON r.receipt_id    = rl.receipt_id
JOIN dim_customer dc     ON dc.loyalty_card = r.card_no
JOIN dim_product dp      ON dp.sku          = rl.sku
JOIN dim_channel ch      ON ch.store_id     = r.store_id;
```

Here are three of the rows it loads into `fact_sales`, from Lars and Ana:

| `date_key` | `customer_key` | `product_key` | `channel_key` | `order_no` | `quantity` | `net_amount` |
|---|---|---|---|---|---|---|
| 20250314 | 16 | 3 | 3 | T-0441 | 6 | 120.00 |
| 20250315 | 5 | 3 | 2 | T-0502 | 4 | 100.00 |
| 20250315 | 16 | 1 | 3 | T-0519 | 2 | 78.00 |

Ana's till sale on `T-0502` gets the same `customer_key`, 5, as her web order `W-8812`, because both of her natural keys are on the same `dim_customer` row.

It has the same shape as the online load, with the till system's columns in place of the web shop's:

- The receipt's `card_no` is looked up on `dim_customer.loyalty_card`. Lars's receipt `T-0441` has `L-60321`, which finds Lars's row, `customer_key` 16.
- `store_id` is looked up on `dim_channel.store_id`. Unlike the web shop, the tills do know where the sale happened, so this is a real lookup: store 2 finds Oslo Grünerløkka, `channel_key` 3.
- `receipt_no` goes into `order_no`.
- `net_amount` is just `line_total`, because the till already stored what was paid.
- `date_key` comes from `sold_at`. `YEAR`, `MONTH` and `DAY` ignore the time of day, so 17:42 on 14 March still becomes `20250314`.

This load skips every receipt without a card. A receipt with a `NULL` `card_no` has nothing to match on `dim_customer.loyalty_card`, because `NULL` is never equal to anything, so the `JOIN` drops those rows.

### 4.4 Till sales without a card

The receipts the last load skipped still need to go in. Their customer is the Unknown row, key 1:

```sql
INSERT INTO fact_sales (date_key, customer_key, product_key, channel_key, order_no, quantity, net_amount)
SELECT YEAR(r.sold_at) * 10000 + MONTH(r.sold_at) * 100 + DAY(r.sold_at),
       1,                                -- customer_key 1 is Unknown
       dp.product_key,
       ch.channel_key,
       r.receipt_no,
       rl.quantity,
       rl.line_total
FROM tills.dbo.receipt_line rl
JOIN tills.dbo.receipt r ON r.receipt_id = rl.receipt_id
JOIN dim_product dp      ON dp.sku       = rl.sku
JOIN dim_channel ch      ON ch.store_id  = r.store_id
WHERE r.card_no IS NULL;
GO
```

Here's one of the rows it loads into `fact_sales`, from a customer who didn't scan a card:

| `date_key` | `customer_key` | `product_key` | `channel_key` | `order_no` | `quantity` | `net_amount` |
|---|---|---|---|---|---|---|
| 20250315 | 1 | 13 | 4 | T-6443 | 1 | 59.00 |

It's the same query as the last load, with the customer handled differently. There's no card to join on, so there's no join to `dim_customer`. The `SELECT` writes `1` for every row, and the `WHERE` keeps only the receipts with no card.

Between them, the two till loads cover every receipt exactly once: the first takes the ones with a card, and this one takes the ones without.

[Back to contents](#contents)

## 5. Using the warehouse

### 5.1 Checking the load

Before trusting the warehouse, check it against the sources. Every line from both systems should be in `fact_sales`, and the money should add up to the same total.

First, the warehouse:

```sql
SELECT COUNT(*), SUM(net_amount) FROM fact_sales;
```

Then each source, with net sales worked out the same way the loads did it:

```sql
SELECT COUNT(*), SUM(quantity * unit_price - discount) FROM online_store.dbo.order_line;

SELECT COUNT(*), SUM(line_total) FROM tills.dbo.receipt_line;
```

Here's what the three queries return, side by side:

| | Rows | Net sales |
|---|---|---|
| Online | 511 | 37 187.30 |
| Tills | 944 | 58 549.00 |
| `fact_sales` | 1 455 | 95 736.30 |

The two sources add up to the warehouse, in rows and in money. If a load had dropped rows, for example by using a plain `JOIN` where a lookup found no match, the counts would come up short and the totals wouldn't match.

### 5.2 Answering the question

Now the question from the start of the lesson: net sales per customer city, per product category, per channel, per month, for 2025.

```sql
SELECT c.city,
       p.category,
       ch.channel,
       d.month,
       d.month_name,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_customer c ON c.customer_key = f.customer_key
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE d.year = 2025
GROUP BY c.city, p.category, ch.channel, d.month, d.month_name
ORDER BY c.city, p.category, ch.channel, d.month;
```

It returns 389 rows. Here are the first six:

| `city` | `category` | `channel` | `month` | `month_name` | `net_sales` |
|---|---|---|---|---|---|
| Bergen | Bakery | Till | 1 | January | 49.00 |
| Bergen | Bakery | Till | 2 | February | 133.00 |
| Bergen | Bakery | Till | 4 | April | 49.00 |
| Bergen | Bakery | Till | 5 | May | 98.00 |
| Bergen | Bakery | Till | 6 | June | 196.00 |
| Bergen | Bakery | Till | 7 | July | 98.00 |

March is missing from that list because no Bergen customer bought anything from the bakery at a till in March, so there was nothing to group.

And here are the first three rows for the Unknown customer:

| `city` | `category` | `channel` | `month` | `month_name` | `net_sales` |
|---|---|---|---|---|---|
| Unknown | Bakery | Till | 1 | January | 287.00 |
| Unknown | Bakery | Till | 2 | February | 42.00 |
| Unknown | Bakery | Till | 3 | March | 280.00 |

There's one join for each dimension the question breaks the number down by. `d.month` is there so the months sort in calendar order, and `d.month_name` is there so you can read them.

Till sales without a card appear under the city `Unknown`, because that's the city on customer 1. That's the honest answer: the warehouse doesn't know where those customers live.

### 5.3 Smaller reports

389 rows answers the question exactly, but nobody reads a report that long. Each row is one city, one category, one channel and one month, so the bigger picture - which channel is growing, which store sells the most - is spread across hundreds of rows.

A report people actually read asks a narrower question, and groups by only one or two dimension columns. Every column you leave out of the `GROUP BY` is added up across, so the same fact rows give a short answer.

**Which channel brings in more money, quarter by quarter?**

```sql
SELECT ch.channel,
       d.quarter,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE d.year = 2025
GROUP BY ch.channel, d.quarter
ORDER BY ch.channel, d.quarter;
```

| `channel` | `quarter` | `net_sales` |
|---|---|---|
| Till | 1 | 13289.00 |
| Till | 2 | 12263.00 |
| Till | 3 | 15887.00 |
| Till | 4 | 17110.00 |
| Web | 1 | 6837.80 |
| Web | 2 | 10278.80 |
| Web | 3 | 10586.30 |
| Web | 4 | 9484.40 |

The tills take more every quarter, and their best quarter is the last one. Web sales grew through the first three quarters and dipped in the fourth. `quarter` comes straight from `dim_date`, so the query needs no date functions to work it out.

**Which shop sells the most?**

```sql
SELECT ch.store_name,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE d.year = 2025
GROUP BY ch.store_name
ORDER BY net_sales DESC;
```

| `store_name` | `net_sales` |
|---|---|
| Online | 37187.30 |
| Oslo Grünerløkka | 26454.00 |
| Bergen Sentrum | 17392.00 |
| Trondheim Solsiden | 14703.00 |

The web shop sells more than any single store, and Oslo is the busiest physical shop. The web shop shows up as `Online` rather than `NULL` because that's the `store_name` the Web row was given when `dim_channel` was loaded. `ORDER BY net_sales DESC` puts the biggest seller first.

**Where do our customers live, and how do they buy?**

```sql
SELECT c.city,
       ch.channel,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_customer c ON c.customer_key = f.customer_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE d.year = 2025
GROUP BY c.city, ch.channel
ORDER BY c.city, ch.channel;
```

| `city` | `channel` | `net_sales` |
|---|---|---|
| Bergen | Till | 11242.00 |
| Bergen | Web | 13464.60 |
| Oslo | Till | 19874.00 |
| Oslo | Web | 14138.80 |
| Stavanger | Web | 4099.20 |
| Trondheim | Till | 7793.00 |
| Trondheim | Web | 5484.70 |
| Unknown | Till | 19640.00 |

Stavanger only buys online, because there's no store in Stavanger and none of its customers has a loyalty card. Unknown only appears at the tills, because every web order has a customer.

The Unknown row is the one to notice. 19 640.00 of the tills' 58 549.00 came from customers who didn't scan a card, so for about a third of till sales the business can't say where the customer lives.

**What are the best-selling products?**

```sql
SELECT TOP 5 p.name,
       p.category,
       SUM(f.quantity)   AS units,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p ON p.product_key = f.product_key
JOIN dim_date d    ON d.date_key    = f.date_key
WHERE d.year = 2025
GROUP BY p.name, p.category
ORDER BY net_sales DESC;
```

| `name` | `category` | `units` | `net_sales` |
|---|---|---|---|
| Laundry detergent 1kg | Cleaning | 169 | 15005.40 |
| Kitchen roll 4pk | Paper | 175 | 10313.20 |
| Cinnamon buns 4pk | Bakery | 160 | 7795.90 |
| Wholegrain bread | Bakery | 169 | 7072.80 |
| Orange juice 1L | Beverages | 176 | 6860.10 |

`TOP 5` keeps the first five rows after sorting. The products sold in similar numbers, between 160 and 176 units each, but laundry detergent brought in twice as much as most of the others because it costs more per unit.

[Back to contents](#contents)

## 6. What you learned

You've now taken two operational systems and turned them into one star schema you can ask questions of.

**Most of the integration work happens before you write any SQL.** The two systems didn't agree on a customer key, a name format or how to store money. What made the warehouse possible was reading the source tables and finding what they did agree on: the email, the SKU, and a calculation that turns a web line and a till line into the same net amount.

**The load order is forced on you.** Fact rows hold surrogate keys, and those keys only exist once the dimension rows do. That's why the calendar, the channels, the customers and the products were all built first, and why the foreign keys on `fact_sales` refuse anything that tries to skip ahead.

**Not knowing something still needs a row.** A till sale without a card still happened, and it belongs in the totals. The Unknown customer gives it somewhere to point, and the Web channel does the same for sales that never had a store. Real sources have gaps like these, and a warehouse fills them with rows rather than leaving keys empty.

**Loading the fact table is mostly lookups.** A source describes each sale with its own keys, such as a customer id or a SKU. For each of those, the load joins to the matching dimension and picks up the surrogate key the warehouse uses instead. The web shop doesn't store a channel, so there was nothing to look up. Instead, every online sale was given the key of the Web row in `dim_channel`.

**Don't trust a load you haven't checked.** A join that finds no match drops the row without any error. Comparing row counts and totals against the sources takes a few lines of SQL, and it's how you know nothing fell through.

**After the build, questions are cheap.** Once the sales were in, every new report - by quarter, by shop, by product - was a different `GROUP BY` over the same rows. Nothing had to be loaded again to ask something new.

[Back to contents](#contents)

## 7. Sources

1. Kimball, R. and Ross, M., *The Data Warehouse Toolkit*, 3rd ed., Wiley, 2013.
2. Kimball Group, [Calendar Date Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/calendar-date-dimension/)
3. Kimball Group, [Nulls in Fact Tables](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/fact-table-null/)
4. Microsoft Learn, [SET DATEFIRST (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-datefirst-transact-sql)

[Back to contents](#contents)
