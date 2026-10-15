// Step 5: the cleaning report.
// Each run writes a text file to reports/ showing how many records were rejected,
// by rule and by channel. A rejection rate higher than usual is a reason to look
// into the source system, so earlier reports are kept to compare against.

const fs = require('fs');
const path = require('path');

// Adds a leading zero, so 9 becomes '09'.
function pad(number) {
    return String(number).padStart(2, '0');
}

// '2026-10-15 14:32:05' inside the report, '2026-10-15_14-32-05' in the file name,
// because Windows does not allow ':' in file names.
function formatRunTime(date, dateTimeSeparator, timeSeparator) {
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const time = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(timeSeparator);
    return day + dateTimeSeparator + time;
}

// Turns 52 of 291 into '17.9%'.
function percentage(part, whole) {
    return `${((part / whole) * 100).toFixed(1)}%`;
}

// A row that fails more than one rule is counted under each of them.
function countRejectedByRule(rows, rejectRules) {
    const counts = {};
    for (const rule of rejectRules) {
        counts[rule.name] = 0;
        for (const row of rows) {
            if (!rule(row)) {
                counts[rule.name]++;
            }
        }
    }
    return counts;
}

// Counts the rows from each channel, such as { WEB: 125, PHONE: 43 }.
function countRowsByChannel(rows) {
    const counts = {};
    for (const row of rows) {
        if (counts[row.channel] === undefined) {
            counts[row.channel] = 0;
        }
        counts[row.channel]++;
    }
    return counts;
}

// Builds the report text from the rows before and after cleaning.
function createReport(runTime, details) {
    const recordsIn = details.rows.length;
    const recordsOut = details.cleanedRows.length;
    const recordsRejected = recordsIn - recordsOut;

    const lines = [
        'Cleaning report',
        `Run:     ${formatRunTime(runTime, ' ', ':')}`,
        `Input:   ${path.basename(details.inputPath)}`,
        `Output:  ${path.basename(details.outputPath)}`,
        '',
        `Records in:        ${recordsIn}`,
        `Records rejected:  ${recordsRejected} (${percentage(recordsRejected, recordsIn)})`,
        `Records out:       ${recordsOut}`,
        '',
        'Rejected by rule',
    ];

    const rejectedByRule = countRejectedByRule(details.rows, details.rejectRules);
    for (const ruleName of Object.keys(rejectedByRule)) {
        lines.push(`  ${ruleName.padEnd(20)}${rejectedByRule[ruleName]}`);
    }

    // The rejection rate per channel points to the source system that needs a closer look.
    lines.push('', 'Rejected by channel');
    const inByChannel = countRowsByChannel(details.rows);
    const outByChannel = countRowsByChannel(details.cleanedRows);
    for (const channel of Object.keys(inByChannel)) {
        const channelIn = inByChannel[channel];
        let channelOut = 0;
        if (outByChannel[channel] !== undefined) {
            channelOut = outByChannel[channel];
        }
        const channelRejected = channelIn - channelOut;
        lines.push(`  ${channel.padEnd(10)}${channelRejected} of ${channelIn} (${percentage(channelRejected, channelIn)})`);
    }

    return lines.join('\n') + '\n';
}

// Each run gets its own file, so earlier reports are kept to compare against.
function writeReport(reportsFolder, details) {
    const runTime = new Date();
    const report = createReport(runTime, details);

    fs.mkdirSync(reportsFolder, { recursive: true });
    const reportPath = path.join(reportsFolder, `cleaning-report_${formatRunTime(runTime, '_', '-')}.txt`);
    fs.writeFileSync(reportPath, report);

    return report;
}

module.exports = {
    writeReport,
};
