// Data cleaning pipeline for one month of sales data. Run it with `npm start`.
// It reads the raw export from data/, writes the cleaned CSV next to it,
// and saves a cleaning report to reports/.
// Each cleaning rule is written up in cleaning-rules.md.

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { convertNumberColumns } = require('./libs/parsing');
const cleaningRules = require('./libs/cleaningRules');
const { printSummary } = require('./libs/summary');
const { writeReport } = require('./libs/report');

// Settings

const inputPath = path.join(__dirname, '../data/sales_system_export_2026-09.csv');
const outputPath = path.join(__dirname, '../data/sales_system_export_2026-09_cleaned.csv');
const reportsFolder = path.join(__dirname, '../reports');

// The file name ends in YYYY-MM, so its last two characters are the export month.
const exportMonth = path.basename(inputPath, '.csv').slice(-2);

// Columns that hold numbers, by their snake_case names (Qty and Amount in the raw CSV).
const numberColumns = ['qty', 'amount'];

// 1. Extract - read the raw CSV
const rawCsv = fs.readFileSync(inputPath, 'utf8');

// 2. Parse - turn CSV rows into JS objects
const parsedRows = parse(rawCsv, { columns: true });
const rows = parsedRows.map(cleaningRules.renameColumnsToSnakeCase); // Rule 1
convertNumberColumns(rows, numberColumns);

printSummary('Raw data', rows);

// 3. Transform - apply the cleaning rules, one rule per line.
// Rejections come first, so the fixes only run on rows that are kept.
const cleanedRows = rows
    .filter(cleaningRules.hasCustomer) // Rule 2
    .filter(cleaningRules.hasPositiveAmount) // Rule 3
    .filter(cleaningRules.hasPositiveQty) // Rule 4
    .map(cleaningRules.standardiseProduct) // Rule 5
    .map((row) => cleaningRules.standardiseDate(row, exportMonth)); // Rule 6

// 4. Load - write the cleaned rows to a new CSV
const cleanedCsv = stringify(cleanedRows, { header: true });
fs.writeFileSync(outputPath, cleanedCsv);

// 5. Report results - compare with the raw data, and save a cleaning report
printSummary('Cleaned data', cleanedRows);

// The reject rules again, so the report can count what each one removed.
const rejectRules = [
    cleaningRules.hasCustomer,
    cleaningRules.hasPositiveAmount,
    cleaningRules.hasPositiveQty,
];
const report = writeReport(reportsFolder, { inputPath, outputPath, rows, cleanedRows, rejectRules });
console.log(`\n${report}`);
