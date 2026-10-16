// The cleaning rules, one function per rule. Each rule has the same number here
// and in cleaning-rules.md.
//
// Every rule takes one row and never changes it:
// - A reject rule returns true to keep the row and false to reject it. Use it with .filter.
// - A fix rule returns a new row with the value fixed. Use it with .map.
// - A flag rule returns a new row with an extra column marking it for review. Use it with .map.

// Rule 1 (fix): species names use different casing.
function standardiseSpecies(row) {
    return { ...row, species: row.species.toLowerCase() };
}

module.exports = {
    standardiseSpecies,
};
