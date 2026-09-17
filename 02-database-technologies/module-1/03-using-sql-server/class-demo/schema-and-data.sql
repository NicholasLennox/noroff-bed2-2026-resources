-- ============================================================================
-- ShopDb: schema and data
--
-- Run the whole file (Ctrl+Shift+E) against your local SQL Server. It drops
-- ShopDb if it exists, recreates it, builds the four tables and seeds them.
-- Run it again whenever you want a clean database.
--
-- Each GO ends a batch. The Messages tab reports one "Started executing
-- query at Line N" per batch, so if something fails you can see which one.
-- ============================================================================


-- ============================================================================
-- 0. Reset
-- ============================================================================

-- You cannot drop the database you are connected to. Switch to master first.
USE master;
GO

-- DB_ID returns NULL when there is no database with that name.
-- IF only covers the next statement, so BEGIN ... END groups the two.
IF DB_ID('ShopDb') IS NOT NULL
BEGIN
    -- The object explorer keeps its own connection open, and SQL Server will
    -- not drop a database that has connections. Kick everyone off first.
    ALTER DATABASE ShopDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ShopDb;
END
GO

CREATE DATABASE ShopDb;
GO

USE ShopDb;
GO


-- ============================================================================
-- 1. Schema
-- ============================================================================

CREATE TABLE Customers (
    CustomerID INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,  -- IDENTITY: the server generates it, starting at 1, step 1
    FirstName  NVARCHAR(50)  NOT NULL,                            -- NVARCHAR: variable-length unicode text, max 50 characters
    LastName   NVARCHAR(50)  NOT NULL,
    Email      NVARCHAR(100) NOT NULL UNIQUE,                     -- UNIQUE: a constraint, same as a key but not *the* key
    CreatedAt  DATETIME2     NOT NULL DEFAULT SYSDATETIME()       -- DEFAULT: used when the INSERT does not supply a value
);
GO

CREATE TABLE Products (
    ProductID INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Name      NVARCHAR(100) NOT NULL,
    Price     DECIMAL(10,2) NOT NULL,   -- DECIMAL(10,2): 10 digits, 2 after the point. Never FLOAT for money.
    Stock     INT           NOT NULL DEFAULT 0
);
GO

CREATE TABLE Orders (
    OrderID    INT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT       NOT NULL,                                     -- the FK column ...
    OrderedAt  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Orders_Customers                                     -- ... and the constraint that makes it one. Named, so error messages name it.
        FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID)
);
GO

CREATE TABLE OrderLines (
    OrderLineID INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    OrderID     INT NOT NULL,
    ProductID   INT NOT NULL,
    Quantity    INT NOT NULL,
    CONSTRAINT FK_OrderLines_Orders
        FOREIGN KEY (OrderID)   REFERENCES Orders (OrderID),
    CONSTRAINT FK_OrderLines_Products
        FOREIGN KEY (ProductID) REFERENCES Products (ProductID),
    CONSTRAINT CK_OrderLines_Quantity  -- CHECK: a rule about the value itself
        CHECK (Quantity > 0)
);
GO


-- ============================================================================
-- 2. Data
-- ============================================================================

-- CustomerIDs 1-5.
INSERT INTO Customers (FirstName, LastName, Email)
VALUES
    ('Kari',  'Nordmann', 'kari@example.no'),
    ('Per',   'Hansen',   'per@example.no'),
    ('Ingrid','Berg',     'ingrid@example.no'),
    ('Lars',  'Haugen',   'lars@example.no'),
    ('Nora',  'Solberg',  'nora@example.no');
GO

-- ProductIDs 1-5.
INSERT INTO Products ([Name], Price, Stock)
VALUES
    ('Keyboard',   899.00, 12),
    ('Mouse',      349.00, 30),
    ('Monitor',   2999.00,  4),
    ('USB-C hub',  499.00,  0),
    ('Headset',   1299.00,  8);
GO

-- OrderIDs 1-4. Per has two orders, Ingrid and Lars one each.
-- Kari and Nora have none.
INSERT INTO Orders (CustomerID)
VALUES (2), (2), (3), (4);
GO

INSERT INTO OrderLines (OrderID, ProductID, Quantity)
VALUES
    (1, 1, 2),   -- order 1 (Per): two keyboards
    (1, 2, 1),   -- order 1 (Per): a mouse
    (2, 3, 2),   -- order 2 (Per again): two monitors
    (3, 5, 1),   -- order 3 (Ingrid): a headset
    (4, 2, 3),   -- order 4 (Lars): three mice
    (4, 1, 1);   -- order 4 (Lars): a keyboard
GO
