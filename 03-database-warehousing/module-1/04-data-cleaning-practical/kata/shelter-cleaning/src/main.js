// Cleaning pipeline for one month of animal shelter intake data. Run it with `npm start`.
// It reads the raw export from data/, writes the cleaned CSV next to it,
// and writes a cleaning report to reports/.

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const cleaningRules = require('./libs/cleaningRules');
const { printSummary } = require('./libs/summary');
const { writeReport } = require('./libs/report');

// Settings

const inputPath = path.join(__dirname, '../data/shelter_intake_2026-09.csv');
const outputPath = path.join(__dirname, '../data/shelter_intake_2026-09_cleaned.csv');
const reportPath = path.join(__dirname, '../reports/cleaning-report.txt');

// 1. Extract - read the raw CSV from inputPath into a string called rawCsv

// 2. Parse - turn rawCsv into an array called rows, with one object per data row
// and the header line as the property names. Every value is still text.

printSummary('Raw data', rows);

// 3. Transform - apply the cleaning rules, one rule per line
const cleanedRows = rows
    .map(cleaningRules.standardiseSpecies); // Rule 1

// 4. Load - turn cleanedRows back into CSV text, with a header line,
// and write it to outputPath

// 5. Report results
printSummary('Cleaned data', cleanedRows);
writeReport(reportPath, rows, cleanedRows);
