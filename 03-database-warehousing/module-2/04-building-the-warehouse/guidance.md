# Lesson 4 guidance: building the warehouse

Planning doc for you, not for students. One plan, no variants. Everything happens in SQL Server, in the container they already have, run from VS Code the same way as `ShopDb` in Database Technologies.

## The day

There are three databases on one server:

| Database | What it is | Where it comes from |
|---|---|---|
| `online_store` | The web shop's system | `class-demo/sources.sql`, given to students |
| `tills` | The shops' till system | `class-demo/sources.sql`, given to students |
| `sales_dw` | The data warehouse: one star | Built in class |

Because they're on the same server, a query can read from all three using three-part names, such as `online_store.dbo.customer`. So every load step is one statement: `INSERT INTO` a `sales_dw` table, `SELECT` from the sources.

| Step | What happens | Time |
|---|---|---|
| 1 | Students run `sources.sql` | 5 min |
| 2 | Projector on the source tables, model the star on the whiteboard | 45 min |
| 3 | Create the `sales_dw` tables | 15 min |
| 4 | Fill `dim_date` | 20 min |
| 5 | Fill `dim_channel`, `dim_product` and `dim_customer` | 40 min |
| 6 | Load `fact_sales` | 30 min |
| 7 | Check the totals, then answer the question | 20 min |

You live-code steps 3 to 6 with the students typing along. Step 7 they do themselves.

## 1. The sources

The data is the lecture's world: Ana, Lars, cola, orange juice, web and till. Ana's web order `W-8812` and the receipts `T-0441`, `T-0502` and `T-0519` from the boards are in there exactly. It's all of 2025, and it's clean.

### `online_store`

| Table | Rows | Columns |
|---|---|---|
| `customer` | 13 | `customer_id` (Ana is 88213), `first_name`, `last_name`, `email`, `city`, `created_at`, `updated_at` |
| `product` | 14 | `sku` (cola is 4410), `name`, `brand`, `category`, `department`, `list_price` |
| `orders` | 240 | `order_id`, `order_no`, `customer_id`, `order_date` |
| `order_line` | 511 | `order_id`, `line_no`, `sku`, `quantity`, `unit_price`, `discount` |

### `tills`

| Table | Rows | Columns |
|---|---|---|
| `store` | 3 | `store_id`, `name`, `city` (Bergen, Oslo, Trondheim) |
| `loyalty_member` | 13 | `card_no` (Ana is L-55190), `full_name`, `email`, `city`, `joined_on` |
| `receipt` | 360 | `receipt_id`, `receipt_no`, `sold_at`, `card_no`, `store_id` |
| `receipt_line` | 944 | `receipt_id`, `line_no`, `sku`, `quantity`, `line_total` |

### How the two systems differ

These differences are the whole integration job. There's no cleaning.

- **Customers.** The web shop knows a customer by `customer_id` and stores first and last name separately. The tills know a loyalty member by `card_no` and store one full name. The same person has the same email in both. There are 18 people: 8 in both systems, 5 only online, 5 only at the tills. Lars is one of the till-only ones.
- **Customers with no card.** 129 of the 360 receipts have no `card_no`, because the customer didn't scan a loyalty card. That's normal.
- **Products.** Only the web shop has a product table. The tills just store the SKU on each receipt line, and it's the same SKU.
- **Amounts.** Online lines store `unit_price` and a `discount` for the line. Till lines store `line_total`, which is what was paid for the line.
- **Dates.** Orders have an `order_date` (a date). Receipts have `sold_at` (a date and a time).
- **Stores.** The tills know which store a sale happened in. The web shop has no store.

## 2. The question

Put this on the board:

> Net sales per customer city, per product category, per channel, per month, for 2025.

The rest of the day builds the warehouse that answers it.

## 3. The model on the whiteboard

Projector on the source tables, and build this on the board in the same order the lectures taught:

1. **Grain:** one row per product per order. Online that's an order line; at the tills it's a receipt line. It's the atomic grain.
2. **Dimensions:** walk the question. City is on the customer, category on the product, channel on the channel, month on the date. That gives four dimensions.
3. **Columns of each dimension**, below.
4. **Columns of the fact**: four surrogate keys, the order number as the degenerate dimension, and two measures.

This is the star you're heading for:

| Table | Columns |
|---|---|
| `dim_date` | `date_key`, `full_date`, `day`, `day_name`, `day_of_week`, `week`, `month`, `month_name`, `quarter`, `year`, `is_weekend` |
| `dim_channel` | `channel_key`, `channel`, `store_id`, `store_name`, `store_city` |
| `dim_product` | `product_key`, `sku`, `name`, `brand`, `category`, `department` |
| `dim_customer` | `customer_key`, `webshop_id`, `loyalty_card`, `name`, `email`, `city` |
| `fact_sales` | `date_key`, `customer_key`, `product_key`, `channel_key`, `order_no`, `quantity`, `net_amount` |

`dim_channel` has one row for the web shop and one row per store, so a till sale knows which store it happened in:

| `channel_key` | `channel` | `store_id` | `store_name` | `store_city` |
|---|---|---|---|---|
| 1 | Web | NULL | Online | NULL |
| 2 | Till | 1 | Bergen Sentrum | Bergen |
| 3 | Till | 2 | Oslo Grünerløkka | Oslo |
| 4 | Till | 3 | Trondheim Solsiden | Trondheim |

The Web row has `NULL` in `store_id` and `store_city` because those columns don't apply to it. The web shop isn't a physical shop, so it has no store number and no city. `store_id` is the tills' natural key, and online sales don't come from the tills. Here `NULL` means "doesn't apply", not "we don't know". That's the difference from the Unknown customer below, where the customer exists but we don't know who it is. `store_name` says "Online" rather than `NULL`, so a report grouped by store still gets a readable label for web sales.

`dim_customer` has one row per person, holding both natural keys. Ana's row has `webshop_id` 88213 and `loyalty_card` L-55190. Lars's row has only L-60321.

It also needs one extra row. A till sale without a loyalty card still happened, so it belongs in `fact_sales`, but nobody knows who the customer was. Rather than leaving its `customer_key` empty, the warehouse gives it a customer that means "we don't know": a row called **Unknown**, inserted first so its key is 1.

| `customer_key` | `webshop_id` | `loyalty_card` | `name` | `city` |
|---|---|---|---|---|
| 1 | NULL | NULL | Unknown | Unknown |
| ... | 88213 | L-55190 | Ana Hansen | Bergen |
| ... | NULL | L-60321 | Lars Johansen | Oslo |

Every till sale without a card gets `customer_key` 1. In the report they appear together under the city "Unknown", which is the honest answer: we don't know where those customers live.

Last, fill in this table with the class. It says where every fact column comes from in each source, and it's the plan for the two fact loads:

| `fact_sales` column | From `online_store` | From `tills` |
|---|---|---|
| `date_key` | `orders.order_date` as `20250314` | `receipt.sold_at` as `20250314` |
| `customer_key` | `orders.customer_id` looked up on `dim_customer.webshop_id` | `receipt.card_no` looked up on `dim_customer.loyalty_card`; no card means 1 (Unknown) |
| `product_key` | `order_line.sku` looked up on `dim_product.sku` | `receipt_line.sku` looked up on `dim_product.sku` |
| `channel_key` | the Web row | `receipt.store_id` looked up on `dim_channel.store_id` |
| `order_no` | `orders.order_no` | `receipt.receipt_no` |
| `quantity` | `order_line.quantity` | `receipt_line.quantity` |
| `net_amount` | `quantity * unit_price - discount` | `line_total` |

## 4. The build

All of this SQL has been run against SQL Server 2025, from start to finish, and the row counts and totals below are what it produced.

### 4.1 The warehouse tables

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

CREATE TABLE dim_channel (
    channel_key INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    channel     NVARCHAR(10) NOT NULL,
    store_id    INT          NULL,       -- natural key from tills.store
    store_name  NVARCHAR(50) NOT NULL,
    store_city  NVARCHAR(50) NULL
);

CREATE TABLE dim_product (
    product_key INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    sku         INT           NOT NULL,  -- natural key
    name        NVARCHAR(100) NOT NULL,
    brand       NVARCHAR(50)  NOT NULL,
    category    NVARCHAR(50)  NOT NULL,
    department  NVARCHAR(50)  NOT NULL
);

CREATE TABLE dim_customer (
    customer_key INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    webshop_id   INT           NULL,     -- natural key from online_store
    loyalty_card VARCHAR(10)   NULL,     -- natural key from tills
    name         NVARCHAR(100) NOT NULL,
    email        NVARCHAR(100) NULL,
    city         NVARCHAR(50)  NOT NULL
);

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

The primary key is the grain written as a constraint. One row is one product on one order, so the order number plus the product identify the row. That's Kimball's own choice for a retail sales fact: the degenerate dimension plus the product key.

The foreign keys on `fact_sales` mean a fact row can't be inserted until its dimension rows exist. That's the load order from the lecture: dimensions first, then facts.

### 4.2 `dim_date`

No source has a calendar, so the warehouse makes one: a loop that inserts one row per day for 2025 and 2026. Run the whole block at once, because `@d` only exists while the batch runs.

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

That gives 730 rows. `SET DATEFIRST 1` is there because SQL Server's default counts Sunday as day 1.

### 4.3 `dim_channel` and `dim_product`

```sql
INSERT INTO dim_channel (channel, store_id, store_name, store_city)
VALUES ('Web', NULL, 'Online', NULL);

INSERT INTO dim_channel (channel, store_id, store_name, store_city)
SELECT 'Till', store_id, name, city
FROM tills.dbo.store;

INSERT INTO dim_product (sku, name, brand, category, department)
SELECT sku, name, brand, category, department
FROM online_store.dbo.product;
GO
```

That gives 4 channels and 14 products.

### 4.4 `dim_customer`

There are three inserts. The Unknown row goes in first, so it gets `customer_key` 1:

```sql
INSERT INTO dim_customer (webshop_id, loyalty_card, name, email, city)
VALUES (NULL, NULL, 'Unknown', NULL, 'Unknown');
```

Next, every web shop customer. The `LEFT JOIN` finds their loyalty card by email when they have one, and leaves it `NULL` when they don't:

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

Last, the loyalty members who don't have a web shop account:

```sql
INSERT INTO dim_customer (webshop_id, loyalty_card, name, email, city)
SELECT NULL, m.card_no, m.full_name, m.email, m.city
FROM tills.dbo.loyalty_member m
WHERE m.email NOT IN (SELECT email FROM online_store.dbo.customer);
GO
```

That gives 19 rows: Unknown plus 18 people.

### 4.5 `fact_sales`

There are three loads: online sales, till sales with a loyalty card, and till sales without one. Each is the surrogate key pipeline from the lecture written as joins: look up every natural key in its dimension, and write the surrogate key.

```sql
-- Online sales
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

-- Till sales with a loyalty card
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

-- Till sales without a loyalty card: all of them go to the Unknown customer
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

The last two loads are the same query with the customer handled differently. The first joins to `dim_customer` on the card number. The second has no card to join on, so it writes 1.

## 5. Check, then answer

Before trusting the warehouse, check it against the sources. The fact table should hold every line from both systems, and the money should add up to the same total:

```sql
SELECT COUNT(*), SUM(net_amount) FROM fact_sales;

SELECT COUNT(*), SUM(quantity * unit_price - discount) FROM online_store.dbo.order_line;

SELECT COUNT(*), SUM(line_total) FROM tills.dbo.receipt_line;
```

With `sources.sql` as it is, you should get:

| | Rows | Net sales |
|---|---|---|
| Online | 511 | 37 187.30 |
| Tills | 944 | 58 549.00 |
| `fact_sales` | 1 455 | 95 736.30 |

Then answer the question:

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

There's one join per dimension, the same as the lecture's "one join per way you break the number down", now on a warehouse they built themselves. The city comes from `dim_customer`, so till sales without a loyalty card are grouped under the Unknown customer's city, "Unknown".
