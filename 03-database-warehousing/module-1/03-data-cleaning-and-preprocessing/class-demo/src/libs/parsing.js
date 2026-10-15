// Step 2 helpers: turning the parsed CSV into values the rules can work with.

// A CSV holds every value as text, so number columns are converted here.
// Empty cells stay empty, because Number('') would turn a missing value into 0,
// and a missing value should still be counted as missing.
function convertNumberColumns(rows, columns) {
    for (const row of rows) {
        for (const column of columns) {
            if (row[column] !== '') {
                row[column] = Number(row[column]);
            }
        }
    }
}

module.exports = {
    convertNumberColumns,
};
