# BED 2 Database Technologies - Kata 1

## Contents

- [Intro](#intro)
- [Setup](#setup)
- [From request to query](#from-request-to-query)
- [Category 1: One table](#category-1-one-table)
- [Category 2: Two tables](#category-2-two-tables)
- [Category 3: Counting and totalling](#category-3-counting-and-totalling)
- [Category 4: Reports](#category-4-reports)
- [Category 5: Stretch](#category-5-stretch)
- [Reflection](#reflection)
- [Self-study](#self-study)
  - [Category 6: Nested queries](#category-6-nested-queries)
  - [Category 7: Views](#category-7-views)
  - [Category 8: Stored procedures](#category-8-stored-procedures)

## Intro

This kata is about turning a plain-English request for a report into a `SELECT` query. Someone who does not write SQL describes what they want to see; you work out which tables hold it, how they join, and what to filter, group and sort by.

The database is **Chinook**, a sample music-store database: artists, albums, tracks, customers, employees, invoices and playlists. It is the same shape as the `ShopDb` from class, only bigger - 3,503 tracks and 412 invoices instead of a handful of rows.

Everything you need is in the [class lecture](../../03-using-sql-server/lecture.md) up to section 10, plus a few keywords that were not covered. Read the documentation for those rather than asking an AI:

- `SELECT`, including `DISTINCT` and `TOP`: https://learn.microsoft.com/en-us/sql/t-sql/queries/select-transact-sql
- `WHERE` and `IS NULL`: https://learn.microsoft.com/en-us/sql/t-sql/queries/is-null-transact-sql
- `IN`: https://learn.microsoft.com/en-us/sql/t-sql/language-elements/in-transact-sql
- `JOIN` and `LEFT JOIN`: https://learn.microsoft.com/en-us/sql/t-sql/queries/from-transact-sql
- `GROUP BY`: https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql
- `HAVING`: https://learn.microsoft.com/en-us/sql/t-sql/queries/select-having-transact-sql
- `COUNT`, including `COUNT(DISTINCT ...)`: https://learn.microsoft.com/en-us/sql/t-sql/functions/count-transact-sql
- `YEAR()`: https://learn.microsoft.com/en-us/sql/t-sql/functions/year-transact-sql
- `CAST()`: https://learn.microsoft.com/en-us/sql/t-sql/functions/cast-and-convert-transact-sql
- The Chinook database itself: https://github.com/lerocha/chinook-database

There are five categories, each harder than the last. In class, do at least two from each category. The rest are yours to work through in your own time. Each report comes with the number of rows a correct answer returns, so you can check yourself before looking at the answers.

Categories 6 to 8 are self-study: nested queries, views and stored procedures, none of which were covered in class. Each one explains the thing before asking you to use it.

## Setup

**Goal:** the `Chinook` database on your SQL Server, and its schema on screen.

1. Get [`Chinook_SqlServer.sql`](../Chinook_SqlServer.sql) from this folder. It is one script that creates the database, every table, and all the data.
2. Open it in VS Code and run the whole thing against your `sa` connection from the **mssql** extension. It takes a few seconds - there are several thousand `INSERT` statements.
3. Refresh the connection tree. `Chinook` should be there with 11 tables.
4. Right-click the database and choose **Visualize and Design Schema...**. Keep this diagram open; every report below is a question about which boxes to connect.

The tables, in the order you will meet them:

| Table | One row is | Points at |
|---|---|---|
| `Artist` | a band or performer | - |
| `Album` | an album | `Artist` |
| `Track` | one song or episode | `Album`, `Genre`, `MediaType` |
| `Genre` | a genre name | - |
| `MediaType` | a file format | - |
| `Customer` | a customer | `Employee` (via `SupportRepId`) |
| `Employee` | a member of staff | `Employee` (via `ReportsTo`) |
| `Invoice` | one purchase | `Customer` |
| `InvoiceLine` | one track on one invoice | `Invoice`, `Track` |
| `Playlist` | a playlist | - |
| `PlaylistTrack` | one track on one playlist | `Playlist`, `Track` |

Every price is in `Track.UnitPrice` and `InvoiceLine.UnitPrice`. Every track length is in `Track.Milliseconds`.

**Verification:** `SELECT COUNT(*) FROM Track;` returns 3503.

## From request to query

Before writing anything, answer four questions about the request:

1. **Which tables?**

   Every noun in the request lives somewhere. "Customers in Canada" is `Customer`. "Albums by Iron Maiden" is `Album` and `Artist`.

2. **One row per what?**

   A list of customers is one row per customer. A count of customers per country is one row per country. This decides whether there is a `GROUP BY`, and what goes in it.

3. **Which columns?**

   The request usually names them. If it does not, pick the ones that make the row identifiable.

4. **Filtered, grouped, sorted?**

   "In Canada" is a `WHERE`. "Per country" is a `GROUP BY`. "Biggest first" is an `ORDER BY ... DESC`. "Top 10" is a `TOP`.

Write the `FROM` and `JOIN`s first and run it with `SELECT *`. Look at the rows. Then narrow the columns, then filter, then group, then sort. Run it after every change.

## Category 1: One table

`SELECT`, `WHERE`, `LIKE`, `ORDER BY`, `TOP`, `DISTINCT`, `IS NULL`. No joins.

**1.1 Customers in Canada**

Marketing want to email everyone we have in Canada. Give them first name, last name, city and email address.

*8 rows.*

**1.2 Countries we sell in**

Which countries do we have customers in? Just the list of country names, each once, alphabetical.

*24 rows.*

**1.3 The longest tracks**

The ten longest tracks in the catalogue, with their length in minutes to one decimal place. Longest first.

*10 rows.* Track length is stored in `Milliseconds`, and there are 60,000 of those in a minute. Dividing an integer by `60000` throws the decimals away; dividing by `60000.0` keeps them. `CAST(... AS DECIMAL(5,1))` rounds the result to one decimal place.

**1.4 Love songs**

Every track whose name starts with "Love", with the composer. Sorted by track name.

*27 rows.*

**1.5 Big invoices this year**

Every invoice from 2025 worth more than 10 dollars: invoice number, date, billing country and total. Most recent first.

*12 rows.*

**1.6 Business customers**

Which customers have a company name on file? Name, company and country.

*10 rows.*

## Category 2: Two tables

`JOIN`, `LEFT JOIN`, table aliases, and a `WHERE` on the joined table.

**2.1 Live albums**

Every album with "Live" somewhere in its title, with the name of the artist who made it. Sorted by artist, then title.

*17 rows.*

**2.2 Iron Maiden's albums**

Just the titles of every album by Iron Maiden.

*21 rows.*

**2.3 Who looks after whom**

Every customer with the name of their support rep. Customer name and country, then the rep's first and last name. Sort by rep surname, then customer surname.

*59 rows.*

**2.4 The bossa nova catalogue**

Every bossa nova track: track name, genre and price. Sorted by track name.

*15 rows.*

**2.5 Artists with nothing in the catalogue**

Which artists are in the database but have no albums at all? Names only, alphabetical.

*71 rows.*

## Category 3: Counting and totalling

`GROUP BY` with `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. `HAVING`. `YEAR()`.

**3.1 Customers per country**

How many customers do we have in each country? Biggest first, and alphabetical within ties.

*24 rows.*

**3.2 The biggest albums**

The ten albums with the most tracks: title and track count, most tracks first.

*10 rows.*

**3.3 Sales per year**

For each year we have been trading: the number of invoices and the total revenue.

*5 rows.*

**3.4 Prolific artists**

Which artists have five or more albums in the catalogue? Artist name and album count, most albums first.

*7 rows.*

**3.5 Track length by genre** - *hard*

For each genre: how many tracks, and the average, shortest and longest length in minutes to one decimal place. Longest average first.

*25 rows.* The minutes conversion is the same as in 1.3, applied to each aggregate. Get the four numbers in milliseconds first, then convert.

**3.6 Customers per employee**

For every employee - not just the sales staff - how many customers they are the support rep for. Name, job title and count, biggest first.

*8 rows.*

## Category 4: Reports

Three or more tables, with a `GROUP BY` on top.

**4.1 Most popular genre**

Which genre sells the most? For every genre, the number of tracks we have sold in it, best-selling first.

*24 rows.*

**4.2 Best customers**

Our top ten customers by the total amount they have spent with us. Name, country and total.

*10 rows.*

**4.3 Best-earning artists**

The ten artists whose tracks have made us the most money. Artist name and revenue.

*10 rows.*

**4.4 Sales by rep**

For each sales rep: how many invoices their customers have generated, and the total revenue. Highest revenue first.

*3 rows.*

**4.5 The Grunge playlist**

Every track on the playlist called "Grunge", with its artist and album. Sorted by artist then track.

*15 rows.*

**4.6 Sales by country**

For each country: how many customers, how many invoices, and the total revenue. Highest revenue first.

*24 rows.*

## Category 5: Stretch

Nothing new in the syntax; the difficulty is in reading the request correctly.

**5.1 The org chart**

Every employee with the name of the person they report to. Include the one person who reports to nobody.

*8 rows.*

**5.2 Tracks per playlist**

Every playlist and how many tracks are on it, including the empty ones. Sort by count, biggest first.

*18 rows.*

**5.3 Dead stock**

How many tracks in the catalogue have never been sold? One number.

*1 row.*

**5.4 Genre trends**

For Rock, Latin and Metal only: the revenue from each genre in each year. One row per year per genre, ordered by year and then by revenue within the year.

*15 rows.*

**5.5 The 45-dollar club**

Every customer whose total spend is over 45 dollars: name, email, number of invoices, total spent. Highest first.

*5 rows.*

## Reflection

- In 5.2, change the `GROUP BY` to group on the playlist name only, and run it. You get 14 rows instead of 18, and the `Music` playlist has 6,580 tracks. Where did the other four rows go, and what does the 6,580 tell you about grouping on a name?
- In 4.6, replace `COUNT(DISTINCT c.CustomerId)` with `COUNT(c.CustomerId)`. The USA now has 91 customers instead of 13. What is actually being counted, and why did the join change it?
- In 3.6, change the `LEFT JOIN` to a `JOIN`. Who disappears from the report? Explain why the manager who asked for it would consider the shorter version wrong.
- In 4.1, replace `SUM(il.Quantity)` with `COUNT(il.InvoiceLineId)`. Every number is the same. Are the two queries asking the same question? Check the `Quantity` column before you answer.
- Every query in category 4 that reaches `Genre` or `Artist` goes through `Track`. Look at the schema diagram: why can `Invoice` not be joined to `Genre` directly, and what would the database have to look like for that to be possible?

## Self-study

There are three things we didn't cover in class, and that is what this section is for. Each one starts with an explanation and an example taken from something you have already done in this kata, so you can see the new idea working on a query you already understand. After that there are reports to practise it on. Some of them are earlier reports done again the new way, so you can check yourself the same way as before: the row count should match, and so should the answer sheet.

The documentation:

- Subqueries: https://learn.microsoft.com/en-us/sql/relational-databases/performance/subqueries
- Views: https://learn.microsoft.com/en-us/sql/relational-databases/views/views
- `CREATE VIEW`: https://learn.microsoft.com/en-us/sql/t-sql/statements/create-view-transact-sql
- Stored procedures: https://learn.microsoft.com/en-us/sql/relational-databases/stored-procedures/stored-procedures-database-engine
- `CREATE PROCEDURE`: https://learn.microsoft.com/en-us/sql/t-sql/statements/create-procedure-transact-sql
- `EXEC`: https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql
- `GO`: https://learn.microsoft.com/en-us/sql/t-sql/language-elements/sql-server-utilities-statements-go
- `sp_helptext`: https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-helptext-transact-sql

## Category 6: Nested queries

A **subquery** *[a `SELECT` written inside another statement, in brackets]* is a query inside a query. The inner one runs first, and the outer one uses whatever it returns. Where you can put it depends on the shape of what comes back, and there are three shapes.

**One value.** If the subquery returns one row with one column, you can put it anywhere a value goes. The average track length is a query, so "longer than the average track" is just a comparison against that query:

```sql
WHERE Milliseconds > (SELECT AVG(Milliseconds) FROM Track)
```

Without the subquery you would have to run the average first, read the number off the screen and type it into the `WHERE` yourself - and that number is out of date the next time a track is added.

**One column.** If the subquery returns one column, what you have is a list, and `IN` and `NOT IN` check whether a value is on it. You have already answered a question like this: 2.5 asked for artists with no albums, and we did it with a `LEFT JOIN` and `WHERE al.AlbumId IS NULL`. Here it is as a subquery:

```sql
SELECT Name
FROM Artist
WHERE ArtistId NOT IN (SELECT ArtistId FROM Album)
ORDER BY Name;
```

The inner query is the list of every `ArtistId` that an album points at. The outer query keeps the artists whose ID is not on that list. You get the same 71 rows, and the query now reads the way the request was worded.

**A table.** If the subquery is in the `FROM` clause, it is a **derived table** *[a result set given an alias, so the outer query can treat it as a table]*. The outer query can select from it, filter it, join to it and aggregate over it, exactly as it would with a real table:

```sql
SELECT ...
FROM (
    SELECT CustomerId, SUM(Total) AS TotalSpent
    FROM Invoice
    GROUP BY CustomerId
) AS s
```

As far as the outer query is concerned, `s` is a table with two columns, `CustomerId` and `TotalSpent`, and one row per customer. This is the shape you need when you want an aggregate of an aggregate. The total per customer is a `SUM`, the average of those totals is an `AVG`, and you cannot write `AVG(SUM(Total))` in one `SELECT`. So the inner query does the first step and the outer query does the second.

Two rules: a derived table has to have an alias, and it cannot contain an `ORDER BY`. Sorting is the outer query's job.

**6.1 Above-average tracks**

How many tracks are longer than the average track? One number.

*1 row.*

**6.2 Dead stock, again**

5.3 without a join: how many tracks have never been sold? One number.

*1 row.* Same answer as 5.3.

**6.3 Iron Maiden's customers**

Every customer who has bought at least one Iron Maiden track. Name and country, each customer once, sorted by surname.

*27 rows.*

**6.4 The average customer**

What does the average customer spend with us in total? One number, to two decimal places.

*1 row.* Two steps: the total for each customer, then the average of those totals.

**6.5 Above-average customers**

Every customer whose total spend is above the average from 6.4: name, country and total. Highest first.

*22 rows.* 5.5, with the 45 replaced by a query.

### Reflection

- In 6.4, replace your whole query with `SELECT AVG(Total) FROM Invoice`. You get 5.65 instead of 39.47. What is that the average of?
- **Break it.** "Every employee who is nobody's manager" can be written as `WHERE EmployeeId NOT IN (SELECT ReportsTo FROM Employee)`. Run it, then run the subquery on its own and look at the first row. Why does the whole query return nothing?
- 6.3 can also be written as a chain of joins with `DISTINCT` on the `SELECT`. Write it that way. Why does the join version need the `DISTINCT` when the `IN` version does not?

## Category 7: Views

A **view** is a `SELECT` statement saved in the database under a name, that you then query as if it were a table:

```sql
GO
CREATE VIEW CustomerSpend AS
SELECT ...
FROM Customer AS c
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY ...;
GO
```

Once it exists, `SELECT * FROM CustomerSpend` runs the saved query, and you can use `CustomerSpend` anywhere you would use a table - in a `FROM`, a `JOIN`, a `WHERE ... IN`. It is the derived table from category 6, but with a name, and it stays in the database.

What the server stores is the query, not the result. Every time you `SELECT` from the view it runs the query underneath against the tables as they are right now, so a view is never out of date and takes up no space. SQL Server can also store a view's result and keep it current - that is an **indexed view** *[a view whose result is physically stored and maintained, like a table]*, and it is where a view becomes a performance tool. We are not going there in this kata.

What a view is for is the query you would otherwise write over and over. The four-table join that every report on artists needs gets written once and tested once, and after that every report against it is a line. It is also a boundary: you can give someone permission to read the view without giving them the tables underneath it.

There are a few rules the server enforces:

- `CREATE VIEW` has to be the first statement in its batch, so put `GO` on the line before it.
- To change a view, use `CREATE OR ALTER VIEW` and it replaces the saved query. `DROP VIEW name` removes it.
- The view shows up in the connection tree under the database's **Views** folder, and `EXEC sp_helptext 'CustomerSpend'` prints back what you saved.

**7.1 CustomerSpend**

Create a view called `CustomerSpend` with one row per customer: customer ID, first name, last name, country, email, number of invoices and total spent.

**Verification:** `SELECT COUNT(*) FROM CustomerSpend;` returns 59.

**7.2 The 45-dollar club, again**

5.5 from the view: every customer whose total spend is over 45 dollars. Name, email, number of invoices, total spent, highest first.

*5 rows.*

**7.3 Above-average customers, again**

6.5 from the view: every customer whose total spend is above the average customer's. Name, country and total, highest first. Both the average and the list come from `CustomerSpend`.

*22 rows.*

**7.4 TrackCatalogue**

Create a view called `TrackCatalogue` with one row per track: track ID, track name, album title, artist name, genre, media type, length in minutes to one decimal place, and price.

**Verification:** `SELECT COUNT(*) FROM TrackCatalogue;` returns 3503.

**7.5 Best-earning artists, again**

4.3 from the view: the ten artists whose tracks have made us the most money. Artist name and revenue.

*10 rows.*

**7.6 The Grunge playlist, again**

4.5 from the view: every track on the "Grunge" playlist with its artist and album, sorted by artist then track.

*15 rows.*

### Reflection

- **Break it.** Add `ORDER BY TotalSpent DESC` to the end of `CustomerSpend`'s query and run it again with `CREATE OR ALTER VIEW`. Read the error. Why does the server refuse a sort inside a view when it accepts one in every `SELECT` from it?
- 3.5 says the average Science Fiction track is 43.8 minutes. `SELECT Genre, AVG(Minutes) FROM TrackCatalogue GROUP BY Genre` says 43.7. Which is right, and what did the view decide on your behalf?
- 7.5 is four lines shorter than 4.3. Is it doing less work? Use what the section says a view stores to answer.

## Category 8: Stored procedures

A **stored procedure** *[a named block of SQL saved in the database, run with `EXEC`, that can take parameters]* is a query saved in the database that you run rather than read from, and that can take inputs. 1.1 asked for the customers in Canada. Here it is as a procedure where the country is an input:

```sql
GO
CREATE PROCEDURE CustomersIn
    @Country NVARCHAR(40)
AS
BEGIN
    SELECT FirstName, LastName, City, Email
    FROM Customer
    WHERE Country = @Country;
END
GO

EXEC CustomersIn @Country = 'Canada';
EXEC CustomersIn 'Brazil';
```

A **parameter** *[a named input to the procedure, declared with a type]* is written `@Name` and given a type, the same types that columns have. Inside the body it stands wherever the literal value would have been. `EXEC` fills it in, either by name or by position, and the same saved query answers a different question every time you call it.

A view is a table you read; a procedure is a command you run. A view cannot take a parameter, and you cannot put a procedure in a `FROM`. A procedure can also hold more than one statement, and they do not have to be `SELECT`s - a procedure can insert, update and delete.

What a procedure really changes is where the SQL lives. Your API from BED1 had Sequelize build every query and send it across the network. With a procedure the SQL stays next to the data. The API sends one line, `EXEC TopCustomers @Count = 10`, and Sequelize can send it with [`sequelize.query`](https://sequelize.org/docs/v6/core-concepts/raw-queries/). The query gets written and tested once, in the database, and SQL Server compiles its execution plan the first time it runs and reuses it after that.

The rules are the same as for views: `CREATE PROCEDURE` has to be first in its batch, `CREATE OR ALTER PROCEDURE` changes one, and `DROP PROCEDURE` removes it. Procedures show up in the connection tree under **Programmability**.

**8.1 AlbumsByArtist**

A procedure that takes an artist's name and returns their album titles, alphabetical. 2.2 with the name as a parameter.

**Verification:** `EXEC AlbumsByArtist 'Iron Maiden';` returns 21 rows. `'Led Zeppelin'` returns 14.

**8.2 TopCustomers**

A procedure that takes a number and returns that many customers, highest total spend first: name, country and total. Use `CustomerSpend` from 7.1. `TOP` accepts a parameter, in brackets.

**Verification:** `EXEC TopCustomers @Count = 5;` returns 5 rows, starting with Helena Holý.

**8.3 CustomersInCountry**

A procedure that takes a country and returns its customers from `CustomerSpend`: name, email, number of invoices and total spent, highest first.

**Verification:** `EXEC CustomersInCountry 'Canada';` returns 8 rows.

**8.4 RevenueBetween**

A procedure that takes two dates and returns the number of invoices and the revenue between them, inclusive. One row.

**Verification:** `EXEC RevenueBetween '2025-01-01', '2025-06-30';` returns 38 invoices and 211.86. The whole of 2025 matches the last row of 3.3.

**8.5 GenreRevenue**

A procedure that takes a genre name and a year and returns the revenue from that genre in that year. One row.

**Verification:** `EXEC GenreRevenue 'Metal', 2024;` returns 65.34. Check it against 5.4.

### Reflection

- Run `EXEC AlbumsByArtist;` with no argument, then `EXEC AlbumsByArtist 'Nobody';`. One is an error and one is an empty result. Why does the server treat those two differently?
- **Break it.** Create a procedure whose body is `SELECT Name FROM Tracks;` - with an `s`. Does the `CREATE` succeed? Does the `EXEC`? What does that tell you about when the server checks the names inside a procedure?
- Your BED1 API asked Sequelize to build every `SELECT`. Suppose it ran `EXEC TopCustomers @Count = 10` instead, and the report then needed a new column. Which program has to change?
- 7.1 and 8.3 both produce per-customer spend. You need "customers in a country" as something the API can call. It could run `EXEC CustomersInCountry 'Canada'`, or send `SELECT ... FROM CustomerSpend WHERE Country = 'Canada'` itself. What does the API have to know about the database in each case?
