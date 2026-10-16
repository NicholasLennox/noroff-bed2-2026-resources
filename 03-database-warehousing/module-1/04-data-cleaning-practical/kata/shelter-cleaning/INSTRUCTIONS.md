# Shelter data cleaning

Three animal shelters, in Oslo, Bergen and Trondheim, send their intake records to a shared adoption website every month. Each month the records also go into an intake report that counts animals per shelter and per species.

The website lists each animal with:

- its species, so visitors can filter by it
- its age in years
- its weight, always shown in kilograms
- whether it has been vaccinated, shown as yes or no

The September 2026 export is in `data/shelter_intake_2026-09.csv`. It has 300 rows, and it isn't fit for that purpose yet. Your job is to explore it, record what's wrong with it, and build the rules that clean it.

## Contents

- [Getting started](#getting-started)
- [The data](#the-data)
- [Your dev log](#your-dev-log)
- [Stage 1: Explore the data](#stage-1-explore-the-data)
- [Stage 2: Clean the data](#stage-2-clean-the-data)
- [Stage 3: Read the report and refine](#stage-3-read-the-report-and-refine)
- [Reflection](#reflection)
- [Bonus: More rules, less code](#bonus-more-rules-less-code)
- [References](#references)

## Getting started

Copy this folder somewhere of your own, then install the dependencies:

```bash
npm install
```

```
shelter-cleaning/
├── data/
│   └── shelter_intake_2026-09.csv    # the raw export, never changed
├── src/
│   ├── libs/
│   │   ├── cleaningRules.js          # one function per rule - you add to this
│   │   ├── report.js                 # writes the cleaning report
│   │   └── summary.js                # prints a summary to the console
│   └── main.js                       # the pipeline: settings and five steps
├── cleaning-rules.md                 # your data quality report and rules
├── DEVLOG.md                         # your dev log
└── package.json
```

`main.js` has the pipeline's five steps. Transform and report are written, with rule 1 as the only rule. Extract, parse and load are left for you:

1. Fill in step 1, extract: read the file at `inputPath` into `rawCsv`.
2. Fill in step 2, parse: turn `rawCsv` into `rows`, one object per data row, with the header line giving the property names.
3. Fill in step 4, load: turn `cleanedRows` back into CSV text with a header line, and write it to `outputPath`.
4. Run `npm start`.

`parse` and `stringify` are already imported from the sync versions of csv-parse and csv-stringify. Their docs are under [References](#references).

**Check:** you see a summary of the raw data, a summary of the cleaned data, and a cleaning report with 300 records in and 0 rejected. `data/shelter_intake_2026-09_cleaned.csv` exists, with the same header as the raw file and every species in lowercase.

## The data

| Column | What it holds |
|---|---|
| `animal_id` | The shelter's ID for the animal |
| `name` | The animal's name, if it has one |
| `species` | Dog, cat, rabbit or guinea pig |
| `age_years` | Age in whole years |
| `weight` | Weight, in the unit given in the next column |
| `weight_unit` | `kg` or `g`, depending on how the shelter weighed the animal |
| `vaccinated` | Whether the animal has been vaccinated |
| `shelter` | Which shelter took it in |

These are the first 16 rows:

```csv
animal_id,name,species,age_years,weight,weight_unit,vaccinated,shelter
A001,Bella,Dog,3,24,kg,yes,Oslo
A002,Milo,cat,2,4200,g,no,Trondheim
A003,Luna,Cat,,3.8,kg,Yes,Trondheim
A004,Rex,DOG,45,30,kg,y,Oslo
A005,Kanin,Rabbit,1,1.9,KG,no, Bergen
A005,Kanin,Rabbit,1,1.9,KG,no, Bergen
A006,,Dog,5,18,kg,unknown,Trondheim
A007,Simba,Cat,4,-4,kg,yes,Bergen
A008,Max,Dgo,7,27,kg,No,Oslo
A009,Nala,Guinea pig,2,850,g,true,trondheim
A010,Charlie,dog,6,0,kg,,Oslo
A011,Pusur,CAT,11,4.5,Kg,n,Bergen
A012,Oreo,guinea Pig,1,0.9,kg,yes,Oslo
A013,Rocky,Dog,9,32,kg,no,Bergen
A014,Molly,Rabit,3,2100,g,Y,Trondheim
A015,Tiger,Cat,38,5.1,kg,no,OSLO
```

## Your dev log

`DEVLOG.md` is for you. Add a short entry as you go: what you found, what you made, what you changed, and what you learnt. How much you write is up to you, but a few lines after each rule makes the reflection much easier to answer.

## Stage 1: Explore the data

**Goal:** a data quality report in `cleaning-rules.md` with at least four problems: the example already there, and three you found yourself.

1. Read the sample above row by row, with the website's needs in mind. A value can be correct in the export and still not be what the website needs. For each problem, decide which dimension of data quality it falls under: completeness, validity, consistency, uniqueness or accuracy.
2. Read the raw data summary from `npm start`. It shows how many values are missing in each column across all 300 rows, not just the sample.
3. Open the full CSV and look through it. The sample shows what kinds of problems there are, but not how often each one happens or which shelters it comes from.
4. Add each problem to the data quality report table: the issue, an example row, the dimension, and what it could do to the adoption website or the intake report.

There are many more problems in this data than that. Three of your own is the minimum, so pick the ones you want to handle first. The bonus at the end is about going further. If you want to see every value used in a column, you can write a small function in `summary.js` that counts them.

**Check:** your report has at least four rows, each naming a dimension.

## Stage 2: Clean the data

**Goal:** each problem in your report has a rule in `cleaning-rules.md` and a function in `src/libs/cleaningRules.js`, and the cleaned CSV no longer has that problem.

Work one problem at a time:

1. Decide whether the rule should **fix** the value, **flag** the record for someone to check, or **reject** the record. If a fix would have to guess, it isn't a fix.
2. Write the rule in `cleaning-rules.md` using the template, with the next rule number.
3. Write the function in `cleaningRules.js` and export it. Rule 1 is there as an example, and the comment at the top of the file describes the three kinds of rule. Every value from the CSV is text, so convert with `Number()` where a rule compares or calculates.
4. Add the function to the chain in step 3 of `main.js`, one rule per line, with its rule number in a comment.
5. Run `npm start`. Check the cleaned summary, the report and the cleaned CSV to confirm the rule did what you meant.

**Check:** every rule in `cleaning-rules.md` has a matching function in the chain, and `npm start` runs without errors.

## Stage 3: Read the report and refine

**Goal:** at least one rule changed because of what the report or the cleaned data showed you, with the change recorded in your dev log.

1. Read the cleaning report. Look at how many records each shelter lost.
2. Read the cleaned CSV for quality problems the same way you read the raw data. Look for problems that are still there, and for records that were removed when they shouldn't have been.
3. Change at least one rule. You might widen it to cover a case it missed, change its action, or merge it with another rule. Update its entry in `cleaning-rules.md` to match.
4. Write a dev log entry under **Changed** saying what you changed and why.
5. Run `npm start` and compare the new report with the one before.

**Check:** the code and `cleaning-rules.md` describe the same rules, in the same order.

## Reflection

Answer these in your own words. Your dev log should help.

1. Rex, in row A004, is a dog aged 45. The value is a whole number, in the right column and the right format. Which dimension of data quality does it fail, and why can't a check on the format catch it?

2. Choose one problem you flagged or rejected instead of fixing. What would someone need to know about that animal before the value could be fixed?

3. Suppose this data were going to a vet who only needs to know which animals still need vaccinating, instead of to the adoption website. Choose one of your rules. Would it still be the right rule for that purpose? Explain why.

4. **Break it.** Move rule 1, the species rule, to the end of the chain in `main.js`, after all your other rules. Run the pipeline and compare the report with your last run. Explain the difference, or explain why there isn't one. Then move it back.

5. The report shows which shelter loses the most records. Suggest one change to how that shelter records its intake that would make one of your rules unnecessary.

6. Your pipeline is one small step. Next month, a larger pipeline will join your cleaned file with the vets' treatment records, matching rows on `animal_id`. Which problem in this data would cause trouble for that join if it were left in?

7. **Break it.** Add this line to the end of the raw CSV and run the pipeline:

   ```csv
   A291,Mr. Whiskers, Jr,Cat,5,4.1,kg,yes,Oslo
   ```

   Read the error. How should the line have been written so that the name could keep its comma? Remove the line again when you're done.

## Bonus: More rules, less code

1. **Find as many as you can.** Go back to your data quality report and handle every problem you can find in the data, not just the three the stages asked for. Each one goes through the same steps: a row in the report, a rule in `cleaning-rules.md`, and a function in the chain.
2. **Refactor.** Read through `cleaningRules.js` and look for functions that do nearly the same thing. Change your code so that one function can do the job of several rules, without changing what the cleaned CSV looks like.

**Check:** run `npm start` before and after you refactor. The cleaning report and the cleaned CSV should be the same both times.

## References

- [csv-parse sync API](https://csv.js.org/parse/api/sync/) and [csv-stringify sync API](https://csv.js.org/stringify/api/sync/)
- [`Array.prototype.filter()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) and [`Array.prototype.map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
- [`Array.prototype.includes()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes)
- [`Number()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/Number)
- [`String.prototype.trim()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim) and [`String.prototype.toLowerCase()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase)
- [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
