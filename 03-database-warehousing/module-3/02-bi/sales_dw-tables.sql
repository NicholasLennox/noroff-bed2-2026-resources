CREATE TABLE dim_date (
    date_key    INT          NOT NULL PRIMARY KEY,
    full_date   DATE         NOT NULL,
    day         TINYINT      NOT NULL,
    day_name    NVARCHAR(10) NOT NULL,
    day_of_week TINYINT      NOT NULL,
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
    store_id    INT          NULL,
    store_name  NVARCHAR(50) NOT NULL,
    store_city  NVARCHAR(50) NULL
);

CREATE TABLE dim_product (
    product_key INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    sku         INT           NOT NULL,
    name        NVARCHAR(100) NOT NULL,
    brand       NVARCHAR(50)  NOT NULL,
    category    NVARCHAR(50)  NOT NULL,
    department  NVARCHAR(50)  NOT NULL
);

CREATE TABLE dim_customer (
    customer_key INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    webshop_id   INT           NULL,
    loyalty_card VARCHAR(10)   NULL,
    name         NVARCHAR(100) NOT NULL,
    email        NVARCHAR(100) NULL,
    city         NVARCHAR(50)  NOT NULL
);

CREATE TABLE fact_sales (
    date_key     INT           NOT NULL REFERENCES dim_date (date_key),
    customer_key INT           NOT NULL REFERENCES dim_customer (customer_key),
    product_key  INT           NOT NULL REFERENCES dim_product (product_key),
    channel_key  INT           NOT NULL REFERENCES dim_channel (channel_key),
    order_no     VARCHAR(10)   NOT NULL,
    quantity     INT           NOT NULL,
    net_amount   DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_no, product_key)
);
