// The cleaning rules, one function per rule, in the order the pipeline runs them.
// Each rule is written up in cleaning-rules.md under the same number.
//
// Every rule takes one row and never changes it:
// - A reject rule returns true to keep the row and false to reject it. It is used with .filter.
// - A fix rule returns a new row with the value fixed. It is used with .map.

// Turns 'Customer' into 'customer' and 'Unit Price' or 'Unit-Price' into 'unit_price'.
function toSnakeCase(name) {
    return name.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

// Rule 1 (fix): column names use different styles.
// Runs in step 2, straight after parsing, because every other rule uses the new names.
function renameColumnsToSnakeCase(row) {
    const renamedRow = {};
    for (const column of Object.keys(row)) {
        renamedRow[toSnakeCase(column)] = row[column];
    }
    return renamedRow;
}

// Rule 2 (reject): customer is missing.
function hasCustomer(row) {
    return row.customer !== '';
}

// Rule 3 (reject): amount is missing, zero or negative.
function hasPositiveAmount(row) {
    return row.amount !== '' && row.amount > 0;
}

// Rule 4 (reject): quantity is missing, zero or negative.
function hasPositiveQty(row) {
    return row.qty !== '' && row.qty > 0;
}

// Rule 5 (fix): product names use different casing.
function standardiseProduct(row) {
    return { ...row, product: row.product.toLowerCase() };
}

// The three date formats in the export, one per data entry route.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD, from WEB, POS-OSL and some PHONE
const SLASH_DATE = /^\d{2}\/\d{2}\/\d{4}$/; // DD/MM/YYYY, from PHONE
const DOT_DATE = /^\d{2}\.\d{2}\.\d{4}$/; // DD.MM.YYYY, from POS-BGN

// Rule 6 (fix): dates come in different formats, and some have day and month swapped.
// exportMonth is the only month in the export, such as '09' for September.
function standardiseDate(row, exportMonth) {
    let year;
    let month;
    let day;

    if (ISO_DATE.test(row.date)) {
        year = row.date.slice(0, 4);
        month = row.date.slice(5, 7);
        day = row.date.slice(8, 10);
    } else if (SLASH_DATE.test(row.date) || DOT_DATE.test(row.date)) {
        day = row.date.slice(0, 2);
        month = row.date.slice(3, 5);
        year = row.date.slice(6, 10);
    } else {
        // Unknown format: leave it as it is instead of guessing.
        return row;
    }

    // The month is wrong but the day matches the export month, so they were swapped.
    if (month !== exportMonth && day === exportMonth) {
        day = month;
        month = exportMonth;
    }

    return { ...row, date: `${year}-${month}-${day}` };
}

module.exports = {
    renameColumnsToSnakeCase,
    hasCustomer,
    hasPositiveAmount,
    hasPositiveQty,
    standardiseProduct,
    standardiseDate,
};
