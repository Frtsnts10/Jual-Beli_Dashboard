const fs = require('fs');
let content = fs.readFileSync('src/locales/dictionary.ts', 'utf8');

const translations = {
  id: {
    weekly: 'Mingguan',
    ctaWeekly: 'Tingkatkan Mingguan',
    workspaceWeek: ' / ruang kerja minggu'
  },
  en: {
    weekly: 'Weekly',
    ctaWeekly: 'Upgrade Weekly Shard',
    workspaceWeek: ' / workspace week'
  },
  es: {
    weekly: 'Semanal',
    ctaWeekly: 'Mejorar Shard Semanal',
    workspaceWeek: ' / espacio semana'
  },
  fr: {
    weekly: 'Hebdomadaire',
    ctaWeekly: 'Améliorer Shard Hebdomadaire',
    workspaceWeek: ' / semaine'
  },
  de: {
    weekly: 'Wöchentlich',
    ctaWeekly: 'Wöchentliches Shard Upgrade',
    workspaceWeek: ' / Woche'
  },
  ja: {
    weekly: '週払い',
    ctaWeekly: '週間シャードアップグレード',
    workspaceWeek: ' / 週'
  },
  zh: {
    weekly: '按周计费',
    ctaWeekly: '升级周付分片',
    workspaceWeek: ' / 每周'
  }
};

let currentLang = 'id';
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.match(/^  (id|en|es|fr|de|ja|zh): \{/)) {
    currentLang = line.match(/^  (id|en|es|fr|de|ja|zh): \{/)[1];
  }
  
  if (line.includes('weekly: "Mingguan / Weekly"')) {
    lines[i] = line.replace('"Mingguan / Weekly"', `"${translations[currentLang].weekly}"`);
  }
  
  if (line.includes('workspaceWeek: " / minggu / week"')) {
    lines[i] = line.replace('" / minggu / week"', `"${translations[currentLang].workspaceWeek}"`);
  }
  
  if (line.includes('ctaWeekly: "Tingkatkan Mingguan / Upgrade Weekly"')) {
    lines[i] = line.replace('"Tingkatkan Mingguan / Upgrade Weekly"', `"${translations[currentLang].ctaWeekly}"`);
  }
}

fs.writeFileSync('src/locales/dictionary.ts', lines.join('\n'));
console.log('done');
