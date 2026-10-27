# OLAP Cubes

> In this lesson you will learn how a data warehouse is organised for reporting as an OLAP cube, made of measures and dimensions, and where that cube sits between the warehouse and the reports people read. You will then use SQL on a star schema to perform the five OLAP operations: slice, dice, drill-down, roll-up and pivot.
>
> New terms get a plain-English version in brackets.

**By the end of this lesson you should be able to:**

1. **Explain** the difference between OLAP and OLTP systems.
2. **Describe** how an OLAP cube connects a data warehouse to the reports in a BI tool.
3. **Identify** the measure and the dimensions in a reporting question.
4. **Explain** what the subtotal rows in a `GROUP BY CUBE` result represent.
5. **Describe** the five OLAP operations: slice, dice, drill-down, roll-up and pivot.
6. **Use** `WHERE` and `GROUP BY` to slice, dice, drill down and roll up a star schema.

## Contents

1. [OLAP and business intelligence](#1-olap-and-business-intelligence)
   - [1.1 OLAP and OLTP](#11-olap-and-oltp)
   - [1.2 From the warehouse to a report](#12-from-the-warehouse-to-a-report)
2. [The cube](#2-the-cube)
   - [2.1 Measures and dimensions](#21-measures-and-dimensions)
   - [2.2 The cube in SQL](#22-the-cube-in-sql)
   - [2.3 Subtotals and GROUP BY CUBE](#23-subtotals-and-group-by-cube)
3. [OLAP operations](#3-olap-operations)
   - [3.1 Slice](#31-slice)
   - [3.2 Dice](#32-dice)
   - [3.3 Drill-down](#33-drill-down)
   - [3.4 Roll-up](#34-roll-up)
   - [3.5 Pivot](#35-pivot)
4. [What you learned](#4-what-you-learned)
5. [Sources](#5-sources)

## 1. OLAP and business intelligence

### 1.1 OLAP and OLTP

Recall, databases fall into two groups, depending on what they're built for.

**OLTP** *[online transaction processing: a database built to record the business one transaction at a time]* is the operational side. The web shop and the tills are OLTP systems. They run the business day to day, so most of their work is inserting new rows: a sale, a payment, a new customer.

**OLAP** *[online analytical processing]* is the analytics side, and a data warehouse is an OLAP system. It's read-heavy, because most of its work is answering questions, and it keeps history, because the questions are usually about trends over time. The OLTP systems are its **sources**: their data is copied out and loaded into the warehouse.

Microsoft's Azure Architecture Center defines OLAP like this ([Online analytical processing](https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/online-analytical-processing)):

> Online analytical processing (OLAP) is a technology that organizes large business databases to perform complex calculations and trend analysis. This method enables intricate queries without disrupting transactional systems.

A report that adds up a year of sales has to read every sale from that year. Running it on the tills' database would slow the tills down while customers are waiting to pay, which is why reports run on a separate copy.

![Board titled OLAP Cubes and Reporting: OLAP leads to analytics, warehouse, read heavy and history, and OLTP leads to transactional, operational databases, insert heavy and day to day, with OLTP marked as the source for the warehouse. Below, the Azure Architecture Center definition of OLAP with large business databases, complex calculations, trend analysis and disrupting underlined](boards/01-olap-and-oltp.jpeg)

[Back to contents](#contents)

### 1.2 From the warehouse to a report

The same Microsoft article says that "OLAP systems efficiently extract business intelligence from data". **Business intelligence (BI)** *[using data to make business decisions]* is why a warehouse gets built in the first place: so that someone can decide which store needs more stock, or whether the web shop is worth investing in.

Getting from the source systems to that decision takes several steps:

1. **Data sources**, the OLTP systems, record the business.
2. **ETL** or **ELT** moves their data into the **data warehouse**.
3. **Data marts** *[smaller, focused sections of the warehouse, each serving one area of the business]* split it up for the people who use it.
4. **OLAP cubes** organise the data around the questions people ask, so the answers come back fast.
5. **BI tools** put those answers in front of people as **dashboards** and **reports**.

This lesson is about step 4, the cube.

For a long time, cubes lived on their own OLAP server. In Microsoft's products that was **SQL Server Analysis Services**, which provides "OLAP and data-mining functionality for business intelligence applications". Today a cube is more often built as a **semantic model** *[a model over the warehouse that gives the data friendly names, defines the calculations and holds the relationships, so users don't have to know the tables]*, and that's the name you'll see in **Power BI**, Microsoft's BI tool.

Power BI's semantic models are what Microsoft calls **tabular models**. They're built from tables and columns, but Microsoft notes that "internally, metadata is inherited from OLAP modeling constructs, such as cubes, dimensions, and measures". So when you build a semantic model in Power BI, you're building a cube.

![Board titled OLAP Cubes and Reporting. At the top, the quote that OLAP systems traditionally use multidimensional data cubes to support these complex queries, with an arrow to a sketched cube of store by product category by quarter, its axes labelled as dimensions and its values as measures. Below, a pipeline from three data sources through ETL or ELT into a data warehouse star schema, out to three data marts, then into OLAP cubes, then to BI tools producing dashboards and reports, labelled business intelligence. The OLAP cubes are circled and linked to semantic model, then to Power BI](boards/02-cubes-and-bi.jpeg)

[Back to contents](#contents)

## 2. The cube

### 2.1 Measures and dimensions

Take this question about the sales warehouse:

> Net sales, per product category, per store, per quarter.

**Net sales** is the number being worked out, which makes it the **measure**, and it comes from `net_amount` on `fact_sales`. Everything after it, *per product category, per store, per quarter*, is what that number gets broken down by. Those are the **dimensions**. Each one comes from a dimension table (`dim_product`, `dim_channel` and `dim_date`), and each one ends up in the `GROUP BY`.

Each dimension has a short list of values:

| Dimension | Values | Count |
|---|---|---|
| Product category | Bakery, Beverages, Cleaning, Paper, Snacks | 5 |
| Store | Bergen Sentrum, Oslo Grünerløkka, Trondheim Solsiden, Online | 4 |
| Quarter | 1, 2, 3, 4 | 4 |

"Store" is `dim_channel.store_name`, so the web shop is the fourth store, labelled `Online`.

Draw each dimension as an axis: categories up the side, stores along the bottom and quarters going back into the page. Every combination of one category, one store and one quarter is one small block, holding the net sales for that combination. For example, the block for Bakery in Bergen Sentrum in Q1 holds 427.00. There are 5 × 4 × 4 = 80 blocks in total.

So the dimensions tell you which block you're looking at, and the measure is the number inside it.

> That's called an **OLAP cube**, and each small block inside it is a **cell**.

This is what Microsoft means when it says OLAP systems "traditionally use multidimensional data cubes". With three dimensions you can draw the cube. With four or five it's still called a cube, but it can't be drawn.

A cell can also hold more than one measure. The Bakery, Bergen Sentrum, Q1 cell could hold the units sold, from `quantity`, alongside the net sales.

![Board titled OLAP operations. On the left, the star schema with fact_sales holding the measures and dim_date, dim_channel and dim_product ticked as the dimensions used, making the cube 3D. At the top, the question net sales per product category, per store, per quarter, with net sales labelled the measure and the rest labelled dimensions and GROUP BY. In the middle, the three dimensions with their values and counts 5, 4 and 4 giving 80, and below them the cube drawn with categories up the side, stores along the bottom and quarters going back. The Q1 face shows Bakery 427, 994, 448 and 1183 and Paper 236, 826, 413 and 354, with the 427 cell circled as the net amount measure. On the right, the counts become 6, 5 and 5 giving 150, with the note that OLAP cubes also include totals and subtotals such as the total for Q1 or for Online, and GROUP BY CUBE](boards/03-the-sales-cube.jpeg)

[Back to contents](#contents)

### 2.2 The cube in SQL

In SQL, the cube is a `GROUP BY` over all three dimensions:

```sql
SELECT p.category,
       ch.store_name,
       d.quarter,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
GROUP BY p.category, ch.store_name, d.quarter
ORDER BY d.quarter, p.category, ch.store_name;
```

It returns 80 rows, one per cell, and every cell has sales in it. Here are the first eight, which are Q1 for the first two categories:

| `category` | `store_name` | `quarter` | `net_sales` |
|---|---|---|---|
| Bakery | Bergen Sentrum | 1 | 427.00 |
| Bakery | Online | 1 | 1183.00 |
| Bakery | Oslo Grünerløkka | 1 | 994.00 |
| Bakery | Trondheim Solsiden | 1 | 448.00 |
| Beverages | Bergen Sentrum | 1 | 1155.00 |
| Beverages | Online | 1 | 1760.00 |
| Beverages | Oslo Grünerløkka | 1 | 1907.00 |
| Beverages | Trondheim Solsiden | 1 | 1093.00 |

[Back to contents](#contents)

### 2.3 Subtotals and GROUP BY CUBE

Many questions cover more than one cell. "How much did the Bergen store sell from the bakery this year?" adds up four cells, one per quarter. "What did the whole chain sell in Q3?" adds up all 20 cells in that quarter.

These totals are called **subtotals**. An OLAP cube works them out in advance and stores them alongside the cells, so asking for one is a lookup rather than a new query. Microsoft calls this pre-aggregated data, and points out that it "can also provide a large performance boost if you have several columns across many rows".

T-SQL can work out the same subtotals when the query runs. Change the `GROUP BY` to `GROUP BY CUBE`:

```sql
SELECT p.category,
       ch.store_name,
       d.quarter,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
GROUP BY CUBE (p.category, ch.store_name, d.quarter);
```

According to Microsoft's [GROUP BY documentation](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql), `CUBE` "produces all combinations of the specified columns ... plus the grand total". That's why the query returns 150 rows instead of 80. Each axis gains one extra position, meaning "all of them", so it's 6 × 5 × 5 = 150.

That extra position shows up as `NULL`. Here are some of the 150 rows:

| `category` | `store_name` | `quarter` | `net_sales` |
|---|---|---|---|
| Bakery | Bergen Sentrum | 1 | 427.00 |
| Bakery | Bergen Sentrum | 2 | 574.00 |
| Bakery | Bergen Sentrum | 3 | 931.00 |
| Bakery | Bergen Sentrum | 4 | 931.00 |
| Bakery | Bergen Sentrum | NULL | 2863.00 |
| Bakery | NULL | 1 | 3052.00 |
| NULL | NULL | 3 | 26473.30 |
| NULL | NULL | NULL | 95736.30 |

A `NULL` here doesn't mean a value is missing. It means that column has been added up across:

- `Bakery, Bergen Sentrum, NULL` is the Bergen bakery sales for the whole year: the four rows above it added together.
- `Bakery, NULL, 1` is bakery sales in Q1, across all four stores.
- `NULL, NULL, 3` is everything the chain sold in Q3.
- `NULL, NULL, NULL` is everything the chain sold, in every store, all year: the total net sales in the warehouse.

These subtotals only work because `net_amount` is an additive measure *[one that can be summed across every dimension and still mean something]*.

[Back to contents](#contents)

## 3. OLAP operations

Nobody reads all 80 cells at once. Microsoft describes what users do instead: they "segment multidimensional data into slices that they can view in two dimensions, such as a pivot table. Or they can filter the data by specific values." Each view answers one question, and the answer usually leads to the next one.

These ways of choosing a view are called the **OLAP operations**. There are five of them, and they come in three kinds:

- **Choosing part of the cube:** slice and dice.
- **Changing the level of detail:** drill-down and roll-up.
- **Changing the view:** pivot.

IBM's article [What is OLAP?](https://www.ibm.com/think/topics/olap) defines the five operations like this:

| Operation | Definition | In SQL |
|---|---|---|
| **Slice** | "creates a sub-cube by selecting a single dimension from the main OLAP cube" | `WHERE` on one dimension |
| **Dice** | "isolates a sub-cube by selecting several dimensions within the main OLAP cube" | `WHERE ... IN` on two or more dimensions |
| **Drill-down** | "converts less-detailed data into more-detailed data" | More, or finer, `GROUP BY` columns |
| **Roll-up** | "the opposite of the drill-down function" | Fewer, or coarser, `GROUP BY` columns |
| **Pivot** | "rotates the current cube view to display a new representation of the data" | `PIVOT`, or a spreadsheet pivot table |

Each operation below starts from the 80-cell cube, and every query is written out in full so you can run it yourself.

[Back to contents](#contents)

### 3.1 Slice

A **slice** cuts one layer off the cube by fixing one dimension to a single value. IBM's article uses the first quarter as its example, and that works here too:

```sql
SELECT p.category,
       ch.store_name,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE d.quarter = 1                       -- the slice: one value of one dimension
GROUP BY p.category, ch.store_name
ORDER BY p.category, ch.store_name;
```

Compared with the cube query, two things have changed. The `WHERE` keeps only Q1, and `d.quarter` has gone from the `SELECT` and the `GROUP BY`, because every row that's left has the same quarter.

It returns 20 rows, one per category and store. Here are the first eight:

| `category` | `store_name` | `net_sales` |
|---|---|---|
| Bakery | Bergen Sentrum | 427.00 |
| Bakery | Online | 1183.00 |
| Bakery | Oslo Grünerløkka | 994.00 |
| Bakery | Trondheim Solsiden | 448.00 |
| Beverages | Bergen Sentrum | 1155.00 |
| Beverages | Online | 1760.00 |
| Beverages | Oslo Grünerløkka | 1907.00 |
| Beverages | Trondheim Solsiden | 1093.00 |

With quarter fixed, three dimensions become two, and the result is a flat grid of categories by stores. Change the `1` to `2`, `3` or `4` and you get the other layers, one quarter at a time.

[Back to contents](#contents)

### 3.2 Dice

A **dice** picks some of the values on several dimensions at once. Take Beverages and Snacks, Bergen Sentrum and Online, and Q3 and Q4:

```sql
SELECT p.category,
       ch.store_name,
       d.quarter,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE p.category    IN ('Beverages', 'Snacks')          -- two of five categories
  AND ch.store_name IN ('Bergen Sentrum', 'Online')     -- two of four stores
  AND d.quarter     IN (3, 4)                           -- two of four quarters
GROUP BY p.category, ch.store_name, d.quarter
ORDER BY p.category, ch.store_name, d.quarter;
```

That's 2 × 2 × 2, so it returns 8 rows:

| `category` | `store_name` | `quarter` | `net_sales` |
|---|---|---|---|
| Beverages | Bergen Sentrum | 3 | 1445.00 |
| Beverages | Bergen Sentrum | 4 | 1198.00 |
| Beverages | Online | 3 | 2636.80 |
| Beverages | Online | 4 | 2919.60 |
| Snacks | Bergen Sentrum | 3 | 1270.00 |
| Snacks | Bergen Sentrum | 4 | 1296.00 |
| Snacks | Online | 3 | 3536.00 |
| Snacks | Online | 4 | 2238.60 |

A slice removes a dimension. A dice keeps all three and makes each of them shorter, so the result is still a cube, just a smaller one. In SQL, the difference is `=` on one dimension against `IN` on several.

Snacks sold online in Q3, at 3 536.00, is the biggest cell in the whole cube. When a number stands out like that, the next question is why, and drill-down is how you answer it.

![Board titled OLAP operations, listing slice, dice, drill down, roll up and pivot, with pivot linked to Excel. Top left, the full cube of category by store by quarter. Slice is written as a sub-cube by selecting a dimension, which is WHERE, with a sketch of the single Q1 layer and WHERE quarter = Q1. Dice is written as a sub-cube by selecting multiple dimensions, which is WHERE IN, with a sketch of a narrower cube keeping only the Bergen and Online stores and WHERE store IN Bergen, Online](boards/04-slice-and-dice.jpeg)

[Back to contents](#contents)

### 3.3 Drill-down

According to IBM, there are two ways to drill down: "moving down in the concept hierarchy or adding a new dimension to the cube".

A **concept hierarchy** *[the levels a dimension can be read at, from coarse to fine]* is already built into the date dimension. A year is made of quarters, a quarter is made of months, and a month is made of days. Drilling down from quarter to month means grouping by a finer column, so the **grain** *[the level of detail one row of a result represents]* gets finer too.

To find out why Snacks Online Q3 was so high, keep that cell fixed with a `WHERE`, and group by month instead of quarter:

```sql
SELECT d.month,
       d.month_name,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE p.category   = 'Snacks'
  AND ch.store_name = 'Online'
  AND d.quarter     = 3                   -- stay inside the one cell
GROUP BY d.month, d.month_name            -- one level down: quarter to month
ORDER BY d.month;
```

`d.month` is there so the months sort in calendar order, and `d.month_name` is there so you can read them.

| `month` | `month_name` | `net_sales` |
|---|---|---|
| 7 | July | 959.60 |
| 8 | August | 941.60 |
| 9 | September | 1634.80 |

September is nearly double the other two months, so the high quarter is really one high month. You could keep going down the same hierarchy, from the month to its days or to the days of the week, with the same move each time.

The product dimension has a hierarchy too: a department is made of categories, and a category is made of products. Drilling down from category to product is the same query with a different `GROUP BY`:

```sql
SELECT p.name,
       SUM(f.quantity)   AS units,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
WHERE p.category   = 'Snacks'
  AND ch.store_name = 'Online'
  AND d.quarter     = 3
GROUP BY p.name                           -- one level down: category to product
ORDER BY net_sales DESC;
```

| `name` | `units` | `net_sales` |
|---|---|---|
| Salted peanuts 300g | 29 | 1123.20 |
| Paprika crisps 200g | 32 | 1077.80 |
| Salted crisps 200g | 21 | 714.00 |
| Milk chocolate 200g | 14 | 621.00 |

Both drill-downs add back up to 3 536.00. Drilling down never changes the total. It shows you what the total was made of.

[Back to contents](#contents)

### 3.4 Roll-up

A roll-up adds cells together into bigger totals, either by moving up a hierarchy or by removing a dimension altogether. Because the result is less detailed, its grain is coarser.

Every column you leave out of the `GROUP BY` is added up across, so leaving a column out, or swapping it for a coarser one, is how SQL rolls up.

**Moving up a hierarchy: quarter to year.** Start from the cube query and replace `d.quarter` with `d.year`, one level up the date hierarchy:

```sql
SELECT p.category,
       ch.store_name,
       d.year,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p  ON p.product_key  = f.product_key
JOIN dim_channel ch ON ch.channel_key = f.channel_key
JOIN dim_date d     ON d.date_key     = f.date_key
GROUP BY p.category, ch.store_name, d.year       -- quarter replaced by year
ORDER BY p.category, ch.store_name;
```

It returns 20 rows. Here are the first four:

| `category` | `store_name` | `year` | `net_sales` |
|---|---|---|---|
| Bakery | Bergen Sentrum | 2025 | 2863.00 |
| Bakery | Online | 2025 | 5964.70 |
| Bakery | Oslo Grünerløkka | 2025 | 3857.00 |
| Bakery | Trondheim Solsiden | 2025 | 2184.00 |

Every sale in the warehouse is from 2025, so the year axis has only one value and each row covers the full year. Bakery in Bergen, 2 863.00, is its four quarters added together, which is the same number as the `Bakery, Bergen Sentrum, NULL` row from `GROUP BY CUBE`. With two years of sales, the same query would give each store and category one row per year.

**Removing a dimension: no stores.** Take `store_name` out of the query entirely, and the four stores are added together:

```sql
SELECT p.category,
       d.quarter,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_product p ON p.product_key = f.product_key
JOIN dim_date d    ON d.date_key    = f.date_key
GROUP BY p.category, d.quarter                   -- store left out, so added up across
ORDER BY p.category, d.quarter;
```

The join to `dim_channel` has gone too, because nothing from it is used any more. The query returns 20 rows, one per category and quarter. Here are the first four:

| `category` | `quarter` | `net_sales` |
|---|---|---|
| Bakery | 1 | 3052.00 |
| Bakery | 2 | 3832.50 |
| Bakery | 3 | 4085.20 |
| Bakery | 4 | 3899.00 |

Bakery in Q1, 3 052.00, is the same number as the `Bakery, NULL, 1` row from `GROUP BY CUBE`. The cube has gone from three dimensions to two.

**Subtotals at every level: `GROUP BY ROLLUP`.** The channel dimension has a hierarchy of its own. The three physical stores belong to the `Till` channel, and `Online` makes up the whole `Web` channel. `ROLLUP` walks up a hierarchy and returns a subtotal at every level on the way:

```sql
SELECT ch.channel,
       ch.store_name,
       SUM(f.net_amount) AS net_sales
FROM fact_sales f
JOIN dim_channel ch ON ch.channel_key = f.channel_key
GROUP BY ROLLUP (ch.channel, ch.store_name);     -- list the hierarchy top-down
```

There are no dates or products in this query, so every number is a total for the whole year and every product.

| `channel` | `store_name` | `net_sales` |
|---|---|---|
| Till | Bergen Sentrum | 17392.00 |
| Till | Oslo Grünerløkka | 26454.00 |
| Till | Trondheim Solsiden | 14703.00 |
| Till | NULL | 58549.00 |
| Web | Online | 37187.30 |
| Web | NULL | 37187.30 |
| NULL | NULL | 95736.30 |

According to Microsoft's documentation, `ROLLUP` "moves from right to left, decreasing the number of column expressions", which is why the hierarchy is listed top-down. Here, it first groups by `channel, store_name`, which gives one row per store. Then it drops `store_name`, which gives one row per channel, and finally it drops `channel`, which gives the grand total. As with `CUBE`, a `NULL` means "added up across": `Till, NULL` is all three tills together, and `NULL, NULL` is everything.

`CUBE` would also add a total per store across all channels, but each store belongs to only one channel, so those rows would just repeat the store rows.

[Back to contents](#contents)

### 3.5 Pivot

A pivot doesn't change any numbers. It changes which dimension runs down the side and which runs across the top. IBM compares it to a **pivot table** in Excel, which you may have used already.

Take the category-by-quarter result from the roll-up. As 20 rows of three columns it's hard to compare by eye, but with the quarters turned to run across the top, the same numbers fit in 5 rows of five columns:

```sql
SELECT category,
       [1] AS Q1,
       [2] AS Q2,
       [3] AS Q3,
       [4] AS Q4
FROM (
    SELECT p.category, d.quarter, f.net_amount
    FROM fact_sales f
    JOIN dim_product p ON p.product_key = f.product_key
    JOIN dim_date d    ON d.date_key    = f.date_key
) src
PIVOT (SUM(net_amount) FOR quarter IN ([1], [2], [3], [4])) pv
ORDER BY category;
```

| `category` | `Q1` | `Q2` | `Q3` | `Q4` |
|---|---|---|---|---|
| Bakery | 3052.00 | 3832.50 | 4085.20 | 3899.00 |
| Beverages | 5915.00 | 6255.90 | 6296.80 | 7239.60 |
| Cleaning | 4198.10 | 3954.20 | 5884.20 | 5532.10 |
| Paper | 1829.00 | 2419.00 | 2767.10 | 3298.10 |
| Snacks | 5132.70 | 6080.20 | 7440.00 | 6625.60 |

Now you can read a category's year along one line, or compare the categories in a quarter down one column.

There's a lot of new syntax in that query, and it's easiest to read from the inside out.

**The inner query picks the raw material.** It returns one row per fact row, with three columns, and each column has a job:

| Column | Its job in the pivot |
|---|---|
| `category` | Stays as the row label down the side |
| `quarter` | Its values become the new column headings |
| `net_amount` | Gets added up into each cell |

The inner query has no `GROUP BY` of its own, because `PIVOT` does the adding up. Microsoft's [PIVOT documentation](https://learn.microsoft.com/en-us/sql/t-sql/queries/from-using-pivot-and-unpivot) says it "also runs aggregations where they're required".

**`src` and `pv` are names.** A query inside a `FROM` has to be given a name, so the inner query is called `src`, short for source. The table that `PIVOT` produces needs a name as well, and that's `pv`. Neither name is used again, but the query won't run without them.

**The `PIVOT` line says how to turn the data**, in three parts:

```sql
PIVOT (SUM(net_amount) FOR quarter IN ([1], [2], [3], [4])) pv
--     what goes in     which column   the values that
--     each cell        becomes the    become the new
--                      headings       columns
```

**The square brackets are column names.** The new columns are named after the values they came from, so the column for quarter 1 is called `1`. A name that's just a number isn't a valid column name in T-SQL unless it's wrapped in square brackets, so `[1]` means "the column called 1", not the number 1. The outer `SELECT` then renames each one, for example `[1] AS Q1`.

**Every other column in the inner query becomes a row.** Any column in `src` that isn't being added up or turned into headings is used to group the rows. Microsoft calls these the **grouping columns**. Here that's only `category`, so there's one row per category. If the inner query also selected `store_name`, you'd get one row per category and store, 20 rows instead of 5, even though the outer `SELECT` never asks for the store.

**You have to list the values by hand.** `PIVOT` only makes the columns you name in the `IN` list. If you pivoted by year instead, every new year would have to be added to the list by hand before it showed up. That chore is one of the things a BI tool takes away, and you'll pivot the same numbers in Power BI by dragging a field instead.

![Board titled OLAP operations, listing slice, dice, drill down, roll up and pivot, with pivot linked to Excel. Drill down is written as a more detailed grain, or more GROUP BY, with a cube whose quarter axis has become months, from quarter to month to day of week. Roll up is written as less granular, coarser grain, aggregation and less GROUP BY, with a cube whose time axis is years, 2025 and 2026. Pivot is written as changing the representation of the data, with a cube turned so that quarters run up the side and categories along the bottom](boards/05-drill-roll-pivot.jpeg)

[Back to contents](#contents)

## 4. What you learned

You've now seen what reporting tools are built on, and done each of their moves by hand in SQL.

**A report question has a shape.** "Net sales, per category, per store, per quarter" is one measure and three dimensions. The measure is what gets added up, and the dimensions are what it's broken down by. Once you can split a question that way, you know what its `GROUP BY` is and what goes inside the `SUM`.

**The cube is every answer to that question at once.** Each combination of a category, a store and a quarter has its own cell, and a `GROUP BY` over the three dimensions returns all 80 of them. An OLAP cube keeps the subtotals as well, so the Bergen bakery sales for the whole year are ready before anyone asks. `GROUP BY CUBE` shows you those subtotals, with `NULL` standing for "all of them".

**Slicing and dicing choose which part of the cube to look at.** A slice fixes one dimension to one value and leaves a flat layer. A dice narrows several dimensions at once and leaves a smaller cube. Both are just a `WHERE`.

**Drill-down and roll-up change the level of detail.** Drilling down opens a total up into its months or its products, and rolling up adds cells back into quarters, years or channels. Both are the `GROUP BY` getting finer or coarser, and neither changes the total underneath.

**A pivot turns the result round without changing it.** The numbers stay the same, and only the side they're read from moves. Doing it in T-SQL means listing every value by hand, which is exactly the kind of work a BI tool does for you.

[Back to contents](#contents)

## 5. Sources

1. Microsoft Learn, [Online analytical processing (OLAP)](https://learn.microsoft.com/en-us/azure/architecture/data-guide/relational-data/online-analytical-processing), Azure Architecture Center
2. IBM, [What is OLAP?](https://www.ibm.com/think/topics/olap)
3. Microsoft Learn, [GROUP BY (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql)
4. Microsoft Learn, [Using PIVOT and UNPIVOT](https://learn.microsoft.com/en-us/sql/t-sql/queries/from-using-pivot-and-unpivot)

[Back to contents](#contents)
