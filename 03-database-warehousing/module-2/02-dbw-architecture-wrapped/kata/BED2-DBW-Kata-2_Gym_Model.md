# BED 2 Database Warehousing - Kata 2

## Intro

This kata is about designing a dimensional model from an operational database. You read the normalised schema of a gym chain, find the business events in it, and model them as fact tables with dimension tables around them, arranged as star schemas.

There's no database to build and no code to run. Work on paper or in a diagram tool such as [draw.io](https://www.drawio.com/). You check each model by planning the query a report would run against it and writing the shell of that query: which tables it joins, and what it selects, filters and groups by.

Use the [Data Warehouse Architecture and the Dimensional Model lecture](../../01-dbw-architecture/lecture.md) and Microsoft's [Understand star schema](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema) page rather than asking an AI. Name your tables the way the lecture does, with `fact_` and `dim_` in front.

There are two reports, and you take each one along the same path: first through the operational database, then through a star schema. Bookings go first, with a worked example to follow. Check-ins go second, and you work them out yourself.

In stage 1 you plan both reports against the operational database. In stage 2 you model a star schema for bookings. In stage 3 you model a second star for check-ins, on the same diagram as the first.

## The gym chain

Pulse runs gyms in several Norwegian cities. Members can train at any club, and they book group classes such as spin and yoga through the Pulse app. When they arrive at a club, they scan their membership card at the door, and they scan it again on the way out.

The app and the door scanners write to one operational database:

| Table | Columns |
|---|---|
| `member` | `member_id`, `first_name`, `last_name`, `email`, `birth_date`, `home_club_id`, `membership_type_id` |
| `membership_type` | `membership_type_id`, `name`, `monthly_price` |
| `club` | `club_id`, `name`, `street`, `city` |
| `studio` | `studio_id`, `club_id`, `name`, `capacity` |
| `class_type` | `class_type_id`, `name`, `category_id`, `duration_min` |
| `class_category` | `category_id`, `name` |
| `instructor` | `instructor_id`, `first_name`, `last_name` |
| `class_session` | `session_id`, `class_type_id`, `studio_id`, `instructor_id`, `starts_at` |
| `booking` | `booking_id`, `member_id`, `session_id`, `booked_at`, `price_paid` |
| `check_in` | `check_in_id`, `member_id`, `club_id`, `checked_in_at`, `checked_out_at` |

Drawn out, each arrow goes from a foreign key (`FK`) to the table it points at. The line from the top of `member` is `home_club_id`, pointing at the member's home club:

```
+-----------------------+      +-----------------------+
| class_category        |      | instructor            |
+-----------------------+      +-----------------------+
| category_id           |      | instructor_id         |
| name                  |      | first_name            |
+-----------------------+      | last_name             |
         ^                     +-----------------------+
         |                              ^
         |                              |
+-----------------------+      +-----------------------+      +-----------------------+      +-----------------------+
| class_type            |      | class_session         |      | studio                |      | club                  |
+-----------------------+      +-----------------------+      +-----------------------+      +-----------------------+
| class_type_id         |      | session_id            |      | studio_id             |      | club_id               |
| name                  |<-----| class_type_id      FK |      | club_id            FK |----->| name                  |
| category_id        FK |      | studio_id          FK |----->| name                  |      | street                |
| duration_min          |      | instructor_id      FK |      | capacity              |  +-->| city                  |
+-----------------------+      | starts_at             |      +-----------------------+  |   +-----------------------+
                               +-----------------------+                                 |            ^
                                        ^                                                |            |
                                        |                                          +-----+            |
                                        |                                          |                  |
                               +-----------------------+      +-----------------------+      +-----------------------+
                               | booking               |      | member                |      | check_in              |
                               +-----------------------+      +-----------------------+      +-----------------------+
                               | booking_id            |      | member_id             |      | check_in_id           |
                               | member_id          FK |----->| first_name            |<-----| member_id          FK |
                               | session_id         FK |      | last_name             |      | club_id            FK |
                               | booked_at             |      | email                 |      | checked_in_at         |
                               | price_paid            |      | birth_date            |      | checked_out_at        |
                               +-----------------------+      | home_club_id       FK |      +-----------------------+
                                                              | membership_type_id FK |
                                                              +-----------------------+
                                                                       |
                                                                       v
                                                              +-----------------------+
                                                              | membership_type       |
                                                              +-----------------------+
                                                              | membership_type_id    |
                                                              | name                  |
                                                              | monthly_price         |
                                                              +-----------------------+
```

Some examples of what the rows mean:

- A `class_type` is a kind of class, such as *Spin 45* in the category *Cardio*.
- A `class_session` is one scheduled class: *Spin 45*, in studio 2 at Pulse Bergen Sentrum, on 14 March 2025 at 18:00.
- A `booking` is one member booking one session. Most classes are included in the membership, so `price_paid` is usually 0, but some premium classes cost extra.
- A `check_in` is one visit to a club, from the scan at the door to the scan on the way out.

Pulse's management wants two reports:

> **Report 1:** Number of bookings and total booking revenue, per class category, per club, per month, for 2025.
>
> **Report 2:** Number of check-ins and total minutes spent in the gym, per club, per membership type, per weekday, for January to March 2026.

## Stage 1: Plan the reports against the operational database

**Goal:** a planned query shell for each report against the operational database.

### Worked example: Report 1

Start by listing what the report is looking for, and where each piece lives:

| We're looking for | It's in |
|---|---|
| Number of bookings | Count the rows in `booking` |
| Booking revenue | `booking.price_paid` |
| Class category | `class_category.name` |
| Club | `club.name` |
| Month the class took place | `class_session.starts_at` |
| Only 2025 | `class_session.starts_at` |

The numbers are in `booking`, so the query starts there. From `booking`, find a path of foreign keys to every other table in the list:

```
booking --> class_session --> class_type --> class_category
                  |
                  +---------> studio --> club
```

That path gives the shell of the query. The angle brackets say what goes in each place, and the comments say why each table is joined:

```
SELECT   <club name>, <category name>, <month of the class>,
         <count of bookings>, <sum of price paid>
FROM     booking
JOIN     class_session    -- the date, and the way to class type and studio
JOIN     class_type       -- only to reach class_category
JOIN     class_category   -- the category name
JOIN     studio           -- only to reach club
JOIN     club             -- the club name
WHERE    <the class took place in 2025>
GROUP BY <club name>, <category name>, <month of the class>
```

That's five joins. Two of them, `class_type` and `studio`, are there only to get from one table to the next. The report doesn't use a single column from either.

### Your turn: Report 2

1. Plan Report 2 the same way: a table of what it's looking for and where each piece lives, the path from the table holding the numbers, and the query shell with a comment on every join.
2. Count the joins, and mark the ones that are only there to reach the next table.

## Stage 2: Model the bookings star

**Goal:** a star schema for bookings, and Report 1's query shell rewritten against it.

1. Name the business event behind Report 1. That event is your fact table.
2. List the fact table's columns: the foreign keys to its dimensions, its measures, and anything else that belongs on the fact.
3. For each dimension, list its columns. Each dimension should be a single table, so anything the operational schema spread across several tables has to end up as columns on one.
4. Draw the star.
5. **Check:** rewrite Report 1's query shell against your star, in the same form as the worked example. Count the joins and compare them with the worked example's five. If any part of the report needs more than one join to reach, go back to step 3.

## Stage 3: Model the check-ins star

**Goal:** a second star for check-ins, drawn on the same diagram as the first, and Report 2's query shell rewritten against it.

1. Model Report 2 the same way, starting from your plan in stage 1: the event, the fact table and its columns, and the dimensions.
2. Draw both stars together on one diagram. If a dimension appears in both, draw it once and connect it to both fact tables.
3. **Check:** rewrite Report 2's query shell against your model. Every join should go straight from the fact to a dimension.
4. Management now wants one more report:

   > **Report 3:** Per club, per month, for 2025: the number of check-ins next to the number of class bookings.

   Plan it with a table of what it's looking for and where each piece lives in your model. You don't need to write its shell.

### Reflection

- Report 1 went from five joins to three when it moved to a star, but Report 2 didn't get shorter. What changed about Report 2's joins instead?
- **Break it.** Give each star its own club table, and spell one club *Pulse Bergen Sentrum* in one and *Pulse Bergen sentrum* in the other. What happens to that club in Report 3?
- A member moves from Bergen to Oslo in June, and the warehouse overwrites the home club on her `dim_member` row. Which city do her January check-ins now count under?
