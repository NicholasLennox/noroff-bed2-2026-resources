// A quick look at a set of rows, printed to the console.
// main.js prints one for the raw data and one for the cleaned data, so you can compare them.

// Counts the empty cells in each column, to show where values are missing.
function countEmptyValuesPerColumn(rows, columns) {
    const counts = {};
    for (const column of columns) {
        counts[column] = 0;
    }
    for (const row of rows) {
        for (const column of columns) {
            if (row[column] === '') {
                counts[column]++;
            }
        }
    }
    return counts;
}

// Prints the row count, the column names, the first 5 rows and the empty values per column.
function printSummary(title, rows) {
    const columns = Object.keys(rows[0]);

    console.log(`\n=== ${title} ===`);
    console.log(`Rows: ${rows.length}`);
    console.log(`Columns: ${columns.join(', ')}`);

    console.log('\nFirst 5 rows:');
    console.table(rows.slice(0, 5));

    console.log('Empty values per column:');
    console.table(countEmptyValuesPerColumn(rows, columns));
}

module.exports = {
    printSummary,
};
