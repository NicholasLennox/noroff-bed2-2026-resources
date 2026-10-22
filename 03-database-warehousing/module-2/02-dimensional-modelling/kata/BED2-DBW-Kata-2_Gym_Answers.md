# BED 2 Database Warehousing - Kata 2 - Answers

> One worked model for each stage. Your table and column names can differ from these and still be right. What should match is which tables are facts, which are dimensions, and which tables each report has to join.

## Stage 1: The check-ins report against the operational database

| We're looking for | It's in |
|---|---|
| Number of check-ins | Count the rows in `check_in` |
| Minutes in the gym | Worked out from `check_in.checked_in_at` and `check_in.checked_out_at` |
| Club | `club.name` |
| Membership type | `membership_type.name` |
| Weekday of the visit | Worked out from `check_in.checked_in_at` |
| Only January to March 2026 | `check_in.checked_in_at` |

The numbers are in `check_in`, so the query starts there:

```
check_in --> club
    |
    +------> member --> membership_type
```

```
SELECT   <club name>, <membership type name>, <weekday of the visit>,
         <count of check-ins>, <sum of minutes between check-in and check-out>
FROM     check_in
JOIN     club              -- the club name
JOIN     member            -- only to reach membership_type
JOIN     membership_type   -- the membership type name
WHERE    <the visit was between 1 January and 31 March 2026>
GROUP BY <club name>, <membership type name>, <weekday of the visit>
```

That's three joins. `member` is only there to get to `membership_type`: the report doesn't use a single column from it.

Neither the minutes nor the weekday is stored anywhere. Every report that wants them has to work them out from the timestamps on every row.

## Stage 2: Model the bookings star

### The event

The event is a **booking**: a member books a class. That's the verb, so `fact_booking` is the fact table, with one row per booking.

Class types, sessions, studios and instructors are all things involved in a booking, not things that happen. They end up as dimensions, or as columns on one.

### `fact_booking`

| Column | What it is |
|---|---|
| `date_key` | Foreign key to `dim_date` - the day the class took place |
| `member_key` | Foreign key to `dim_member` - who booked |
| `club_key` | Foreign key to `dim_club` - where the class took place |
| `class_type_key` | Foreign key to `dim_class_type` - what was booked |
| `instructor_key` | Foreign key to `dim_instructor` - who taught it |
| `booking_id` | The original booking number, kept for tracing. A degenerate dimension |
| `price_paid` | Measure |

The number of bookings isn't a column. It's a count of the rows, because each row is one booking.

`member_key` and `instructor_key` aren't needed for the bookings report. They're there because a booking really does have a who and a taught-by, and the next report someone asks for will want them.

### The dimensions

| Dimension | Columns |
|---|---|
| `dim_date` | `date_key`, `date`, `day`, `month`, `month_name`, `year`, `weekday` |
| `dim_member` | `member_key`, `member_id`, `first_name`, `last_name`, `birth_date`, `membership_type`, `monthly_price`, `home_club` |
| `dim_club` | `club_key`, `club_id`, `name`, `street`, `city` |
| `dim_class_type` | `class_type_key`, `class_type_id`, `name`, `category`, `duration_min` |
| `dim_instructor` | `instructor_key`, `instructor_id`, `first_name`, `last_name` |

The hierarchies are flattened. `category` is a column on `dim_class_type`, so `class_category` doesn't survive as its own table. `membership_type` and `monthly_price` move onto `dim_member` the same way.

`class_session` and `studio` disappear completely. Everything the bookings report needed from them - the date and the club - is now a key on the fact. If someone later wants bookings per studio, studio could become its own dimension.

```
                dim_date        dim_member
                        \      /
       dim_instructor -- fact_booking -- dim_club
                            |
                      dim_class_type
```

### The bookings report against the star

```
SELECT   <club name>, <category>, <month>,
         <count of bookings>, <sum of price paid>
FROM     fact_booking
JOIN     dim_club         -- the club name
JOIN     dim_class_type   -- the category
JOIN     dim_date         -- the month, and the year to filter on
WHERE    <year is 2025>
GROUP BY <club name>, <category>, <month>
```

Three joins instead of five, one for each way the report breaks the numbers down. Every join goes straight from the fact to a dimension, and none of them is only there to reach another table.

## Stage 3: Model the check-ins star

### `fact_check_in`

The event is a **check-in**: a member visits a club. One row per visit.

| Column | What it is |
|---|---|
| `date_key` | Foreign key to `dim_date` |
| `member_key` | Foreign key to `dim_member` |
| `club_key` | Foreign key to `dim_club` |
| `check_in_id` | The original check-in number. A degenerate dimension |
| `minutes_in_gym` | Measure |

`minutes_in_gym` is worked out once from `checked_in_at` and `checked_out_at`, and stored on the fact, the same way `net_amount` was stored on `fact_sales` in the lecture.

### Both stars together

`dim_date`, `dim_member` and `dim_club` are used by both facts, so each one is built once and shared:

```
 dim_instructor   dim_class_type
            \       /
           fact_booking                 fact_check_in
            |   |   \                   /    |    |
            |   |    +--- dim_club ----+     |    |
            |   |                            |    |
            |   +--------- dim_member -------+    |
            |                                     |
            +------------- dim_date --------------+
```

A dimension shared by several fact tables like this is a **conformed dimension**.

### The check-ins report against the star

```
SELECT   <club name>, <membership type>, <weekday>,
         <count of check-ins>, <sum of minutes in gym>
FROM     fact_check_in
JOIN     dim_club     -- the club name
JOIN     dim_member   -- the membership type
JOIN     dim_date     -- the weekday, and the date to filter on
WHERE    <date is from 1 January to 31 March 2026>
GROUP BY <club name>, <membership type>, <weekday>
```

The weekday is a column on `dim_date`. `dim_date` has one row per day, so everything about a day - its weekday, its month, its year - is worked out once, when the table is built, and every report reads it from there.

## Reflection

**What else the star gives you.** The check-ins report has three joins in both versions, so the star didn't make it shorter. It still gains a lot:

- **Every join is a way of breaking the numbers down.** In the operational version, `member` is only a step on the way to `membership_type`. In the star, no join is there just to reach another table.
- **The work is done once.** The weekday is a column on `dim_date`, and the minutes are a stored measure. In the operational version, every report calculates both from timestamps on every row.
- **History.** The warehouse can keep old values that the operational database overwrites, such as where a member used to live. The next question is about this.
- **Reports across processes.** Check-ins and bookings share `dim_club`, `dim_date` and `dim_member`, so their numbers can be put side by side. The last question is about this.
- **Easier to read.** Someone who builds reports can see a fact and its dimensions, instead of a chain of operational tables.

**Overwriting the home club.** No. The operational database overwrites the home club because it only needs to know where to send her next email. The warehouse is a separate copy of the data, built for reports about the past, so it can keep both: Bergen for her check-ins before she moved, and Oslo for the ones after. If the warehouse overwrote it too, her January check-ins would count under Oslo, though she lived in Bergen and trained there. That's the same thing that happened to the customer who moved from Bergen to Oslo in the lecture. Keeping old values for old facts is what slowly changing dimensions are for.

**Check-ins next to bookings.** Both fact tables, `fact_check_in` and `fact_booking`, plus `dim_club` and `dim_date`. Neither fact is the main one: the report counts check-ins per club and month, counts bookings per club and month, and puts the two results side by side. That only works because both facts use the same `dim_club` and the same `dim_date`, so a club and a month mean the same thing on both sides. If each star had its own club table, the two sides would have to be matched by name, and one club spelled two different ways would break the report.
