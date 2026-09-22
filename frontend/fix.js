const fs = require('fs');
let content = fs.readFileSync('src/components/AnalyticsView.tsx', 'utf8');

content = content.replace(/Object\.keys\(overview\.state_breakdown\)[\s\S]*?\.slice\(0,\s*5\)[\s\S]*?\.map\(\(state\) => \(/g, 'overview.top_states.slice(0, 5).map(({ state }) => (');
content = content.replace(/Object\.keys\(overview\.work_type_breakdown\)[\s\S]*?\.slice\(0,\s*7\)[\s\S]*?\.map\(\(sector\) => \(/g, 'overview.work_type_breakdown.slice(0, 7).map(({ work_type: sector }) => (');

fs.writeFileSync('src/components/AnalyticsView.tsx', content);
