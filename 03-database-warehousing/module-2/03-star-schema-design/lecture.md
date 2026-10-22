# Designing a Star Schema

> In this lesson you will take the `fact_sales` star schema and decide the details that make it work: what one row of the fact table stands for, which of its numbers can be added up, where its keys come from, and what happens to last year's sales when a customer moves city.
>
> New terms get a plain-English version in brackets.

**By the end of this lesson you should be able to:**

1. **Identify** the grain of a fact table.
2. **Explain** why Kimball recommends the atomic grain.
3. **Classify** a measure as additive, semi-additive or non-additive.
4. **Explain** why a warehouse generates surrogate keys for its dimensions.
5. **Describe** how the load translates natural keys into surrogate keys.
6. **Describe** the four types of slowly changing dimension.
7. **Explain** which slowly changing dimension type suits a given attribute.

## Contents

1. [Back to fact_sales](#1-back-to-fact_sales)
2. [Grain](#2-grain)
   - [2.1 What one row stands for](#21-what-one-row-stands-for)
   - [2.2 The same orders at coarser grains](#22-the-same-orders-at-coarser-grains)
   - [2.3 Choose the atomic grain](#23-choose-the-atomic-grain)
3. [Measures](#3-measures)
   - [3.1 What a measure is](#31-what-a-measure-is)
   - [3.2 Additive](#32-additive)
   - [3.3 Semi-additive](#33-semi-additive)
   - [3.4 Non-additive](#34-non-additive)
4. [Surrogate keys](#4-surrogate-keys)
   - [4.1 Keys the warehouse makes up](#41-keys-the-warehouse-makes-up)
   - [4.2 One customer, three source keys](#42-one-customer-three-source-keys)
   - [4.3 Source keys get reused](#43-source-keys-get-reused)
   - [4.4 The surrogate key pipeline](#44-the-surrogate-key-pipeline)
5. [Slowly changing dimensions](#5-slowly-changing-dimensions)
   - [5.1 Ana moves to Oslo](#51-ana-moves-to-oslo)
   - [5.2 Type 0: keep the original](#52-type-0-keep-the-original)
   - [5.3 Type 1: overwrite](#53-type-1-overwrite)
   - [5.4 Type 2: add a new row](#54-type-2-add-a-new-row)
   - [5.5 Type 3: add a column](#55-type-3-add-a-column)
6. [Snowflakes](#6-snowflakes)
7. [Sources](#7-sources)

## 1. Back to fact_sales

Recall the shape of a star schema: a **fact table** in the middle, one row per business event, holding keys and numbers, with **dimension tables** around it holding the who, what, where and when. For sales, that's `fact_sales` with `dim_date`, `dim_customer`, `dim_product` and `dim_channel`.

Here are five rows of `fact_sales`: four orders from two customers, Ana and Lars, over two days. The first row is Ana buying two colas on the web shop for 50.00.

| `date_key` | `customer_key` | `product_key` | `channel_key` | `order_no` | `quantity` | `net_amount` |
|---|---|---|---|---|---|---|
| 20250314 | 1042 (Ana) | 501 (cola) | 1 (web) | W-8812 | 2 | 50.00 |
| 20250314 | 1042 | 502 (orange juice) | 1 | W-8812 | 1 | 39.00 |
| 20250314 | 1187 (Lars) | 501 | 2 (till) | T-0441 | 6 | 120.00 |
| 20250315 | 1042 | 501 | 2 | T-0502 | 4 | 100.00 |
| 20250315 | 1187 | 502 | 2 | T-0519 | 2 | 78.00 |

`order_no` is the **degenerate dimension** *[a dimension value kept on the fact row because it has nothing else to describe it, so it gets no table of its own]*. It's the order number from the source system, so it's how you trace a fact row back to the order it came from.

[Back to contents](#contents)

## 2. Grain

### 2.1 What one row stands for

The **grain** of a fact table is exactly what one row represents ([Grain](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/)).

Look at the rows above. Ana's web order W-8812 appears twice, once for the cola and once for the orange juice. 

So one **row** is one product on one order, which is a line on the receipt. 

> That's called **order-line grain**.

![Board showing the five fact_sales rows. Notes underneath: grain is the first thing you decide, before facts and dims, and answers what one row represents. Here it's order-line level, products in an order, which is atomic. order_no is labelled a degenerate dimension, the natural key for the fact, and quantity and net_amount are labelled measures, how much of a fact](boards/02.jpeg)

### 2.2 The same orders at coarser grains

The same four orders could be stored with less detail per row. Each step up is called a **coarser** grain *[each row covers more, so there are fewer rows and less detail]*.

At **order grain**, there's one row per order:

| `date_key` | `customer_key` | `channel_key` | `order_no` | `quantity` | `net_amount` |
|---|---|---|---|---|---|
| 20250314 | 1042 | 1 | W-8812 | 3 | 89.00 |
| 20250314 | 1187 | 2 | T-0441 | 6 | 120.00 |
| 20250315 | 1042 | 2 | T-0502 | 4 | 100.00 |
| 20250315 | 1187 | 2 | T-0519 | 2 | 78.00 |

Ana's web order now covers a cola and an orange juice in one row, so there's no single product to point at, and the `product_key` column has to go. Nobody can ask this table how many colas were sold.

At **daily grain**, there's one row per day:

| `date_key` | `quantity` | `net_amount` |
|---|---|---|
| 20250314 | 9 | 209.00 |
| 20250315 | 6 | 178.00 |

Now the customers, the channels and the order numbers are gone as well. This table can tell you how much was sold on each day, and nothing else.

So the grain decides which dimensions a fact table can have, and with them which questions it can answer. 

> That's why Kimball declares the grain first, before choosing any dimensions or measures.

### 2.3 Choose the atomic grain

The **atomic** grain is the lowest level of detail the source systems record. For sales, the tills and the web shop record each line of each order, so **order-line** is the most atomic grain.

Kimball's rule is to choose the atomic grain, because the coarser tables can always be made from it. Both tables above come from the order-line rows with a `GROUP BY`. This one makes the daily table:

```sql
SELECT date_key, SUM(quantity), SUM(net_amount)
FROM fact_sales
GROUP BY date_key;
```

It doesn't work the other way. Nothing in the daily table can tell you that 9 colas and orange juices on 14 March were split across two customers and two channels.

> A coarser grain can always be built from the atomic grain, but never the other way round.

![Board titled Grain listing order-line (most atomic), order and daily (least atomic). Kimball: choose the finest grain available from source systems, because you can always aggregate data but can't invent detail. Two tables: fact_sales at order grain, asking where product went, and fact_sales at daily grain, asking where customer, channel and order_no went](boards/03.jpeg)

[Back to contents](#contents)

## 3. Measures

### 3.1 What a measure is

A **measure** is a number on a fact row that says how much was involved in the event: how many units, how much money, how many minutes. 

In `fact_sales`, the *measures* are `quantity` and `net_amount`.

Every other column on the row is a key that says *who, what, when or where*. Those are the columns a report puts in its `GROUP BY`. The measures are the columns it puts inside `SUM()` or `AVG()`.

`date_key` is a number too, but it isn't a measure. Adding 20250314 to 20250315 means nothing. The test is whether the total of a column answers a question someone would actually ask.

> Almost every report wants to add measures up. 

So for each measure, the question is whether adding its numbers together gives a *true total*, or counts something *twice*. 

Kimball sorts measures into three kinds by the answer:

1. Things that always add up: **additive**.
2. Things that add up only within one moment: **semi-additive**.
3. Things that can't be added up at all: **non-additive**.

![Board titled Measures: a measure is a number on a fact row that says how much was involved, such as units, money or minutes, and almost every report sums these. For each measure, does adding them up give a true total or are we counting things twice. The fact rows split into who, what, where, when for GROUP BY and measures for SUM or AVG, then the three kinds: additive, semi-additive and non-additive](boards/04.jpeg)

### 3.2 Additive

`quantity` and `net_amount` each record what one sale involved. Here are the five rows totalled per customer:

```sql
SELECT customer_key, SUM(quantity), SUM(net_amount)
FROM fact_sales
GROUP BY customer_key;
```

| `customer_key` | `SUM(quantity)` | `SUM(net_amount)` |
|---|---|---|
| 1042 (Ana) | 7 | 189.00 |
| 1187 (Lars) | 8 | 198.00 |

Ana's total adds all three of her rows together, whatever the product, channel or date. That's what `GROUP BY` does. It keeps the dimension you name apart, and adds up *across* all the others.

![Board titled Measures: additive, quantity and net_amount can be added across all dimensions. SELECT customer_key, SUM(quantity), SUM(net_amount) FROM sales_fact GROUP BY customer_key gives Ana 7 and 189, Lars 8 and 198, with product, channel and date as the dimensions added across](boards/05.jpeg)

Change what you group by, and you change which dimensions get *added across*. Every one of these totals is true:

| `GROUP BY` | Added across | Example group | `SUM(quantity)` | `SUM(net_amount)` |
|---|---|---|---|---|
| `customer_key` | products, channels, dates | Ana (1042) | 7 | 189.00 |
| `product_key` | customers, channels, dates | Cola (501) | 12 | 270.00 |
| `channel_key` | products, customers, dates | Till (2) | 12 | 298.00 |
| `date_key` | products, customers, channels | 14 March | 9 | 209.00 |
| nothing | everything | All sales | 15 | 387.00 |

None of these can count anything twice, because no sale happens twice. So `quantity` and `net_amount` add up **across every dimension**.

> A measure like this is called **additive**.

Most measures recording something that happened are additive.

![Board titled Measures: additive, can be added across all dimensions. A table of group by options - customer_key, product_key, channel_key, date_key and none - with the dimensions added across, an example group, and the sum of quantity and net amount for each](boards/06.jpeg)

### 3.3 Semi-additive

Stock on hand is different. It's a count of what's on the shelves, taken once a day, so it lives in its own fact table, `fact_inventory`, with one row per product per warehouse per day:

| `date_key` | `warehouse_key` | `product_key` | `quantity_on_hand` |
|---|---|---|---|
| 20250314 | 1 (Bergen) | 501 (cola) | 40 |
| 20250314 | 1 | 502 (orange juice) | 12 |
| 20250314 | 2 (Oslo) | 501 | 30 |
| 20250314 | 2 | 502 | 10 |
| 20250315 | 1 | 501 | 36 |
| 20250315 | 1 | 502 | 12 |
| 20250315 | 2 | 501 | 30 |
| 20250315 | 2 | 502 | 8 |

Keep the dates and products apart, and add up across the warehouses:

```sql
SELECT date_key, product_key, SUM(quantity_on_hand)
FROM fact_inventory
GROUP BY date_key, product_key;
```

On 14 March this gives 70 colas, and that's true. Bergen's 40 and Oslo's 30 are different cans on different shelves.

Now keep the warehouses and products apart, and add up across the dates instead:

```sql
SELECT warehouse_key, product_key, SUM(quantity_on_hand)
FROM fact_inventory
GROUP BY warehouse_key, product_key;
```

| `warehouse_key` | `product_key` | `SUM(quantity_on_hand)` |
|---|---|---|
| 1 (Bergen) | 501 (cola) | 76 |
| 1 | 502 (orange juice) | 24 |
| 2 (Oslo) | 501 | 60 |
| 2 | 502 | 18 |

All four totals are false. Bergen never had 76 colas. It had 40 on the 14th and 36 on the 15th, and most of the 36 were the same cans that were counted the day before, so they've been counted twice.

So stock on hand adds up across warehouses, but not across dates.

> A measure that adds up across some dimensions but not all is called **semi-additive**.

The Kimball Group gives balances as the common example: they're "additive across all dimensions except time" ([Additive, Semi-Additive, and Non-Additive Facts](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/)). For time, a report takes the latest count instead of a `SUM()`: Bergen has 36 colas, as of 15 March.

![Board titled Measures: semi-additive, some but not all. Stock on hand for fact_inventory, a daily count of what's on the shelves. The eight inventory rows, a query grouping by date and product that adds across warehouses correctly to 70, and a query grouping by warehouse and product that adds across date to 76, 24, 60 and 18, marked can't add across date. Use latest instead of SUM](boards/07.jpeg)

### 3.4 Non-additive

Say `fact_sales` also stored the price of one unit on each row. Take the first three rows:

| `customer_key` | `product_key` | `quantity` | `net_amount` | `unit_price` |
|---|---|---|---|---|
| 1042 (Ana) | 501 (cola) | 2 | 50.00 | 25.00 |
| 1042 | 502 (orange juice) | 1 | 39.00 | 39.00 |
| 1187 (Lars) | 501 | 6 | 120.00 | 20.00 |

Group by product and sum the price, and a cola costs 25.00 + 20.00 = 45.00. Group by customer, and Ana paid 25.00 + 39.00 = 64.00 for "one unit" of a cola and an orange juice.

So adding two prices never gives a price, and there's no dimension you can safely add `unit_price` across.

> A measure that can't be added across any dimension is called **non-additive**.

Ratios and percentages, such as a profit margin, are non-additive in the same way.

`AVG(unit_price)` doesn't fix it either. The average cola price over those rows is 22.50, but Lars bought six colas at 20.00 and Ana bought two at 25.00, so more colas sold at the lower price. The real price per cola is 170.00 / 8 = 21.25.

So never sum `unit_price`. Make sure the parts it's made from are stored, because they're additive, and divide their totals when a report needs a price across several rows. That's the Kimball Group's advice for every non-additive measure ([Additive, Semi-Additive, and Non-Additive Facts](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/)):

```sql
SELECT product_key, SUM(net_amount) / SUM(quantity) AS price_per_unit
FROM fact_sales
GROUP BY product_key;
```

The price of a single sale is never lost, because `net_amount / quantity` on one row gives it: 50.00 / 2 = 25.00 for Ana's first row. You can still store `unit_price` on the fact row if that's convenient for reading one sale at a time, as long as no report adds it up.

![Board titled Measures: non-additive, cannot be added across any dimension, unit_price on fact_sales. Three rows with unit prices 25, 39 and 20. Group by product gives 25 + 20 = 45, wrong. Group by customer gives 25 + 39 = 64, wrong, and 20. Non-additive, just a value: don't store unit_price, calculate it when needed with SUM(net_amount) / SUM(qty)](boards/08.jpeg)

[Back to contents](#contents)

## 4. Surrogate keys

### 4.1 Keys the warehouse makes up

Look at the keys on the fact rows: customer 1042, product 501, channel 1. None of those numbers come from a source system. The web shop doesn't know Ana as 1042, and the till system doesn't know cola as 501.

So the warehouse made these keys up itself.

> A key the warehouse makes up is called a **surrogate key** *[a stand-in key: a plain integer with no meaning of its own]*.

A surrogate key is the primary key of a dimension row, and it's the value the fact table stores. Kimball's rule is that a dimension's primary key "cannot be the operational system's natural key" ([Dimension Surrogate Keys](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/dimension-surrogate-key/)).

The source systems' own keys are called **natural keys** *[the identifiers the business already uses, such as a product's SKU or a customer's CRM id]*. They aren't thrown away. They're kept as ordinary columns on the dimension, such as `sku` on `dim_product` and `crm_id` on `dim_customer`, so every dimension row can still be traced back to its source.

`dim_date` is the exception. Its key is the date written as an integer, such as `20250314`. A date never changes, and no two sources disagree about what 14 March 2025 is, so there's nothing for a surrogate key to protect against.

![Board titled Surrogate keys (dim tables and fact tables): a stand-in, key values for dimension tables that don't come from source systems. The fact_sales keys 1042, 20250314, 501 and 1 are made up in the warehouse. Natural keys live in the dimension, such as product sku and customer CRM_id, kept as ordinary columns. Why: customer, various sources; product, key reuse. Dimensions are created first, then facts](boards/09.jpeg)

### 4.2 One customer, three source keys

Ana shops in the web shop and at the tills, and she's also in the CRM. Each of those systems knows her by its own key. Bringing them together into one customer is **integration**, the job ETL does, and the result is one `dim_customer` row holding all three natural keys:

| `customer_key` | `crm_id` | `webshop_id` | `loyalty_card` | `name` | `city` |
|---|---|---|---|---|---|
| 1042 | C-17 | 88213 | L-55190 | Ana | Bergen |
| 1187 | C-24 | NULL | L-60321 | Lars | Oslo |

None of the natural keys can be the primary key, because none of them covers every customer. Lars has never shopped online, so he has no web shop id, and a primary key can't be `NULL`. The surrogate key is the one value every row is guaranteed to have.

### 4.3 Source keys get reused

The product system gives cola the SKU 4410. After a while, cola is retired, and SKU 4410 is free. Later, the same SKU is given to a new energy drink.

If `dim_product` were keyed on SKU, every past cola sale would now report as an energy drink sale, and the cola's history would be lost. With surrogate keys, they're two different rows that happen to share a SKU:

| `product_key` | `sku` | `name` |
|---|---|---|
| 501 | 4410 | Cola 0.5L |
| 503 | 4410 | Energy drink 0.5L |

Old sales point at 501, and new sales point at 503.

![Board titled Surrogate keys: sources reuse or change their keys, product. Initially cola is sku 4410, then after some time you retire the product and sku 4410 becomes an energy drink. dim_product has 501 with sku 4410 Cola and 503 with sku 4410 Energy drink. Keyed on sku, you would lose history](boards/11.jpeg)

### 4.4 The surrogate key pipeline

The fact table stores surrogate keys, but the sources send natural keys. So the load has to translate.

When the web shop sends a sale for customer `88213`, the ETL looks up `88213` in `dim_customer`:

```sql
SELECT customer_key
FROM dim_customer
WHERE webshop_id = '88213';
```

It finds 1042, and writes 1042 on the new `fact_sales` row.

> Kimball calls this lookup the **surrogate key pipeline**.

It only works if Ana's `dim_customer` row is already there, which sets the **load order**: dimensions are loaded first, then facts.

Sometimes the lookup comes back empty. Say Lars buys something on the web shop for the first time, under the new web shop id `88312`. His `dim_customer` row has no web shop id, so the warehouse can't match `88312` to anyone yet.

> Kimball calls this a **late-arriving dimension** *[the fact arrives before the dimension row that describes it]*.

The sale still has to be loaded, and its `customer_key` can't be left empty. So the ETL makes a new `dim_customer` row holding `88312`, with its own surrogate key, and points the fact at it. The Kimball Group describes these as placeholder rows "created with the unresolved natural keys as attributes", which are filled in with an overwrite once the real details arrive ([Late Arriving Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/late-arriving-dimension/)).

![Board titled Surrogate keys: several sources know the same customer in different ways. Ana is C-17 in the CRM, 88213 in the web shop and L-55190 at the tills, and dim_customer holds all three as natural keys on row 1042, which fact_sales points at. Lars has a null web shop id. Loading a new web sale looks up SELECT cust_key FROM dim_customer WHERE webshop_id = 88213, the surrogate key pipeline. Lars buying online as 88312 finds no row, a late-arriving dimension, so make a new row](boards/10.jpeg)

[Back to contents](#contents)

## 5. Slowly changing dimensions

### 5.1 Ana moves to Oslo

Dimension values change, but rarely. A customer moves city. A product moves to a different category.

> These are called **slowly changing dimensions**, or **SCDs**.

When a value changes, what should happen to last year's reports? Ana lived in Bergen through 2025, and in March 2026 she moved to Oslo. A report of 2025 sales per city should still count her purchases under Bergen, because that's where she was when she made them.

Kimball numbers the answers from type 0 to type 3. The type is chosen per **attribute** *[one column of a dimension, such as `city` or `name`]*, not per table. In one `dim_customer`, the name can follow one type and the city another.

![Board titled Slowly Changing Dimensions (SCD): dimension values change over time, rarely, such as a customer moving city or a product moving category. Not per table, per field or attribute. Four types, 0 to 3. Q: what should happen to last year's report, for example Ana lived in Bergen in 2025 and moved to Oslo in March 2026. Type 1: overwrite, update Ana's city to Oslo, lose sales for Bergen, use for corrections such as spelling errors. Type 0: keep original, never change it after loading, such as date of birth or date account created, for constants](boards/12.jpeg)

### 5.2 Type 0: keep the original

The value is never changed after it's first loaded. This is for attributes that are constants, such as a customer's date of birth or the date their account was opened. If a source sends a different value later, the warehouse ignores it.

### 5.3 Type 1: overwrite

Update Ana's row so her city says Oslo:

| `customer_key` | `crm_id` | `name` | `city` |
|---|---|---|---|
| 1042 | C-17 | Ana | Oslo |

This is the simplest type, and for Ana's city it gives the wrong answer. Every one of her 2025 sales points at row 1042, and row 1042 now says Oslo, so her Bergen sales move to Oslo in last year's report. In the Kimball Group's words, type 1 "destroys history" ([Type 1: Overwrite](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-1/)).

That's exactly what you want for corrections. If Ana's name was loaded with a spelling mistake, every past report should show it spelled correctly, so the name is a type 1 attribute.

### 5.4 Type 2: add a new row

Leave Ana's old row alone, mark it as finished, and add a new row with a new surrogate key:

| `customer_key` | `crm_id` | `name` | `city` | `valid_from` | `valid_to` | `is_current` |
|---|---|---|---|---|---|---|
| 1042 | C-17 | Ana | Bergen | 2023-01-10 | 2026-03-01 | N |
| 1043 | C-17 | Ana | Oslo | 2026-03-01 | 9999-12-31 | Y |

Each row carries the dates it was true for, and a flag saying which row is current. The current row's `valid_to` has no real end date yet. Some warehouses leave it `NULL`. This one uses the far-future date `9999-12-31`, so every row has a range that can be compared against a date without a special case.

Her 2025 sales still point at 1042, so they still report under Bergen. Sales from March 2026 onwards are loaded with 1043, so they report under Oslo. History stays exactly as it was when each sale happened.

Type 2 depends on surrogate keys. Ana's natural key `C-17` is now on two rows, so it can't be the primary key.

It also depends on the load order. Dimensions are loaded before facts, so that each incoming sale can look up the row that was current on the date of the sale, not just the row that's current today. The lookup from the surrogate key pipeline gets a date condition:

```sql
SELECT customer_key
FROM dim_customer
WHERE crm_id = 'C-17'
  AND '2026-04-02' >= valid_from   -- the date of the sale
  AND '2026-04-02' <  valid_to;
```

A sale on 2 April 2026 finds 1043. A sale on 2 April 2025 finds 1042.

If Ana moves again, to Trondheim, the Oslo row is closed the same way and a third row is added:

| `customer_key` | `crm_id` | `name` | `city` | `valid_from` | `valid_to` | `is_current` |
|---|---|---|---|---|---|---|
| 1042 | C-17 | Ana | Bergen | 2023-01-10 | 2026-03-01 | N |
| 1043 | C-17 | Ana | Oslo | 2026-03-01 | 2026-10-01 | N |
| 1044 | C-17 | Ana | Trondheim | 2026-10-01 | 9999-12-31 | Y |

These are the three columns the Kimball Group says every type 2 dimension needs: an effective date, an expiration date and a current row indicator ([Type 2: Add New Row](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/)). Type 2 is the most common way to keep history in a dimension.

> Type 2 keeps history because old facts keep pointing at old rows.

### 5.5 Type 3: add a column

Keep a `previous_city` column next to `city`:

| `customer_key` | `crm_id` | `name` | `previous_city` | `city` |
|---|---|---|---|---|
| 1042 | C-17 | Ana | Bergen | Oslo |

This only tracks one step. When Ana moves to Trondheim, Bergen is pushed out and lost. It's used much less than type 2, mostly for reports that need to compare "before" and "after" a single change, such as a reorganisation of sales regions.

![Board titled Slowly Changing Dimensions (SCD). Type 2: add a new row, keep valid dates and a current flag, the most common, preserves history. Ana's rows 1042 Bergen, 1043 Oslo and 1044 Trondheim share crm_id C-17, with valid_from, valid_to and current columns; when she leaves Oslo its valid_to is updated and current changes to N. Fact_sales rows for Bergen Ana, Oslo Ana and Trondheim Ana point at the matching keys. Type 3: add a column, previous_city Bergen and city Oslo, only tracks one step](boards/13.jpeg)

[Back to contents](#contents)

## 6. Snowflakes

In a star schema, each dimension is one flattened table. Here's `dim_product`:

| `product_key` | `sku` | `name` | `brand` | `category` | `department` |
|---|---|---|---|---|---|
| 501 | 4410 | Cola 0.5L | FizzCo | Beverages | Food |
| 502 | 3120 | Orange juice 1L | Sunny | Beverages | Food |
| 504 | 5502 | Salted crisps | Crunch | Snacks | Food |

"Beverages" and "Food" are repeated on every row they apply to. In an operational database, that repetition is exactly what normalisation removes.

A **snowflake schema** normalises the dimensions. Category and department move into tables of their own, and `dim_product` keeps a key pointing at them:

```
fact_sales --> dim_product --> dim_category --> dim_department
```

The star needs one join to group sales by department:

```sql
SELECT p.department, SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p ON p.product_key = f.product_key
GROUP BY p.department;
```

The snowflake needs three, and two of them are only there to get from one table to the next:

```sql
SELECT dep.department, SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p      ON p.product_key      = f.product_key
JOIN dim_category c     ON c.category_key     = p.category_key
JOIN dim_department dep ON dep.department_key = c.department_key
GROUP BY dep.department;
```

That's the same chain of stepping-stone joins the dimensional model was built to get rid of. What it saves is some repeated text, but dimension tables are small. A retailer with 20,000 products repeating a category and a department on every row spends well under a megabyte on it, next to a fact table with many millions of rows.

The Kimball Group's advice is that "you should avoid snowflakes", because business users find them harder to follow and they can make queries slower ([Snowflaked Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/snowflake-dimension/)). When you're deciding where a piece of information goes, the default question is "can this live as a column on the dimension?", not "should this be its own table?".

[Back to contents](#contents)

## 7. Sources

1. Kimball, R. and Ross, M., *The Data Warehouse Toolkit*, 3rd ed., Wiley, 2013. Chapters 2 and 3 cover grain, measures, surrogate keys and slowly changing dimensions.
2. Kimball Group, [Grain](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/)
3. Kimball Group, [Additive, Semi-Additive, and Non-Additive Facts](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/)
4. Kimball Group, [Dimension Surrogate Keys](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/dimension-surrogate-key/)
5. Kimball Group, [Late Arriving Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/late-arriving-dimension/)
6. Kimball Group, [Type 1: Overwrite](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-1/)
7. Kimball Group, [Type 2: Add New Row](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/)
8. Kimball Group, [Snowflaked Dimensions](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/snowflake-dimension/)

[Back to contents](#contents)
