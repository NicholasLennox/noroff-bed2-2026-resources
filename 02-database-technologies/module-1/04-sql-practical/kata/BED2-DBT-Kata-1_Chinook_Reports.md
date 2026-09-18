# BED 2 Database Technologies - Kata 1

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

## How to read a request

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
