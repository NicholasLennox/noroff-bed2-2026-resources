# Cleaning rules

Each problem you find in the sales export becomes a rule here, and then a function in `src/libs/cleaningRules.js`. Rules are numbered in the order the pipeline runs them, and the same number marks each rule in the code. Rule 1 runs in step 2, straight after parsing, because every other rule uses the new column names.

Copy this block for each new rule:

- **Found**: the problem, with an example row
- **Dimension**: completeness / validity / consistency / uniqueness / accuracy / timeliness
- **Why it matters**: what breaks in a sales report
- **Action**: fix / flag / reject
- **Function**:

## 1. Column names use different styles

- **Found**: the headers are capitalised (`ID,Date,Channel,Customer,Product,Qty,Amount`), and nothing decides how a name like `Unit Price` would be written.
- **Dimension**: consistency
- **Why it matters**: every column name should follow one style. snake_case is a common choice, and a name with a space or hyphen would need quotes in SQL and brackets in JavaScript.
- **Action**: fix, by renaming every column to snake_case: lowercase, with spaces and hyphens turned into underscores.
- **Function**: `renameColumnsToSnakeCase`

## 2. Customer is missing

- **Found**: 31 rows have no customer. Example: `T016,02.09.2026,POS-BGN,,USB-C Hub,1,449`.
- **Dimension**: completeness
- **Why it matters**: the sale cannot appear in any report per customer.
- **Action**: reject.
- **Function**: `hasCustomer`

## 3. Amount is missing, zero or negative

- **Found**: 2 rows have no amount, 6 have a negative amount and 1 has an amount of 0. Examples: `T214,23/09/2026,PHONE,C35,Mouse,2,` and `T004,2026-09-01,POS-OSL,C04,Monitor,1,-2499`.
- **Dimension**: completeness for the missing amounts, validity for the others
- **Why it matters**: the amount is what a sales report adds up. Negative amounts may be refunds or mistakes, and only the business can say which. This pipeline treats them as out of scope for a sales total.
- **Action**: reject.
- **Function**: `hasPositiveAmount`

## 4. Quantity is missing, zero or negative

- **Found**: 4 rows have no quantity, 6 have a quantity of 0 but still have an amount, and 2 have a negative quantity. Examples: `T025,2026-09-03,PHONE,C48,Keyboard,,1598` and `T006,01.09.2026,POS-BGN,C06,Laptop,0,12000`.
- **Dimension**: completeness for the missing quantities, validity for the others
- **Why it matters**: a sale of nothing cannot earn money, so either the quantity or the amount is wrong.
- **Action**: reject. The true quantity cannot be worked out: an amount of 1000 could be 1 × 1000 or 2 × 500, and the export does not hold the price at the time of purchase.
- **Function**: `hasPositiveQty`

## 5. Product names use different casing

- **Found**: the same product appears as `Mouse`, `MOUSE` and `mouse`. Example: `T002,01/09/2026,PHONE,C02,mouse,1,299`.
- **Dimension**: consistency
- **Why it matters**: grouping by product splits one product's sales across several spellings.
- **Action**: fix, by making every product name lowercase.
- **Function**: `standardiseProduct`

## 6. Dates come in different formats, and some are swapped

- **Found**: WEB and POS-OSL write `2026-09-01`, POS-BGN writes `01.09.2026`, and PHONE mixes `2026-09-01` with `01/09/2026`. Some dates have the day and month swapped, such as `2026-14-09` (T120), or `2026-07-09` (T058), which is a real date but outside the September export.
- **Dimension**: consistency, and accuracy for the swapped dates
- **Why it matters**: the same day sorts and groups as different dates, and a swapped date drops the sale out of September.
- **Action**: fix, by rewriting every date as YYYY-MM-DD and swapping the day and month back when only the day matches the export month. Any other format is left as it is, because guessing could produce the wrong date.
- **Function**: `standardiseDate`
