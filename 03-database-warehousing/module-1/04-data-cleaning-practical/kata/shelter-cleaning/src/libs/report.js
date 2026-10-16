// Writes a short cleaning report to reports/ and prints it:
// how many rows went in, how many came out, and how many each shelter lost.

const fs = require('fs');
const path = require('path');

// Counts the rows from each shelter. The name is trimmed and lowercased first,
// so the count works whether or not the shelter names have been cleaned.
function countByShelter(rows) {
    const counts = {};
    for (const row of rows) {
        const shelter = row.shelter.trim().toLowerCase();
        if (counts[shelter] === undefined) {
            counts[shelter] = 0;
        }
        counts[shelter]++;
    }
    return counts;
}

function writeReport(reportPath, rowsIn, rowsOut) {
    const lines = [
        'Cleaning report',
        `Records in:       ${rowsIn.length}`,
        `Records out:      ${rowsOut.length}`,
        `Records rejected: ${rowsIn.length - rowsOut.length}`,
        '',
        'Rejected by shelter',
    ];

    const inByShelter = countByShelter(rowsIn);
    const outByShelter = countByShelter(rowsOut);
    for (const shelter of Object.keys(inByShelter)) {
        let kept = 0;
        if (outByShelter[shelter] !== undefined) {
            kept = outByShelter[shelter];
        }
        const rejected = inByShelter[shelter] - kept;
        const percent = Math.round((rejected / inByShelter[shelter]) * 100);
        lines.push(`  ${shelter}: ${rejected} of ${inByShelter[shelter]} (${percent}%)`);
    }

    const report = lines.join('\n') + '\n';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    console.log(`\n${report}`);
}

module.exports = {
    writeReport,
};
