# Cleaning rules

## Data quality report

One row per problem you find in the intake export. The first row is filled in as an example.

| Issue | Example | Dimension | Potential impact |
|---|---|---|---|
| Species names use different casing | A002 `cat`, A004 `DOG` | Consistency | Counting animals per species splits one species across several spellings |

## Rules

Each problem in the report that you decide to handle becomes a rule here, and then a function in `src/libs/cleaningRules.js`. Number the rules in the order the pipeline runs them, and use the same number in the code.

Copy this block for each new rule:

- **Found**: the problem, with an example row
- **Dimension**: completeness / validity / consistency / uniqueness / accuracy
- **Why it matters**: what goes wrong for the adoption website or the intake report
- **Action**: fix / flag / reject
- **Function**:

## 1. Species names use different casing

- **Found**: the same species appears as `Dog`, `DOG` and `dog`. Example: `A004,Rex,DOG,45,30,kg,y,Oslo`.
- **Dimension**: consistency
- **Why it matters**: counting animals by species splits one species across several spellings, and the website's species filter misses some of them.
- **Action**: fix, by making every species name lowercase.
- **Function**: `standardiseSpecies`
