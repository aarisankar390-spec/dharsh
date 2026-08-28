const $ = id => document.getElementById(id);
const API_BASE = location.hostname.endsWith('netlify.app') ? '/.netlify/functions/api' : '/api';
const labels = { breakfast: '🍳 Breakfast', lunch: '🍛 Lunch', dinner: '🍽️ Dinner' };
const today = new Date().toISOString().slice(0, 10);
$('historyDate').value = today;

async function loadState() {
  const response = await fetch(`${API_BASE}/state`);
  if (!response.ok) throw new Error('Unable to load history');
  return response.json();
}

function render(state) {
  const cutoff = $('historyDate').value || today;
  const dates = [...new Set(state.assignments.map(assignment => assignment.date))]
    .filter(date => date <= cutoff)
    .sort((a, b) => b.localeCompare(a));

  if (!dates.length) {
    $('history').innerHTML = '<section class="panel empty">No previous assignments found.</section>';
    return;
  }

  $('history').innerHTML = dates.map(date => {
    const assignments = state.assignments
      .filter(assignment => assignment.date === date)
      .sort((a, b) => ['breakfast', 'lunch', 'dinner'].indexOf(a.meal) - ['breakfast', 'lunch', 'dinner'].indexOf(b.meal));
    const totals = {};
    state.members.forEach(member => { totals[member.id] = 0; });
    assignments.forEach(assignment => assignment.items.forEach(item => { totals[item.memberId] = (totals[item.memberId] || 0) + item.normalizedWeight; }));

    return `<section class="panel history-day"><div class="section-title"><h2>${date}</h2><span>${assignments.length} meal${assignments.length === 1 ? '' : 's'} recorded</span></div><div class="history-summary">${state.members.map(member => `<div class="stat"><span>${member.name}</span><b>${(totals[member.id] || 0).toFixed(1)}%</b><small>workload that day</small></div>`).join('')}</div><div class="history-meals">${assignments.map(assignment => `<article class="meal-card"><h3>${labels[assignment.meal] || assignment.meal}</h3>${assignment.items.map(item => `<div class="assignment ${item.status === 'completed' ? 'done' : ''}"><div>${item.emoji || '✨'} <b>${item.taskName}</b><small>${item.memberName} · ${item.normalizedWeight.toFixed(2)}% weight</small></div><span class="history-status">${item.status === 'completed' ? 'Completed' : 'Pending'}</span></div>`).join('')}</article>`).join('')}</div></section>`;
  }).join('');
}

$('historyDate').onchange = async () => {
  try { render(await loadState()); } catch (error) { $('history').innerHTML = `<section class="panel empty">${error.message}</section>`; }
};
loadState().then(state => render(state)).catch(error => { $('history').innerHTML = `<section class="panel empty">${error.message}</section>`; });
