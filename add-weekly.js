const fs = require('fs');
let content = fs.readFileSync('src/locales/dictionary.ts', 'utf8');

content = content.replace(/monthly: "([^"]+)",/g, 'weekly: "Mingguan / Weekly",\n      monthly: "$1",');
content = content.replace(/workspaceMonth: "([^"]+)",/g, 'workspaceWeek: " / minggu / week",\n      workspaceMonth: "$1",');
content = content.replace(/ctaMonthly: "([^"]+)",/g, 'ctaWeekly: "Tingkatkan Mingguan / Upgrade Weekly",\n      ctaMonthly: "$1",');
content = content.replace(/monthly: \[([\s\S]*?)\](,?)/g, 'weekly: [$1]$2\n        monthly: [$1]$2');

fs.writeFileSync('src/locales/dictionary.ts', content);
console.log('done');
