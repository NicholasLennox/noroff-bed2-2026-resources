// Prints a quick look at a set of rows: how many there are, the first five,
// and how many values are empty in each column.

function printSummary(title, rows) {
    console.log(`\n=== ${title}: ${rows.length} rows ===`);
    console.table(rows.slice(0, 5));

    const emptyValues = {};
    for (const column of Object.keys(rows[0])) {
        emptyValues[column] = 0;
        for (const row of rows) {
            if (row[column] === '') {
                emptyValues[column]++;
            }
        }
    }

    console.log('Empty values per column:');
    console.table(emptyValues);
}

module.exports = {
    printSummary,
};
