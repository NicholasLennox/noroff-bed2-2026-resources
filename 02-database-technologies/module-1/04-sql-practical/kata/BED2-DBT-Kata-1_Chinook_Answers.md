# BED 2 Database Technologies - Kata 1 - Answers

> One answer per report: the query, what it returns, and how to get from the request to the query. Every result here was produced by running the query shown against the Chinook database, so your rows should match. Column names and sort order can differ from yours and still be right; the rows should not. Results longer than twelve rows show the first ten.

## Category 1: One table

### 1.1 Customers in Canada

```sql
SELECT FirstName, LastName, City, Email
FROM Customer
WHERE Country = 'Canada';
```

| FirstName | LastName | City | Email |
|---|---|---|---|
| François | Tremblay | Montréal | ftremblay@gmail.com |
| Mark | Philips | Edmonton | mphilips12@shaw.ca |
| Jennifer | Peterson | Vancouver | jenniferp@rogers.ca |
| Robert | Brown | Toronto | robbrown@shaw.ca |
| Edward | Francis | Ottawa | edfrancis@yachoo.ca |
| Martha | Silk | Halifax | marthasilk@gmail.com |
| Aaron | Mitchell | Winnipeg | aaronmitchell@yahoo.ca |
| Ellie | Sullivan | Yellowknife | ellie.sullivan@shaw.ca |

The request names the table (customers), the filter (Canada) and the four columns. `Country` is a column on `Customer`, so no join. `=` is an exact match; `'canada'` would also work because SQL Server's default collation *[the rules it uses to compare text]* ignores case.

### 1.2 Countries we sell in

```sql
SELECT DISTINCT Country
FROM Customer
ORDER BY Country;
```

| Country |
|---|
| Argentina |
| Australia |
| Austria |
| Belgium |
| Brazil |
| Canada |
| Chile |
| Czech Republic |
| Denmark |
| Finland |

*24 rows.*

"Each once" is `DISTINCT`. Without it you get 59 rows - one per customer - with USA appearing 13 times. `DISTINCT` collapses identical rows after the `SELECT` has picked its columns, so it only makes sense when the column list is narrow.

### 1.3 The longest tracks

```sql
SELECT TOP (10) Name, CAST(Milliseconds / 60000.0 AS DECIMAL(5,1)) AS Minutes
FROM Track
ORDER BY Milliseconds DESC;
```

| Name | Minutes |
|---|---|
| Occupation / Precipice | 88.1 |
| Through a Looking Glass | 84.8 |
| Greetings from Earth, Pt. 1 | 49.3 |
| The Man With Nine Lives | 49.3 |
| Battlestar Galactica, Pt. 2 | 49.3 |
| Battlestar Galactica, Pt. 1 | 49.2 |
| Murder On the Rising Star | 48.9 |
| Battlestar Galactica, Pt. 3 | 48.8 |
| Take the Celestra | 48.8 |
| Fire In Space | 48.8 |

Three parts. "Ten" is `TOP (10)`, "longest first" is `ORDER BY Milliseconds DESC`, and `TOP` only means anything once the rows are sorted. "In minutes" is arithmetic in the `SELECT`: a track's length is stored in milliseconds, and there are 60,000 of those in a minute. Dividing by `60000` gives a whole number because both sides are integers; `60000.0` forces a decimal result. `CAST(... AS DECIMAL(5,1))` rounds that to one decimal place.

The top two are TV episodes, not songs. Chinook's `Track` table holds both.

### 1.4 Love songs

```sql
SELECT Name, Composer
FROM Track
WHERE Name LIKE 'love%'
ORDER BY Name;
```

| Name | Composer |
|---|---|
| Love | NULL |
| Love Ain't No Stranger | Galley |
| Love And Marriage | jimmy van heusen/sammy cahn |
| Love And Peace Or Else | Adam Clayton, Bono, Larry Mullen & The Edge |
| Love Bites | NULL |
| Love Boat Captain | Eddie Vedder |
| Love Child | Bolin/Coverdale |
| Love Comes | Darius "Take One" Minwalla/Jon Auer/Ken Stringfellow/Matt Harris |
| Love Comes Tumbling | U2 |
| Love Conquers All | Blackmore, Glover, Turner |

*27 rows.*

"Starts with" is `LIKE 'love%'` - the `%` only on the right. `'%love%'` finds "love" anywhere and returns 114 rows, including "Calling Dr. Love" and "All My Love". The match is case-insensitive, so `'love%'` finds "Love". Some composers are `NULL`: the data does not have one for every track, and a `SELECT` shows the gap rather than hiding the row. "Loverman" and "Loves Been Good To Me" are in the 27 too - `'love%'` does not know where a word ends.

### 1.5 Big invoices this year

```sql
SELECT InvoiceId, InvoiceDate, BillingCountry, Total
FROM Invoice
WHERE Total > 10 AND InvoiceDate >= '2025-01-01'
ORDER BY InvoiceDate DESC;
```

| InvoiceId | InvoiceDate | BillingCountry | Total |
|---|---|---|---|
| 411 | 2025-12-14 00:00:00.000 | Finland | 13.86 |
| 404 | 2025-11-13 00:00:00.000 | Czech Republic | 25.86 |
| 397 | 2025-10-13 00:00:00.000 | USA | 13.86 |
| 390 | 2025-09-12 00:00:00.000 | Netherlands | 13.86 |
| 383 | 2025-08-12 00:00:00.000 | Brazil | 13.86 |
| 376 | 2025-07-12 00:00:00.000 | Canada | 13.86 |
| 369 | 2025-06-11 00:00:00.000 | United Kingdom | 13.86 |
| 362 | 2025-05-11 00:00:00.000 | Canada | 13.86 |
| 355 | 2025-04-10 00:00:00.000 | Portugal | 13.86 |
| 348 | 2025-03-10 00:00:00.000 | Argentina | 13.86 |
| 341 | 2025-02-07 00:00:00.000 | USA | 13.86 |
| 334 | 2025-01-07 00:00:00.000 | France | 13.86 |

Two conditions joined with `AND`: both must hold for a row to survive. The date comparison works because a string like `'2025-01-01'` converts to a date, and dates compare in order. `WHERE YEAR(InvoiceDate) = 2025` says the same thing and reads more like the request; 3.3 uses that form. On its own `Total > 10` matches 64 invoices - the year condition is doing most of the narrowing.

### 1.6 Business customers

```sql
SELECT FirstName, LastName, Company, Country
FROM Customer
WHERE Company IS NOT NULL;
```

| FirstName | LastName | Company | Country |
|---|---|---|---|
| Luís | Gonçalves | Embraer - Empresa Brasileira de Aeronáutica S.A. | Brazil |
| František | Wichterlová | JetBrains s.r.o. | Czech Republic |
| Eduardo | Martins | Woodstock Discos | Brazil |
| Alexandre | Rocha | Banco do Brasil S.A. | Brazil |
| Roberto | Almeida | Riotur | Brazil |
| Mark | Philips | Telus | Canada |
| Jennifer | Peterson | Rogers Canada | Canada |
| Frank | Harris | Google Inc. | USA |
| Jack | Smith | Microsoft Corporation | USA |
| Tim | Goyer | Apple Inc. | USA |

"Has a company on file" means the column is not empty. `NULL` is not a value, so `Company <> NULL` and `Company = NULL` both return nothing - `NULL` compared to anything is unknown, and `WHERE` only keeps rows where the condition is true. `IS NULL` and `IS NOT NULL` are the only way to test for it.

## Category 2: Two tables

### 2.1 Live albums

```sql
SELECT al.Title, ar.Name AS Artist
FROM Album AS al
JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
WHERE al.Title LIKE '%live%'
ORDER BY ar.Name, al.Title;
```

| Title | Artist |
|---|---|
| Alcohol Fueled Brewtality Live! [Disc 1] | Black Label Society |
| Alcohol Fueled Brewtality Live! [Disc 2] | Black Label Society |
| Acústico MTV [Live] | Cidade Negra |
| Quanta Gente Veio Ver (Live) | Gilberto Gil |
| A Real Live One | Iron Maiden |
| Live After Death | Iron Maiden |
| Live At Donington 1992 (Disc 1) | Iron Maiden |
| Live At Donington 1992 (Disc 2) | Iron Maiden |
| Unplugged [Live] | Kiss |
| BBC Sessions [Disc 1] [Live] | Led Zeppelin |

*17 rows.*

Album titles are in `Album`; artist names are in `Artist`. `Album.ArtistId` points at `Artist.ArtistId`, and that pair of columns is the `ON`. One row per album, because each album has exactly one artist. The `WHERE` is on the `Album` side and works exactly as it did with one table; the join just adds the artist's name to each row that survives. `ar.Name AS Artist` gives the column a heading that makes sense in the output - without it, the column is called `Name` and nothing says whose.

Leave the `WHERE` off and you get the whole catalogue, 347 rows. Run it that way once to see the join working before you narrow it.

### 2.2 Iron Maiden's albums

```sql
SELECT al.Title
FROM Album AS al
JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
WHERE ar.Name = 'Iron Maiden';
```

| Title |
|---|
| A Matter of Life and Death |
| A Real Dead One |
| A Real Live One |
| Brave New World |
| Dance Of Death |
| Fear Of The Dark |
| Iron Maiden |
| Killers |
| Live After Death |
| Live At Donington 1992 (Disc 1) |

*21 rows.*

Same join as 2.1, then a `WHERE` on a column from the *other* table. The join is there only so the filter has something to test: nothing from `Artist` appears in the output. This shape - join to a table just to filter on it - is common. The alternative, looking up Iron Maiden's `ArtistId` by hand and writing `WHERE ArtistId = 90`, works once and breaks the moment the data is reloaded.

### 2.3 Who looks after whom

```sql
SELECT c.FirstName, c.LastName, c.Country, e.FirstName AS RepFirstName, e.LastName AS RepLastName
FROM Customer AS c
JOIN Employee AS e ON c.SupportRepId = e.EmployeeId
ORDER BY e.LastName, c.LastName;
```

| FirstName | LastName | Country | RepFirstName | RepLastName |
|---|---|---|---|---|
| Julia | Barnett | USA | Steve | Johnson |
| Kathy | Chase | USA | Steve | Johnson |
| Marc | Dubois | France | Steve | Johnson |
| Astrid | Gruber | Austria | Steve | Johnson |
| Helena | Holý | Czech Republic | Steve | Johnson |
| Joakim | Johansson | Sweden | Steve | Johnson |
| Leonie | Köhler | Germany | Steve | Johnson |
| Lucas | Mancini | Italy | Steve | Johnson |
| Enrique | Muñoz | Spain | Steve | Johnson |
| Steve | Murray | United Kingdom | Steve | Johnson |

*59 rows.*

The foreign key is not called `EmployeeId` on the customer side - it is `SupportRepId`. The schema diagram shows the line; the column names on each end of it are what go in the `ON`. Both tables have `FirstName` and `LastName`, so without aliases on the `SELECT` columns the server refuses with "Ambiguous column name", and without `AS RepFirstName` the output has two columns with the same heading.

### 2.4 The bossa nova catalogue

```sql
SELECT t.Name, g.Name AS Genre, t.UnitPrice
FROM Track AS t
JOIN Genre AS g ON t.GenreId = g.GenreId
WHERE g.Name = 'Bossa Nova'
ORDER BY t.Name;
```

| Name | Genre | UnitPrice |
|---|---|---|
| Berimbau | Bossa Nova | .99 |
| Canto De Ossanha | Bossa Nova | .99 |
| Carta Ao Tom 74 | Bossa Nova | .99 |
| Como É Duro Trabalhar | Bossa Nova | .99 |
| Deixa | Bossa Nova | .99 |
| Formosa | Bossa Nova | .99 |
| Minha Namorada | Bossa Nova | .99 |
| Onde Anda Você | Bossa Nova | .99 |
| Por Que Será | Bossa Nova | .99 |
| Pot-Pourri N.º 2 | Bossa Nova | .99 |
| Pot-Pourri N.º 4 | Bossa Nova | .99 |
| Pot-Pourri N.º 5 | Bossa Nova | .99 |
| Samba Da Bênção | Bossa Nova | .99 |
| Samba Da Volta | Bossa Nova | .99 |
| Samba Em Prelúdio | Bossa Nova | .99 |

The same shape as 2.2 with different tables. `Genre` is a **lookup table** *[a small table whose only job is to give a name to an ID that other tables store]* - 25 rows, two columns. `Track` stores `GenreId`; to filter on the words "Bossa Nova" you have to join to where the words live. Both tables have a `Name` column, which is why `t.Name` and `g.Name` need the prefixes.

### 2.5 Artists with nothing in the catalogue

```sql
SELECT ar.Name
FROM Artist AS ar
LEFT JOIN Album AS al ON ar.ArtistId = al.ArtistId
WHERE al.AlbumId IS NULL
ORDER BY ar.Name;
```

| Name |
|---|
| A Cor Do Som |
| Academy of St. Martin in the Fields, Sir Neville Marriner & William Bennett |
| Aerosmith & Sierra Leone's Refugee Allstars |
| Avril Lavigne |
| Azymuth |
| Baby Consuelo |
| Banda Black Rio |
| Barão Vermelho |
| Bebel Gilberto |
| Ben Harper |

*71 rows.*

"Have no albums" cannot be answered by a `JOIN`, because an inner join only produces rows where both sides match - an artist with no albums has nothing to match and vanishes. `LEFT JOIN` keeps every artist and fills the `Album` columns with `NULL` where there is no match. The `WHERE al.AlbumId IS NULL` then keeps only those. Read the two lines together as "every artist, minus the ones that matched".

Run it without the `WHERE` first and look for the `NULL`s. That is the query showing you which rows the filter is about to keep.

## Category 3: Counting and totalling

### 3.1 Customers per country

```sql
SELECT Country, COUNT(CustomerId) AS Customers
FROM Customer
GROUP BY Country
ORDER BY Customers DESC, Country;
```

| Country | Customers |
|---|---|
| USA | 13 |
| Canada | 8 |
| Brazil | 5 |
| France | 5 |
| Germany | 4 |
| United Kingdom | 3 |
| Czech Republic | 2 |
| India | 2 |
| Portugal | 2 |
| Argentina | 1 |

*24 rows.*

"Per country" is the `GROUP BY`. One row per distinct `Country`, and `COUNT` runs once inside each. `ORDER BY` can take two columns: sort by the count, and where counts are equal, by name. The alias `Customers` is usable in `ORDER BY` because sorting happens after the `SELECT` has named its columns.

### 3.2 The biggest albums

```sql
SELECT TOP (10) al.Title, COUNT(t.TrackId) AS Tracks
FROM Album AS al
JOIN Track AS t ON al.AlbumId = t.AlbumId
GROUP BY al.AlbumId, al.Title
ORDER BY Tracks DESC;
```

| Title | Tracks |
|---|---|
| Greatest Hits | 57 |
| Minha Historia | 34 |
| Unplugged | 30 |
| Lost, Season 3 | 26 |
| Lost, Season 1 | 25 |
| The Office, Season 3 | 25 |
| Battlestar Galactica (Classic), Season 1 | 24 |
| Lost, Season 2 | 24 |
| My Way: The Best Of Frank Sinatra [Disc 1] | 24 |
| Afrociberdelia | 23 |

Join `Album` to `Track` and you get one row per track, with the album title repeated on each. That is the wrong grain *[the level of detail one row represents]* for the report - it wants one row per album. The `GROUP BY` collapses the track rows back into one per album, `COUNT` says how many were collapsed, and `TOP (10)` with the `DESC` sort keeps the biggest.

The group is on `al.AlbumId, al.Title`, not on the title alone. Grouping on just the title happens to work in Chinook because no two albums share one, but in real data two different albums with the same title would be merged into one row. The ID is what makes an album an album; the title is there so the row is readable. 5.2 shows what goes wrong when you group on the name.

### 3.3 Sales per year

```sql
SELECT YEAR(InvoiceDate) AS [Year], COUNT(InvoiceId) AS Invoices, SUM(Total) AS Revenue
FROM Invoice
GROUP BY YEAR(InvoiceDate)
ORDER BY [Year];
```

| Year | Invoices | Revenue |
|---|---|---|
| 2021 | 83 | 449.46 |
| 2022 | 83 | 481.45 |
| 2023 | 83 | 469.58 |
| 2024 | 83 | 477.53 |
| 2025 | 80 | 450.58 |

There is no year column, so make one: `YEAR(InvoiceDate)` pulls the year out of a date. You can group on an expression as long as the same expression appears in the `GROUP BY`. `Year` is in square brackets because it is also the name of a function, and the brackets tell the server you mean an identifier.

Two aggregates in one query is fine - each runs once per group. `Invoice.Total` is already the whole invoice, so `SUM(Total)` is the revenue. There is no need to go down to `InvoiceLine` unless the question is about tracks.

### 3.4 Prolific artists

```sql
SELECT ar.Name, COUNT(al.AlbumId) AS Albums
FROM Artist AS ar
JOIN Album AS al ON ar.ArtistId = al.ArtistId
GROUP BY ar.Name
HAVING COUNT(al.AlbumId) >= 5
ORDER BY Albums DESC;
```

| Name | Albums |
|---|---|
| Iron Maiden | 21 |
| Led Zeppelin | 14 |
| Deep Purple | 11 |
| U2 | 10 |
| Metallica | 10 |
| Ozzy Osbourne | 6 |
| Pearl Jam | 5 |

"Five or more albums" is a condition on a count, and a count does not exist until after the grouping. `WHERE` runs before `GROUP BY`, on individual rows, so it cannot see the count. `HAVING` runs after, on the groups, and can. `WHERE` filters rows; `HAVING` filters groups.

### 3.5 Track length by genre

```sql
SELECT g.Name AS Genre,
       COUNT(t.TrackId) AS Tracks,
       CAST(AVG(t.Milliseconds) / 60000.0 AS DECIMAL(5,1)) AS AvgMinutes,
       CAST(MIN(t.Milliseconds) / 60000.0 AS DECIMAL(5,1)) AS ShortestMinutes,
       CAST(MAX(t.Milliseconds) / 60000.0 AS DECIMAL(5,1)) AS LongestMinutes
FROM Genre AS g
JOIN Track AS t ON g.GenreId = t.GenreId
GROUP BY g.Name
ORDER BY AvgMinutes DESC;
```

| Genre | Tracks | AvgMinutes | ShortestMinutes | LongestMinutes |
|---|---|---|---|---|
| Sci Fi & Fantasy | 26 | 48.5 | 43.7 | 49.3 |
| Science Fiction | 13 | 43.8 | 42.7 | 45.2 |
| Drama | 64 | 42.9 | 1.9 | 84.8 |
| TV Shows | 93 | 35.8 | 20.6 | 88.1 |
| Comedy | 17 | 26.4 | 21.1 | 42.4 |
| Metal | 374 | 5.2 | .7 | 13.6 |
| Electronica/Dance | 30 | 5.0 | 2.4 | 8.8 |
| Heavy Metal | 28 | 5.0 | .8 | 8.6 |
| Jazz | 130 | 4.9 | 2.1 | 15.1 |
| Classical | 74 | 4.9 | .9 | 9.9 |

*25 rows.*

The longest query in the set, but it is built in two steps. First get the report working in milliseconds: four aggregates over the same group, and `AVG`, `MIN` and `MAX` work like `SUM` and `COUNT` - one value per group. Then wrap each of the three length columns in the conversion from 1.3. The aggregate goes inside the `CAST`, because the average has to be worked out before it can be rounded. The join to `Genre` is only there to put a name on the group; grouping on `t.GenreId` alone would give the same 25 rows with numbers where the names are.

### 3.6 Customers per employee

```sql
SELECT e.FirstName, e.LastName, e.Title, COUNT(c.CustomerId) AS Customers
FROM Employee AS e
LEFT JOIN Customer AS c ON e.EmployeeId = c.SupportRepId
GROUP BY e.FirstName, e.LastName, e.Title
ORDER BY Customers DESC;
```

| FirstName | LastName | Title | Customers |
|---|---|---|---|
| Jane | Peacock | Sales Support Agent | 21 |
| Margaret | Park | Sales Support Agent | 20 |
| Steve | Johnson | Sales Support Agent | 18 |
| Andrew | Adams | General Manager | 0 |
| Laura | Callahan | IT Staff | 0 |
| Michael | Mitchell | IT Manager | 0 |
| Nancy | Edwards | Sales Manager | 0 |
| Robert | King | IT Staff | 0 |

"Not just the sales staff" is the instruction to use `LEFT JOIN`. Five employees have no customers; an inner join drops them and the report has three rows. With `LEFT JOIN` they stay, their `Customer` columns are `NULL`, and `COUNT(c.CustomerId)` counts zero for them because `COUNT` of a column ignores `NULL`s. `COUNT(*)` would give those five employees a count of 1 - it counts rows, and the row exists even though nothing is in it.

## Category 4: Reports

### 4.1 Most popular genre

```sql
SELECT g.Name AS Genre, SUM(il.Quantity) AS TracksSold
FROM InvoiceLine AS il
JOIN Track AS t ON il.TrackId = t.TrackId
JOIN Genre AS g ON t.GenreId = g.GenreId
GROUP BY g.Name
ORDER BY TracksSold DESC;
```

| Genre | TracksSold |
|---|---|
| Rock | 835 |
| Latin | 386 |
| Metal | 264 |
| Alternative & Punk | 244 |
| Jazz | 80 |
| Blues | 61 |
| TV Shows | 47 |
| R&B/Soul | 41 |
| Classical | 41 |
| Reggae | 30 |

*24 rows.*

"Sells the most" means the answer comes from what was sold, and sales are in `InvoiceLine` - one row per track on an invoice. Start there. `InvoiceLine` knows the track, `Track` knows the genre, `Genre` knows the name: three tables, two joins, following the foreign keys one hop at a time. Then group on the name and add up the quantities.

Rock at 835 is the usual answer to "most popular genre". Twenty-four genres appear, not 25: Opera has one track and it has never sold, so it has no `InvoiceLine` rows to join to.

### 4.2 Best customers

```sql
SELECT TOP (10) c.FirstName, c.LastName, c.Country, SUM(i.Total) AS TotalSpent
FROM Customer AS c
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY c.FirstName, c.LastName, c.Country
ORDER BY TotalSpent DESC;
```

| FirstName | LastName | Country | TotalSpent |
|---|---|---|---|
| Helena | Holý | Czech Republic | 49.62 |
| Richard | Cunningham | USA | 47.62 |
| Luis | Rojas | Chile | 46.62 |
| Hugh | O'Reilly | Ireland | 45.62 |
| Ladislav | Kovács | Hungary | 45.62 |
| Frank | Ralston | USA | 43.62 |
| Fynn | Zimmermann | Germany | 43.62 |
| Julia | Barnett | USA | 43.62 |
| Astrid | Gruber | Austria | 42.62 |
| Victor | Stevens | USA | 42.62 |

The report per customer from class, on a bigger database. One row per customer, so group on the customer; every non-aggregated column in the `SELECT` - first name, last name, country - has to be in the `GROUP BY`. `TOP (10)` with `ORDER BY ... DESC` takes the ten biggest. `TOP` is applied last, after grouping and sorting, which is why it can be used on an aggregate.

### 4.3 Best-earning artists

```sql
SELECT TOP (10) ar.Name AS Artist, SUM(il.UnitPrice * il.Quantity) AS Revenue
FROM InvoiceLine AS il
JOIN Track AS t ON il.TrackId = t.TrackId
JOIN Album AS al ON t.AlbumId = al.AlbumId
JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
GROUP BY ar.Name
ORDER BY Revenue DESC;
```

| Artist | Revenue |
|---|---|
| Iron Maiden | 138.60 |
| U2 | 105.93 |
| Metallica | 90.09 |
| Led Zeppelin | 86.13 |
| Lost | 81.59 |
| The Office | 49.75 |
| Os Paralamas Do Sucesso | 44.55 |
| Deep Purple | 43.56 |
| Faith No More | 41.58 |
| Eric Clapton | 39.60 |

Four tables. There is no direct line from a sale to an artist: `InvoiceLine` knows the track, the track knows its album, the album knows its artist. Each `JOIN` is one hop along that chain, and the schema diagram is the map. The money is `UnitPrice * Quantity` per line, summed per artist - the same shape as the `Total Spent` column from class.

`Lost` and `The Office` are artists here because Chinook stores TV series as artists and seasons as albums.

### 4.4 Sales by rep

```sql
SELECT e.FirstName, e.LastName, COUNT(i.InvoiceId) AS Invoices, SUM(i.Total) AS Revenue
FROM Employee AS e
JOIN Customer AS c ON e.EmployeeId = c.SupportRepId
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY e.FirstName, e.LastName
ORDER BY Revenue DESC;
```

| FirstName | LastName | Invoices | Revenue |
|---|---|---|---|
| Jane | Peacock | 146 | 833.04 |
| Margaret | Park | 140 | 775.40 |
| Steve | Johnson | 126 | 720.16 |

An employee is linked to revenue through the customers they support: `Employee` → `Customer` → `Invoice`. The middle table is only there to carry the join through; nothing from `Customer` appears in the output. Three rows because only three employees have customers, and an inner join drops the rest - which is what the request wants this time, since it asked for sales reps.

### 4.5 The Grunge playlist

```sql
SELECT t.Name AS Track, ar.Name AS Artist, al.Title AS Album
FROM Playlist AS p
JOIN PlaylistTrack AS pt ON p.PlaylistId = pt.PlaylistId
JOIN Track AS t ON pt.TrackId = t.TrackId
JOIN Album AS al ON t.AlbumId = al.AlbumId
JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
WHERE p.Name = 'Grunge'
ORDER BY ar.Name, t.Name;
```

| Track | Artist | Album |
|---|---|---|
| Man In The Box | Alice In Chains | Facelift |
| Come As You Are | Nirvana | Nevermind |
| Drain You | Nirvana | Nevermind |
| In Bloom | Nirvana | Nevermind |
| Lithium | Nirvana | Nevermind |
| On A Plain | Nirvana | Nevermind |
| Smells Like Teen Spirit | Nirvana | Nevermind |
| Alive | Pearl Jam | Ten |
| Daughter | Pearl Jam | Vs. |
| Evenflow | Pearl Jam | Ten |

*15 rows.*

Five tables and no aggregate. A playlist has many tracks and a track can be on many playlists, so neither table can point at the other; `PlaylistTrack` sits between them with one row per pairing. That is the **junction table** *[a table whose rows exist only to connect two other tables]* from the ERD lesson, and reaching a track from a playlist always goes through it. From `Track` onwards it is the same chain as 4.3.

### 4.6 Sales by country

```sql
SELECT c.Country, COUNT(DISTINCT c.CustomerId) AS Customers, COUNT(i.InvoiceId) AS Invoices, SUM(i.Total) AS Revenue
FROM Customer AS c
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY c.Country
ORDER BY Revenue DESC;
```

| Country | Customers | Invoices | Revenue |
|---|---|---|---|
| USA | 13 | 91 | 523.06 |
| Canada | 8 | 56 | 303.96 |
| France | 5 | 35 | 195.10 |
| Brazil | 5 | 35 | 190.10 |
| Germany | 4 | 28 | 156.48 |
| United Kingdom | 3 | 21 | 112.86 |
| Czech Republic | 2 | 14 | 90.24 |
| Portugal | 2 | 14 | 77.24 |
| India | 2 | 13 | 75.26 |
| Chile | 1 | 7 | 46.62 |

*24 rows.*

After the join there is one row per invoice, and each customer's ID appears on every one of their invoices. `COUNT(c.CustomerId)` would count those repeats - 91 for the USA, which is the invoice count, not the customer count. `COUNT(DISTINCT c.CustomerId)` counts each ID once. Whenever a join multiplies rows and you need to count the *one* side, `DISTINCT` inside the `COUNT` is the fix.

## Category 5: Stretch

### 5.1 The org chart

```sql
SELECT e.FirstName, e.LastName, e.Title, m.FirstName AS ManagerFirstName, m.LastName AS ManagerLastName
FROM Employee AS e
LEFT JOIN Employee AS m ON e.ReportsTo = m.EmployeeId
ORDER BY e.EmployeeId;
```

| FirstName | LastName | Title | ManagerFirstName | ManagerLastName |
|---|---|---|---|---|
| Andrew | Adams | General Manager | NULL | NULL |
| Nancy | Edwards | Sales Manager | Andrew | Adams |
| Jane | Peacock | Sales Support Agent | Nancy | Edwards |
| Margaret | Park | Sales Support Agent | Nancy | Edwards |
| Steve | Johnson | Sales Support Agent | Nancy | Edwards |
| Michael | Mitchell | IT Manager | Andrew | Adams |
| Robert | King | IT Staff | Michael | Mitchell |
| Laura | Callahan | IT Staff | Michael | Mitchell |

`Employee.ReportsTo` points at `Employee.EmployeeId` - the same table. A table can be joined to itself; you just need two aliases so the server can tell the two copies apart. `e` is the employee, `m` is the manager, and the `ON` links `e.ReportsTo` to `m.EmployeeId`. Andrew Adams has `ReportsTo` of `NULL`, so an inner join drops him; the `LEFT JOIN` keeps him with `NULL` in the manager columns.

### 5.2 Tracks per playlist

```sql
SELECT p.PlaylistId, p.Name, COUNT(pt.TrackId) AS Tracks
FROM Playlist AS p
LEFT JOIN PlaylistTrack AS pt ON p.PlaylistId = pt.PlaylistId
GROUP BY p.PlaylistId, p.Name
ORDER BY Tracks DESC, p.PlaylistId;
```

| PlaylistId | Name | Tracks |
|---|---|---|
| 1 | Music | 3290 |
| 8 | Music | 3290 |
| 5 | 90’s Music | 1477 |
| 3 | TV Shows | 213 |
| 10 | TV Shows | 213 |
| 12 | Classical | 75 |
| 11 | Brazilian Music | 39 |
| 17 | Heavy Metal Classic | 26 |
| 13 | Classical 101 - Deep Cuts | 25 |
| 14 | Classical 101 - Next Steps | 25 |
| 15 | Classical 101 - The Basics | 25 |
| 16 | Grunge | 15 |
| 9 | Music Videos | 1 |
| 18 | On-The-Go 1 | 1 |
| 2 | Movies | 0 |
| 4 | Audiobooks | 0 |
| 6 | Audiobooks | 0 |
| 7 | Movies | 0 |

"Including the empty ones" is `LEFT JOIN`, as in 3.6. The trap is the `GROUP BY`. There are 18 playlists but only 14 distinct names: two are called `Music`, two `TV Shows`, two `Movies`, two `Audiobooks`. Group on `p.Name` alone and the two `Music` playlists merge into one row of 6,580 tracks, which is a number that describes nothing that exists. Grouping on the primary key keeps them apart; adding the name to the `GROUP BY` puts it back in the output.

> Group on the key. Add the name for the reader.

### 5.3 Dead stock

```sql
SELECT COUNT(t.TrackId) AS TracksNeverSold
FROM Track AS t
LEFT JOIN InvoiceLine AS il ON t.TrackId = il.TrackId
WHERE il.InvoiceLineId IS NULL;
```

| TracksNeverSold |
|---|
| 1519 |

The same `LEFT JOIN` + `IS NULL` shape as 2.5 - "every track, minus the ones with a sale" - with a `COUNT` over the result instead of a list. No `GROUP BY` because the request wants one number, not one per anything. An aggregate with no `GROUP BY` treats the whole result as a single group. 1,519 of 3,503 tracks have never sold, which is a fact about the sample data that the "most popular genre" report quietly relies on.

### 5.4 Genre trends

```sql
SELECT YEAR(i.InvoiceDate) AS [Year], g.Name AS Genre, SUM(il.UnitPrice * il.Quantity) AS Revenue
FROM Invoice AS i
JOIN InvoiceLine AS il ON i.InvoiceId = il.InvoiceId
JOIN Track AS t ON il.TrackId = t.TrackId
JOIN Genre AS g ON t.GenreId = g.GenreId
WHERE g.Name IN ('Rock', 'Latin', 'Metal')
GROUP BY YEAR(i.InvoiceDate), g.Name
ORDER BY [Year], Revenue DESC;
```

| Year | Genre | Revenue |
|---|---|---|
| 2021 | Rock | 178.20 |
| 2021 | Latin | 82.17 |
| 2021 | Metal | 61.38 |
| 2022 | Rock | 155.43 |
| 2022 | Latin | 77.22 |
| 2022 | Metal | 53.46 |
| 2023 | Rock | 156.42 |
| 2023 | Latin | 80.19 |
| 2023 | Metal | 25.74 |
| 2024 | Rock | 162.36 |
| 2024 | Metal | 65.34 |
| 2024 | Latin | 63.36 |
| 2025 | Rock | 174.24 |
| 2025 | Latin | 79.20 |
| 2025 | Metal | 55.44 |

"One row per year per genre" is a `GROUP BY` on two things. Every distinct combination of the two becomes a group: five years times three genres, fifteen rows. The year comes from `Invoice`, the genre from `Genre`, and they are four joins apart - the date is on the invoice, the genre is on the track, and `InvoiceLine` is the bridge between them. `IN (...)` is shorthand for three `OR`s. Metal is third every year except 2024, when it overtook Latin.

### 5.5 The 45-dollar club

```sql
SELECT c.FirstName, c.LastName, c.Email, COUNT(i.InvoiceId) AS Invoices, SUM(i.Total) AS TotalSpent
FROM Customer AS c
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY c.FirstName, c.LastName, c.Email
HAVING SUM(i.Total) > 45
ORDER BY TotalSpent DESC;
```

| FirstName | LastName | Email | Invoices | TotalSpent |
|---|---|---|---|---|
| Helena | Holý | hholy@gmail.com | 7 | 49.62 |
| Richard | Cunningham | ricunningham@hotmail.com | 7 | 47.62 |
| Luis | Rojas | luisrojas@yahoo.cl | 7 | 46.62 |
| Hugh | O'Reilly | hughoreilly@apple.ie | 7 | 45.62 |
| Ladislav | Kovács | ladislav_kovacs@apple.hu | 7 | 45.62 |

4.2 with a `HAVING` instead of a `TOP`. "Total spend over 45" is a condition on a `SUM`, and a `SUM` only exists after grouping, so it goes in `HAVING` rather than `WHERE`. The difference from 4.2 is the question being asked: "the top ten" always returns ten rows however much they spent; "everyone over 45" returns however many qualify - five, this time. Which one the person asking actually wants is worth checking before you write either.

## Category 6: Nested queries

### 6.1 Above-average tracks

```sql
SELECT COUNT(TrackId) AS LongerThanAverage
FROM Track
WHERE Milliseconds > (SELECT AVG(Milliseconds) FROM Track);
```

| LongerThanAverage |
|---|
| 494 |

The inner query returns one number, the average length of every track, and the `WHERE` compares each track against it. The average is 6.6 minutes, and only 494 of 3,503 tracks are above it: the handful of 40-minute TV episodes pull the average well above the typical song. Both queries read the same table, which is fine - the inner one runs to completion before the outer one starts filtering.

### 6.2 Dead stock, again

```sql
SELECT COUNT(TrackId) AS TracksNeverSold
FROM Track
WHERE TrackId NOT IN (SELECT TrackId FROM InvoiceLine);
```

| TracksNeverSold |
|---|
| 1519 |

The inner query is the list of every track ID that appears on an invoice line - with repeats, which `IN` does not care about. The outer query counts the tracks whose ID is not on that list. The `LEFT JOIN` version from 5.3 gets there by building every track-sale pair and then keeping the pairs with no sale; this version asks the question directly.

### 6.3 Iron Maiden's customers

```sql
SELECT c.FirstName, c.LastName, c.Country
FROM Customer AS c
WHERE c.CustomerId IN (
    SELECT i.CustomerId
    FROM Invoice AS i
    JOIN InvoiceLine AS il ON i.InvoiceId = il.InvoiceId
    JOIN Track AS t ON il.TrackId = t.TrackId
    JOIN Album AS al ON t.AlbumId = al.AlbumId
    JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
    WHERE ar.Name = 'Iron Maiden'
)
ORDER BY c.LastName;
```

| FirstName | LastName | Country |
|---|---|---|
| Camille | Bernard | France |
| Edward | Francis | Canada |
| Tim | Goyer | USA |
| Patrick | Gray | USA |
| Astrid | Gruber | Austria |
| Frank | Harris | USA |
| Phil | Hughes | United Kingdom |
| Joakim | Johansson | Sweden |
| Emma | Jones | United Kingdom |
| Ladislav | Kovács | Hungary |

*27 rows.*

The inner query is the 4.3 chain run in the other direction - from artist down to invoice - returning one `CustomerId` per Iron Maiden track sold, 140 rows with plenty of repeats. The outer query only asks whether each customer's ID is somewhere on that list, so the repeats do not matter and "each customer once" comes for free. The alternative, joining `Customer` onto the same chain, produces one row per sale and needs a `DISTINCT` to collapse them.

### 6.4 The average customer

```sql
SELECT CAST(AVG(s.TotalSpent) AS DECIMAL(10,2)) AS AvgSpend
FROM (
    SELECT CustomerId, SUM(Total) AS TotalSpent
    FROM Invoice
    GROUP BY CustomerId
) AS s;
```

| AvgSpend |
|---|
| 39.47 |

An aggregate of an aggregate. The derived table `s` is the 59-row summary - one row per customer with their total - and the outer query averages the `TotalSpent` column of it. `AVG(Total)` straight from `Invoice` gives 5.65, which is the average *invoice*, and there are seven invoices per customer. The `CAST` only rounds the answer; the raw value is 39.467796.

### 6.5 Above-average customers

```sql
SELECT c.FirstName, c.LastName, c.Country, SUM(i.Total) AS TotalSpent
FROM Customer AS c
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY c.FirstName, c.LastName, c.Country
HAVING SUM(i.Total) > (
    SELECT AVG(TotalSpent)
    FROM (
        SELECT CustomerId, SUM(Total) AS TotalSpent
        FROM Invoice
        GROUP BY CustomerId
    ) AS s
)
ORDER BY TotalSpent DESC;
```

| FirstName | LastName | Country | TotalSpent |
|---|---|---|---|
| Helena | Holý | Czech Republic | 49.62 |
| Richard | Cunningham | USA | 47.62 |
| Luis | Rojas | Chile | 46.62 |
| Hugh | O'Reilly | Ireland | 45.62 |
| Ladislav | Kovács | Hungary | 45.62 |
| Julia | Barnett | USA | 43.62 |
| Frank | Ralston | USA | 43.62 |
| Fynn | Zimmermann | Germany | 43.62 |
| Astrid | Gruber | Austria | 42.62 |
| Victor | Stevens | USA | 42.62 |

*22 rows.*

5.5 with the `45` replaced by the whole of 6.4, uncast. `HAVING` compares each customer's `SUM` against a subquery that returns one value, exactly as a `WHERE` would. The subquery is nested two deep - a derived table inside a scalar subquery - and it is still just 6.4 pasted into brackets. Twenty-two customers are above the 39.47 average and thirty-seven are below it.

## Category 7: Views

### 7.1 CustomerSpend

```sql
GO
CREATE VIEW CustomerSpend AS
SELECT c.CustomerId, c.FirstName, c.LastName, c.Country, c.Email,
       COUNT(i.InvoiceId) AS Invoices, SUM(i.Total) AS TotalSpent
FROM Customer AS c
JOIN Invoice AS i ON c.CustomerId = i.CustomerId
GROUP BY c.CustomerId, c.FirstName, c.LastName, c.Country, c.Email;
GO

SELECT COUNT(*) FROM CustomerSpend;
```

| (No column name) |
|---|
| 59 |

The query is 5.5 without its `HAVING` and `ORDER BY`, with the ID and country added so later reports have them. `CustomerId` is in the `GROUP BY` for the reason 5.2 gave: it is what makes a customer a customer. Every column the view exposes has a name - the two aggregates are aliased, because `CREATE VIEW` refuses a column it cannot name. The `GO` before `CREATE VIEW` ends the previous batch; without it the server says `'CREATE VIEW' must be the first statement in a query batch`.

### 7.2 The 45-dollar club, again

```sql
SELECT FirstName, LastName, Email, Invoices, TotalSpent
FROM CustomerSpend
WHERE TotalSpent > 45
ORDER BY TotalSpent DESC;
```

| FirstName | LastName | Email | Invoices | TotalSpent |
|---|---|---|---|---|
| Helena | Holý | hholy@gmail.com | 7 | 49.62 |
| Richard | Cunningham | ricunningham@hotmail.com | 7 | 47.62 |
| Luis | Rojas | luisrojas@yahoo.cl | 7 | 46.62 |
| Ladislav | Kovács | ladislav_kovacs@apple.hu | 7 | 45.62 |
| Hugh | O'Reilly | hughoreilly@apple.ie | 7 | 45.62 |

The same five rows as 5.5. The `HAVING` has become a `WHERE`, because to the outer query `TotalSpent` is a column on a table, not an aggregate - the grouping already happened inside the view. The two 45.62 customers may swap places between this and 5.5; they tie, and nothing in the `ORDER BY` decides between them.

### 7.3 Above-average customers, again

```sql
SELECT FirstName, LastName, Country, TotalSpent
FROM CustomerSpend
WHERE TotalSpent > (SELECT AVG(TotalSpent) FROM CustomerSpend)
ORDER BY TotalSpent DESC;
```

| FirstName | LastName | Country | TotalSpent |
|---|---|---|---|
| Helena | Holý | Czech Republic | 49.62 |
| Richard | Cunningham | USA | 47.62 |
| Luis | Rojas | Chile | 46.62 |
| Ladislav | Kovács | Hungary | 45.62 |
| Hugh | O'Reilly | Ireland | 45.62 |
| Fynn | Zimmermann | Germany | 43.62 |
| Julia | Barnett | USA | 43.62 |
| Frank | Ralston | USA | 43.62 |
| Victor | Stevens | USA | 42.62 |
| Astrid | Gruber | Austria | 42.62 |

*22 rows.*

6.5 was fourteen lines and nested two deep. The view is used twice here, once for the list and once for the average, and each use is a plain `SELECT` because the per-customer grouping lives in the view. The derived table that 6.5 had to spell out inside the `HAVING` is now `CustomerSpend`.

### 7.4 TrackCatalogue

```sql
GO
CREATE VIEW TrackCatalogue AS
SELECT t.TrackId, t.Name AS Track, al.Title AS Album, ar.Name AS Artist,
       g.Name AS Genre, m.Name AS MediaType,
       CAST(t.Milliseconds / 60000.0 AS DECIMAL(5,1)) AS Minutes, t.UnitPrice
FROM Track AS t
JOIN Album AS al ON t.AlbumId = al.AlbumId
JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
JOIN Genre AS g ON t.GenreId = g.GenreId
JOIN MediaType AS m ON t.MediaTypeId = m.MediaTypeId;
GO

SELECT TOP (5) * FROM TrackCatalogue ORDER BY TrackId;
```

| TrackId | Track | Album | Artist | Genre | MediaType | Minutes | UnitPrice |
|---|---|---|---|---|---|---|---|
| 1 | For Those About To Rock (We Salute You) | For Those About To Rock We Salute You | AC/DC | Rock | MPEG audio file | 5.7 | .99 |
| 2 | Balls to the Wall | Balls to the Wall | Accept | Rock | Protected AAC audio file | 5.7 | .99 |
| 3 | Fast As a Shark | Restless and Wild | Accept | Rock | Protected AAC audio file | 3.8 | .99 |
| 4 | Restless and Wild | Restless and Wild | Accept | Rock | Protected AAC audio file | 4.2 | .99 |
| 5 | Princess of the Dawn | Restless and Wild | Accept | Rock | Protected AAC audio file | 6.3 | .99 |

*3503 rows.*

Every lookup that hangs off `Track` - album, artist, genre, media type - joined in once and flattened to one wide row per track. Three of the source tables have a column called `Name`, so every one of them is aliased to say whose name it is; `t.Name AS Track` and `ar.Name AS Artist` are not decoration here, the view will not save without them. The row count is 3,503, the same as `Track`, because every track has an album, genre and media type - four inner joins and nothing lost.

### 7.5 Best-earning artists, again

```sql
SELECT TOP (10) tc.Artist, SUM(il.UnitPrice * il.Quantity) AS Revenue
FROM InvoiceLine AS il
JOIN TrackCatalogue AS tc ON il.TrackId = tc.TrackId
GROUP BY tc.Artist
ORDER BY Revenue DESC;
```

| Artist | Revenue |
|---|---|
| Iron Maiden | 138.60 |
| U2 | 105.93 |
| Metallica | 90.09 |
| Led Zeppelin | 86.13 |
| Lost | 81.59 |
| The Office | 49.75 |
| Os Paralamas Do Sucesso | 44.55 |
| Deep Purple | 43.56 |
| Faith No More | 41.58 |
| Eric Clapton | 39.60 |

The same ten rows as 4.3, and the three-hop chain from `Track` to `Artist` has become one `JOIN` onto the view. `TrackCatalogue` keeps `TrackId`, which is what makes the join possible - a view that only exposed names would have nothing for `InvoiceLine` to match on. When the server runs this it expands the view back into its four joins, so the work is the same as 4.3; only the writing is shorter.

### 7.6 The Grunge playlist, again

```sql
SELECT tc.Track, tc.Artist, tc.Album
FROM Playlist AS p
JOIN PlaylistTrack AS pt ON p.PlaylistId = pt.PlaylistId
JOIN TrackCatalogue AS tc ON pt.TrackId = tc.TrackId
WHERE p.Name = 'Grunge'
ORDER BY tc.Artist, tc.Track;
```

| Track | Artist | Album |
|---|---|---|
| Man In The Box | Alice In Chains | Facelift |
| Come As You Are | Nirvana | Nevermind |
| Drain You | Nirvana | Nevermind |
| In Bloom | Nirvana | Nevermind |
| Lithium | Nirvana | Nevermind |
| On A Plain | Nirvana | Nevermind |
| Smells Like Teen Spirit | Nirvana | Nevermind |
| Alive | Pearl Jam | Ten |
| Daughter | Pearl Jam | Vs. |
| Evenflow | Pearl Jam | Ten |

*15 rows.*

4.5 had five tables; this has two tables and a view. The playlist side has not changed - `Playlist` to `PlaylistTrack` is still the junction table hop - and everything from `Track` onwards is the view. A view can sit on either side of a `JOIN`, be filtered in a `WHERE`, and be sorted on, and the outer query cannot tell it from a table.

## Category 8: Stored procedures

### 8.1 AlbumsByArtist

```sql
GO
CREATE PROCEDURE AlbumsByArtist
    @ArtistName NVARCHAR(120)
AS
BEGIN
    SELECT al.Title
    FROM Album AS al
    JOIN Artist AS ar ON al.ArtistId = ar.ArtistId
    WHERE ar.Name = @ArtistName
    ORDER BY al.Title;
END
GO

EXEC AlbumsByArtist @ArtistName = 'Iron Maiden';
```

| Title |
|---|
| A Matter of Life and Death |
| A Real Dead One |
| A Real Live One |
| Brave New World |
| Dance Of Death |
| Fear Of The Dark |
| Iron Maiden |
| Killers |
| Live After Death |
| Live At Donington 1992 (Disc 1) |

*21 rows.*

2.2 with `'Iron Maiden'` replaced by `@ArtistName`. The parameter's type is `NVARCHAR(120)` because that is the type of `Artist.Name` - the parameter should hold whatever the column can hold. `ORDER BY` is allowed inside a procedure, unlike a view, because a procedure returns a result and a result has an order. `EXEC AlbumsByArtist 'Led Zeppelin'` returns 14 rows through the same saved query; `EXEC AlbumsByArtist 'Nobody'` returns none, which is not an error.

### 8.2 TopCustomers

```sql
GO
CREATE PROCEDURE TopCustomers
    @Count INT
AS
BEGIN
    SELECT TOP (@Count) FirstName, LastName, Country, TotalSpent
    FROM CustomerSpend
    ORDER BY TotalSpent DESC;
END
GO

EXEC TopCustomers @Count = 5;
```

| FirstName | LastName | Country | TotalSpent |
|---|---|---|---|
| Helena | Holý | Czech Republic | 49.62 |
| Richard | Cunningham | USA | 47.62 |
| Luis | Rojas | Chile | 46.62 |
| Ladislav | Kovács | Hungary | 45.62 |
| Hugh | O'Reilly | Ireland | 45.62 |

4.2 with the ten as a parameter, and the grouping delegated to the view. A procedure can read a view exactly as a query can, so the two build on each other: the view holds the shape of the data, the procedure holds the question and its inputs. `TOP` takes its parameter in brackets; `TOP @Count` without them is a syntax error.

### 8.3 CustomersInCountry

```sql
GO
CREATE PROCEDURE CustomersInCountry
    @Country NVARCHAR(40)
AS
BEGIN
    SELECT FirstName, LastName, Email, Invoices, TotalSpent
    FROM CustomerSpend
    WHERE Country = @Country
    ORDER BY TotalSpent DESC, LastName;
END
GO

EXEC CustomersInCountry @Country = 'Canada';
```

| FirstName | LastName | Email | Invoices | TotalSpent |
|---|---|---|---|---|
| François | Tremblay | ftremblay@gmail.com | 7 | 39.62 |
| Jennifer | Peterson | jenniferp@rogers.ca | 7 | 38.62 |
| Robert | Brown | robbrown@shaw.ca | 7 | 37.62 |
| Edward | Francis | edfrancis@yachoo.ca | 7 | 37.62 |
| Aaron | Mitchell | aaronmitchell@yahoo.ca | 7 | 37.62 |
| Mark | Philips | mphilips12@shaw.ca | 7 | 37.62 |
| Martha | Silk | marthasilk@gmail.com | 7 | 37.62 |
| Ellie | Sullivan | ellie.sullivan@shaw.ca | 7 | 37.62 |

The same eight people as 1.1, with the spend columns the view adds. `NVARCHAR(40)` matches `Customer.Country`. The second sort key is there because six of the eight tie on 37.62, and without it their order would be whatever the server happened to produce.

### 8.4 RevenueBetween

```sql
GO
CREATE PROCEDURE RevenueBetween
    @From DATE,
    @To DATE
AS
BEGIN
    SELECT COUNT(InvoiceId) AS Invoices, SUM(Total) AS Revenue
    FROM Invoice
    WHERE InvoiceDate >= @From AND InvoiceDate <= @To;
END
GO

EXEC RevenueBetween @From = '2025-01-01', @To = '2025-06-30';
```

| Invoices | Revenue |
|---|---|
| 38 | 211.86 |

Two parameters, separated by a comma, each with its own type. `DATE` is right because the comparison is against `InvoiceDate`; the string `'2025-01-01'` is converted to a date on the way in, as it was in 1.5. `EXEC RevenueBetween '2025-01-01', '2025-12-31'` gives 80 invoices and 450.58, which is the 2025 row of 3.3 - the same numbers by a different route.

### 8.5 GenreRevenue

```sql
GO
CREATE PROCEDURE GenreRevenue
    @GenreName NVARCHAR(120),
    @Year INT
AS
BEGIN
    SELECT g.Name AS Genre, YEAR(i.InvoiceDate) AS [Year], SUM(il.UnitPrice * il.Quantity) AS Revenue
    FROM Invoice AS i
    JOIN InvoiceLine AS il ON i.InvoiceId = il.InvoiceId
    JOIN Track AS t ON il.TrackId = t.TrackId
    JOIN Genre AS g ON t.GenreId = g.GenreId
    WHERE g.Name = @GenreName AND YEAR(i.InvoiceDate) = @Year
    GROUP BY g.Name, YEAR(i.InvoiceDate);
END
GO

EXEC GenreRevenue @GenreName = 'Metal', @Year = 2024;
```

| Genre | Year | Revenue |
|---|---|---|
| Metal | 2024 | 65.34 |

5.4 with both of its filters turned into parameters. 5.4 answered "Rock, Latin and Metal, every year" in one fifteen-row result; this answers one cell of that table per call, and the Metal 2024 cell matches. A procedure is the right shape when the caller knows which cell they want; the report is the right shape when they want the whole table. `EXEC GenreRevenue 'Opera', 2024` returns no rows - Opera has never sold - and, as with 8.1, an empty result is not an error.
