import data from './teamsData.js';
const pool = [];
Object.entries(data).forEach(([k, v]) => {
  if (!v.teams || ['custom', 'worldCup', 'championsleague', 'libertadores'].includes(k)) return;
  v.teams.forEach(t => pool.push({ ...t, id: `${k}-${t.name}`, leagueKey: k, leagueLabel: v.label }));
});
const leagueKeys = [...new Set(pool.map(t => t.leagueKey))];
const labels = [...new Set(pool.map(t => t.leagueLabel))];
console.log('teams', pool.length);
console.log('leagueKeys', leagueKeys.length, leagueKeys.join('|'));
console.log('labels', labels.length, labels.join('|'));
