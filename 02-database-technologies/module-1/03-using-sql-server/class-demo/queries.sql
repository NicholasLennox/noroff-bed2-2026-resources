-- ============================================================================
-- ShopDb: queries
--
-- Run schema-and-data.sql first. Then run these one at a time - highlight a
-- statement and press Ctrl+Shift+E - and read the Results tab after each.
-- ============================================================================

USE ShopDb;
GO


-- ============================================================================
-- 1. One table: SELECT, ORDER BY, WHERE, LIKE
-- ============================================================================

-- Every column, every row. Row order is not guaranteed without ORDER BY.
SELECT * FROM Customers;

-- Sorted. Ascending is the default; add DESC to flip it.
SELECT * FROM Customers
ORDER BY LastName;

-- WHERE filters rows. = is an exact match on the whole value.
SELECT * FROM Customers
WHERE LastName = 'Hansen';

-- No rows: nobody's LastName is exactly 'Ha'. = does not mean "starts with".
SELECT * FROM Customers
WHERE LastName = 'Ha';

-- LIKE matches a pattern. % is "any characters, including none".
SELECT * FROM Customers
WHERE LastName LIKE 'Ha%';    -- starts with Ha

SELECT * FROM Customers
WHERE LastName LIKE '%n';     -- ends with n

SELECT * FROM Customers
WHERE LastName LIKE '%a%';    -- contains an a anywhere - this is what a search box runs


-- ============================================================================
-- 2. Two tables: JOIN, LEFT JOIN, aliases, GROUP BY
-- ============================================================================

-- JOIN glues two tables side by side. ON says which rows belong together.
-- Only customers with at least one order appear; Per appears once per order.
SELECT *
FROM Customers
JOIN Orders
ON Customers.CustomerID = Orders.CustomerID;

-- INNER JOIN is the same thing. JOIN is INNER by default.
SELECT *
FROM Customers
INNER JOIN Orders
ON Customers.CustomerID = Orders.CustomerID;

-- LEFT JOIN keeps every row from the left table (Customers), with NULLs
-- where there is no match. Kari and Nora are back.
SELECT *
FROM Customers
LEFT JOIN Orders
ON Customers.CustomerID = Orders.CustomerID;

-- Pick columns from either side.
SELECT FirstName, LastName, OrderID
FROM Customers
JOIN Orders
ON Customers.CustomerID = Orders.CustomerID;

-- Error: "Ambiguous column name 'CustomerID'". Both tables have one.
SELECT CustomerID, FirstName, LastName, OrderID
FROM Customers
JOIN Orders
ON Customers.CustomerID = Orders.CustomerID;

-- Aliases: AS c, AS o. Then c.CustomerID says which one you mean.
SELECT c.CustomerID, FirstName, LastName, OrderID
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID;

-- Error: "Column 'Customers.FirstName' is invalid in the select list because
-- it is not contained in either an aggregate function or the GROUP BY clause."
-- COUNT collapses rows; the server needs to know what to collapse them BY.
SELECT FirstName, LastName, COUNT(OrderID) AS [Num Orders]
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID;

-- GROUP BY: one bucket per (FirstName, LastName), COUNT runs once per bucket.
-- Every column in the SELECT is either in the GROUP BY or inside an aggregate.
SELECT FirstName, LastName, COUNT(OrderID) AS [Num Orders]
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID
GROUP BY FirstName, LastName;


-- ============================================================================
-- 3. All four tables, and a report
-- ============================================================================

-- Each JOIN adds one table. The ON says how it attaches to what is there.
-- One row per order line now - the finest-grained table in the join.
SELECT *
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID
JOIN OrderLines AS ol
ON o.OrderID = ol.OrderID;

-- The whole schema: Customers -> Orders -> OrderLines -> Products.
SELECT *
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID
JOIN OrderLines AS ol
ON o.OrderID = ol.OrderID
JOIN Products AS p
ON ol.ProductID = p.ProductID;

-- Refine: one or two columns from each table. Reads like a receipt.
SELECT c.FirstName, c.LastName, o.OrderedAt, ol.Quantity, p.Name, p.Price
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID
JOIN OrderLines AS ol
ON o.OrderID = ol.OrderID
JOIN Products AS p
ON ol.ProductID = p.ProductID;

-- A report per customer: how many things they bought, and how much they spent.
-- Grouped on Email - the natural key - not on name. Price is per unit, so the
-- money is SUM of Quantity * Price per line. An aggregate can take an expression.
SELECT c.Email, SUM(ol.Quantity) AS [Total Products], SUM(ol.Quantity * p.Price) AS [Total Spent]
FROM Customers AS c
JOIN Orders AS o
ON c.CustomerID = o.CustomerID
JOIN OrderLines AS ol
ON o.OrderID = ol.OrderID
JOIN Products AS p
ON ol.ProductID = p.ProductID
GROUP BY c.Email;
