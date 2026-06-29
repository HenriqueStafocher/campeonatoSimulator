import leagueData from './teamsData.js';

const app = document.getElementById('app');

// Sistema de Cache com localStorage
const StorageManager = {
    CACHE_KEY: 'leaguesCache',
    
    saveLeagues() {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(leagueData));
        } catch (e) {
            console.warn('Erro ao salvar ligas no localStorage:', e);
        }
    },
    
    loadLeagues() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            console.warn('Erro ao carregar ligas do localStorage:', e);
            return null;
        }
    },
    
    clear() {
        try {
            localStorage.removeItem(this.CACHE_KEY);
        } catch (e) {
            console.warn('Erro ao limpar localStorage:', e);
        }
    }
};
const leagueButtons = [
    { key: 'custom', label: 'Personalizado', special: 'custom' },
    { key: 'worldCup', label: 'Copa do Mundo', special: 'worldCup' },
    { key: 'championsleague', label: 'Champions League', special: 'championsleague' },
    { key: 'libertadores', label: 'Libertadores', special: 'libertadores' },
    { key: 'brasil', label: 'Liga Brasil' },
    { key: 'grecia', label: 'Liga Grécia' },
    { key: 'tcheca', label: 'Liga Tcheca' },
    { key: 'italia', label: 'Liga Italia' },
    { key: 'inglaterra', label: 'Liga Inglaterra' },
    { key: 'franca', label: 'Liga França' },
    { key: 'alemanha', label: 'Liga Alemanha' },
    { key: 'espanha', label: 'Liga Espanha' },
    { key: 'argentina', label: 'Liga Argentina' },
    { key: 'usa', label: 'Liga USA' },
    { key: 'japao', label: 'Liga Japão' },
    { key: 'belgica_a', label: 'Liga Bélgica' },
    { key: 'holanda', label: 'Liga Holanda' },
    { key: 'noruega', label: 'Liga Noruega' },
    { key: 'portugal', label: 'Liga Portugal' },
    { key: 'suecia', label: 'Liga Suécia' },
    { key: 'mexico', label: 'Liga México' },
    { key: 'venezuela', label: 'Liga Venezuela' },
    { key: 'suica', label: 'Liga Suíça' },
    { key: 'turquia', label: 'Liga Turquia' },
    { key: 'escocia', label: 'Liga Escócia' },
    { key: 'russia', label: 'Liga Rússia' },
    { key: 'arabia', label: 'Liga Arábia' },
    { key: 'coreia', label: 'Liga Coreia' },
    { key: 'bolivia', label: 'Liga Bolívia' },
    { key: 'chile', label: 'Liga Chile' },
    { key: 'colombia', label: 'Liga Colômbia' },
    { key: 'equador', label: 'Liga Equador' },
    { key: 'paraguai', label: 'Liga Paraguai' },
    { key: 'peru', label: 'Liga Peru' },
    { key: 'uruguai', label: 'Liga Uruguai' }
];

const stages = {
    selection: 'selection',
    group: 'group',
    dezesseisavos: 'dezesseisavos',
    oitavas: 'oitavas',
    quartas: 'quartas',
    semi: 'semi',
    final: 'final',
    champion: 'champion'
};

const state = {
    leagueKey: null,
    leagueTeams: [],
    schedule: [],
    currentRound: 0,
    libertadores: {
        selectedIds: new Set(),
        pool: [],
        selectedTeams: [],
        groups: [],
        groupRound: 0,
        groupHistory: [],
        knockout: null,
        live: null,
        champion: null,
        label: 'Libertadores'
    },
    custom: {
        selectedIds: new Set(),
        pool: [],
        selectedTeams: [],
        groups: [],
        groupRound: 0,
        groupHistory: [],
        knockout: null,
        live: null,
        champion: null,
        label: 'Personalizado',
        targetSize: 32
    },
    championsleague: {
        selectedIds: new Set(),
        pool: [],
        selectedTeams: [],
        groups: [],
        groupRound: 0,
        groupHistory: [],
        knockout: null,
        live: null,
        champion: null,
        label: 'Champions League',
        targetSize: 32
    },
    worldCup: {
        selectedIds: new Set(),
        pool: [],
        selectedTeams: [],
        groups: [],
        groupRound: 0,
        groupHistory: [],
        knockout: null,
        live: null,
        champion: null,
        label: 'Copa do Mundo',
        targetSize: 48
    }
};

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function renderMainScreen() {
    const buttons = leagueButtons.map(button => {
        return `<button data-key="${button.key}" class="${button.special ? 'success' : ''}">${button.label}</button>`;
    }).join('');

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h1>Qual Liga ou Campeonato deseja simular?</h1>
                    <p class="description">Escolha um dos destinos abaixo para carregar os times e o simulador correspondente.</p>
                </div>
            </div>
            <div class="button-grid">${buttons}</div>
        </section>
    `;

    app.querySelectorAll('button[data-key]').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.dataset.key;
            handleLeagueChoice(key);
        });
    });
}

function handleLeagueChoice(key) {
    if (key === 'libertadores') {
        setupTournamentSelection('libertadores');
        return;
    }
    if (key === 'custom') {
        setupTournamentSelection('custom');
        return;
    }
    if (key === 'worldCup') {
        setupTournamentSelection('worldCup');
        return;
    }
    if (key === 'championsleague') {
        setupTournamentSelection('championsleague');
        return;
    }
    renderLeagueSimulator(key);
}

function setupTournamentSelection(mode) {
    const tournament = state[mode];
    tournament.selectedIds.clear();
    tournament.selectedTeams = [];
    tournament.pool = mode === 'libertadores'
        ? buildLibertadoresPool()
        : mode === 'worldCup'
            ? buildWorldCupPool()
            : mode === 'championsleague'
                ? buildChampionsLeaguePool()
                : buildCustomPool();
    tournament.groups = [];
    tournament.groupRound = 0;
    tournament.groupHistory = [];
    tournament.knockout = null;
    tournament.live = null;
    tournament.champion = null;
    tournament.targetSize = mode === 'worldCup' ? 48 : 32;
    renderTournamentSelection(mode);
}

function buildCustomPool() {
    const pool = [];
    Object.entries(leagueData).forEach(([leagueKey, league]) => {
        if (!league.teams || ['custom', 'worldCup', 'championsleague', 'libertadores'].includes(leagueKey)) {
            return;
        }
        league.teams.forEach(team => {
            pool.push({
                ...team,
                id: `${leagueKey}-${team.name}`,
                leagueKey,
                leagueLabel: league.label
            });
        });
    });
    return pool;
}

function buildWorldCupPool() {
    return leagueData.worldCup.teams.map(team => ({
        ...team,
        id: `worldCup-${team.name}`,
        leagueKey: 'worldCup',
        leagueLabel: leagueData.worldCup.label
    }));
}

function buildChampionsLeaguePool() {
    const leagueKeys = ['inglaterra', 'espanha', 'italia', 'alemanha', 'franca', 'portugal', 'holanda', 'belgica_a', 'turquia', 'tcheca', 'grecia'];
    const pool = [];
    leagueKeys.forEach(leagueKey => {
        const league = leagueData[leagueKey];
        if (!league || !league.teams) return;
        league.teams.forEach(team => {
            pool.push({
                ...team,
                id: `${leagueKey}-${team.name}`,
                leagueKey,
                leagueLabel: league.label
            });
        });
    });
    return pool;
}

function getMaxGroupRounds(mode) {
    return mode === 'libertadores' ? 3 : 6;
}

function renderTournamentSelection(mode) {
    const tournament = state[mode];
    const groups = {};

    tournament.pool.forEach(team => {
        if (!groups[team.leagueKey]) {
            groups[team.leagueKey] = { label: team.leagueLabel, teams: [] };
        }
        groups[team.leagueKey].teams.push(team);
    });

    const sections = Object.entries(groups).map(([leagueKey, group]) => {
        const items = group.teams.map(team => {
            const selected = tournament.selectedIds.has(team.id);
            return `
                <label class="team-card">
                    <span>${team.name}</span>
                    <input type="checkbox" data-id="${team.id}" ${selected ? 'checked' : ''} />
                </label>
            `;
        }).join('');
        return `
            <div class="card">
                <h3>${group.label}</h3>
                <div class="team-selection">${items}</div>
            </div>
        `;
    }).join('');

    const selectedCount = tournament.selectedIds.size;
    const targetSize = tournament.targetSize || 32;
    const startDisabled = selectedCount !== targetSize;
    const description = mode === 'worldCup'
        ? `Selecione ${targetSize} países para montar a Copa do Mundo. Use o botão RANDOM para completar automaticamente.`
        : `Selecione ${targetSize} times para montar um campeonato personalizado. Use o botão RANDOM para completar automaticamente.`;

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${tournament.label}</h2>
                    <p class="description">${description}</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="status-line">
                <span>Times selecionados: <strong>${selectedCount}</strong> / ${targetSize}</span>
                <button id="randomFill" class="success">Randomizar times restantes</button>
                <button id="startGroups" class="success" ${startDisabled ? 'disabled' : ''}>Fase de Grupos</button>
            </div>
        </section>
        <div class="section-panel">${sections}</div>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('randomFill').addEventListener('click', () => {
        fillTournamentWithRandomTeams(mode);
        renderTournamentSelection(mode);
    });
    document.getElementById('startGroups').addEventListener('click', () => {
        if (tournament.selectedIds.size !== targetSize) {
            return;
        }
        tournament.selectedTeams = tournament.pool.filter(team => tournament.selectedIds.has(team.id));
        startTournamentGroupStage(mode);
    });

    app.querySelectorAll('input[type=checkbox][data-id]').forEach(input => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            if (input.checked) {
                if (tournament.selectedIds.size >= targetSize) {
                    input.checked = false;
                    return;
                }
                tournament.selectedIds.add(id);
            } else {
                tournament.selectedIds.delete(id);
            }
            renderTournamentSelection(mode);
        });
    });
}

function fillTournamentWithRandomTeams(mode) {
    const tournament = state[mode];
    const targetSize = tournament.targetSize || 32;
    const remaining = targetSize - tournament.selectedIds.size;
    if (remaining <= 0) {
        return;
    }

    const available = shuffle(tournament.pool.filter(team => !tournament.selectedIds.has(team.id)));
    for (let i = 0; i < remaining && i < available.length; i += 1) {
        tournament.selectedIds.add(available[i].id);
    }
}

function renderSimpleSpecial(title, description) {
    const league = leagueData[title === 'Champions League' ? 'championsleague' : 'worldCup'];
    state.leagueKey = title === 'Champions League' ? 'championsleague' : 'worldCup';
    state.leagueTeams = createChampionshipTeams(league.teams);
    state.schedule = buildSchedule(state.leagueTeams);
    state.currentRound = 0;
    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${title}</h2>
                    <p class="description">${description}</p>
                </div>
            </div>
            <div class="status-line">
                <span>Rodada atual: <strong>0 / ${state.schedule.length}</strong></span>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="section-panel">
                <button id="simulateRound" class="success">Simular rodada</button>
                <button id="simulateAll" class="success">Simular campeonato</button>
            </div>
            <div id="leagueSummary" class="section-panel"></div>
            <div id="leagueTable" class="table-wrapper section-panel"></div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('simulateRound').addEventListener('click', simulateLeagueRound);
    document.getElementById('simulateAll').addEventListener('click', simulateLeagueAll);
    renderLeagueStatus();
    renderLeagueStandings();
}

// CORREÇÃO AQUI: Garantindo que todos os times tenham um strength válido (fallback de 50)
function createChampionshipTeams(teams) {
    return teams.map(team => ({
        id: `${team.name}-${team.nation || team.country}`,
        name: team.name,
        strength: team.strength || 50, 
        country: team.nation || team.country,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
    }));
}

function buildSchedule(teams) {
    const list = [...teams];
    if (list.length % 2 !== 0) {
        list.push({ id: 'bye', name: 'Folga', strength: 0, country: '', bye: true });
    }
    
    const firstHalf = [];
    const fixed = list[0];
    const rotating = list.slice(1);
    const totalRounds = list.length - 1;

    for (let round = 0; round < totalRounds; round += 1) {
        const roundMatches = [];
        const frame = [fixed, ...rotating];
        for (let i = 0; i < frame.length / 2; i += 1) {
            const teamA = frame[i];
            const teamB = frame[frame.length - 1 - i];
            if (teamA.bye || teamB.bye) continue;
            roundMatches.push({ teamA, teamB, goalsA: null, goalsB: null });
        }
        firstHalf.push(roundMatches);
        
        // CORREÇÃO AQUI: Método mais seguro para rotacionar os times e evitar bugs no JS
        const last = rotating.pop();
        rotating.unshift(last);
    }

    const secondHalf = firstHalf.map(roundMatches =>
        roundMatches.map(match => ({
            teamA: match.teamB, 
            teamB: match.teamA, 
            goalsA: null,
            goalsB: null
        }))
    );

    return [...firstHalf, ...secondHalf];
}

function simulateLeagueRound() {
    if (state.currentRound >= state.schedule.length) {
        return;
    }
    state.schedule[state.currentRound].forEach(match => simulateMatch(match));
    state.currentRound += 1;
    renderLeagueStatus();
    renderLeagueStandings();
}

function simulateLeagueAll() {
    for (; state.currentRound < state.schedule.length; state.currentRound += 1) {
        state.schedule[state.currentRound].forEach(match => simulateMatch(match));
    }
    renderLeagueStatus();
    renderLeagueStandings();
}

function simulateMatch(match) {
    if (match.goalsA !== null) {
        return;
    }
    const [goalsA, goalsB] = getGoals(match.teamA, match.teamB);
    match.goalsA = goalsA;
    match.goalsB = goalsB;
    updateTeamStats(match.teamA, goalsA, goalsB);
    updateTeamStats(match.teamB, goalsB, goalsA);
}

function updateTeamStats(team, forGoals, againstGoals) {
    team.played += 1;
    team.goalsFor += forGoals;
    team.goalsAgainst += againstGoals;
    if (forGoals > againstGoals) {
        team.wins += 1;
        team.points += 3;
    } else if (forGoals === againstGoals) {
        team.draws += 1;
        team.points += 1;
    } else {
        team.losses += 1;
    }
}

// CORREÇÃO AQUI: Forçando valor default caso team.strength chegue vazio
function getGoals(teamA, teamB) {
    const strengthA = Math.max(1, teamA.strength || 50);
    const strengthB = Math.max(1, teamB.strength || 50);
    const diff = strengthA - strengthB;
    
    const averageA = Math.max(0.2, 1.2 + (diff / 25) + (Math.random() * 0.4 - 0.2));
    const averageB = Math.max(0.2, 1.2 - (diff / 25) + (Math.random() * 0.4 - 0.2));
    
    const goalsA = Math.min(7, Math.max(0, Math.round(averageA + (Math.random() * 1.5))));
    const goalsB = Math.min(7, Math.max(0, Math.round(averageB + (Math.random() * 1.5))));
    
    return [goalsA, goalsB];
}

function renderLeagueStatus() {
    const container = document.getElementById('leagueSummary');
    if (!container) return;
    container.innerHTML = `
        <div class="alert-box">
            <div class="status-line">
                <span><strong>${state.currentRound}</strong> rodadas simuladas</span>
                <span>Proxima rodada: <strong>${Math.min(state.currentRound + 1, state.schedule.length)}</strong></span>
            </div>
        </div>
    `;
}

function renderLeagueStandings() {
    const target = document.getElementById('leagueTable');
    if (!target) return;
    const sorted = [...state.leagueTeams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const diffA = a.goalsFor - a.goalsAgainst;
        const diffB = b.goalsFor - b.goalsAgainst;
        if (diffB !== diffA) return diffB - diffA;
        return b.goalsFor - a.goalsFor;
    });

    const rows = sorted.map((team, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${team.name}</td>
            <td>${team.points}</td>
            <td>${team.played}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
            <td>${team.goalsFor}</td>
            <td>${team.goalsAgainst}</td>
            <td>${team.goalsFor - team.goalsAgainst}</td>
        </tr>
    `).join('');

    target.innerHTML = `
        <div class="table-wrapper">
            <table class="standings">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Time</th>
                        <th>PTS</th>
                        <th>J</th>
                        <th>V</th>
                        <th>E</th>
                        <th>D</th>
                        <th>GP</th>
                        <th>GC</th>
                        <th>SG</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderLeagueSimulator(key) {
    const league = leagueData[key];
    if (!league) {
        app.innerHTML = `<section class="card"><p>Esse campeonato ainda nao esta disponivel.</p></section>`;
        return;
    }
    state.leagueKey = key;
    state.leagueTeams = createChampionshipTeams(league.teams);
    state.schedule = buildSchedule(state.leagueTeams);
    state.currentRound = 0;

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${league.label}</h2>
                    <p class="description">Simule um campeonato com os times desta liga. Use as opcoes abaixo para avancar rodada a rodada ou finalizar a competicao.</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="section-panel">
                <button id="simulateRound" class="success">Simular rodada</button>
                <button id="simulateAll" class="success">Simular campeonato</button>
            </div>
            <div id="leagueSummary"></div>
            <div id="leagueTable"></div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('simulateRound').addEventListener('click', simulateLeagueRound);
    document.getElementById('simulateAll').addEventListener('click', simulateLeagueAll);
    renderLeagueStatus();
    renderLeagueStandings();
}

function setupLibertadoresSelection() {
    state.libertadores.selectedIds.clear();
    state.libertadores.selectedTeams = [];
    state.libertadores.pool = buildLibertadoresPool();
    state.libertadores.groupRound = 0;
    state.libertadores.groupHistory = [];
    state.libertadores.knockout = null;
    state.libertadores.live = null;
    state.libertadores.champion = null;
    renderLibertadoresSelection();
}

function buildLibertadoresPool() {
    const pool = [];
    leagueData.libertadores.leagues.forEach(leagueKey => {
        const league = leagueData[leagueKey];
        if (!league || !league.teams) return;
        league.teams.forEach(team => {
            pool.push({
                ...team,
                id: `${leagueKey}-${team.name}`,
                leagueKey,
                leagueLabel: league.label
            });
        });
    });
    return pool;
}

function renderLibertadoresSelection() {
    const groups = {};
    state.libertadores.pool.forEach(team => {
        groups[team.leagueLabel] = groups[team.leagueLabel] || [];
        groups[team.leagueLabel].push(team);
    });

    const sections = Object.keys(groups).map(label => {
        const items = groups[label].map(team => {
            const selected = state.libertadores.selectedIds.has(team.id);
            return `
                <label class="team-card">
                    <span>${team.name}</span>
                    <input type="checkbox" data-id="${team.id}" ${selected ? 'checked' : ''} />
                </label>
            `;
        }).join('');
        return `
            <div class="card">
                <h3>${label}</h3>
                <div class="team-selection">${items}</div>
            </div>
        `;
    }).join('');

    const selectedCount = state.libertadores.selectedIds.size;
    const isReady = selectedCount === 32;

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>Libertadores</h2>
                    <p class="description">Escolha os times para a fase inicial. Selecione ate 32 times. Use o botao RANDOM para completar automaticamente.</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="status-line">
                <span>Times selecionados: <strong>${selectedCount}</strong> / 32</span>
                <button id="randomFill" class="success">Randomizar times restantes</button>
                <button id="startGroups" class="success" ${selectedCount < 1 ? 'disabled' : ''}>Fase de Grupos</button>
            </div>
        </section>
        <div class="section-panel">
            ${sections}
        </div>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('randomFill').addEventListener('click', () => {
        fillLibertadoresWithRandomTeams();
        renderLibertadoresSelection();
    });
    document.getElementById('startGroups').addEventListener('click', () => {
        state.libertadores.selectedTeams = Array.from(state.libertadores.pool).filter(team => state.libertadores.selectedIds.has(team.id));
        if (state.libertadores.selectedTeams.length === 0) {
            return;
        }
        startLibertadoresGroupStage();
    });

    app.querySelectorAll('input[type=checkbox][data-id]').forEach(input => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            if (input.checked) {
                if (state.libertadores.selectedIds.size >= 32) {
                    input.checked = false;
                    return;
                }
                state.libertadores.selectedIds.add(id);
            } else {
                state.libertadores.selectedIds.delete(id);
            }
            renderLibertadoresSelection();
        });
    });
}

function fillLibertadoresWithRandomTeams() {
    const remaining = 32 - state.libertadores.selectedIds.size;
    if (remaining <= 0) {
        return;
    }

    const availableByLeague = {};
    state.libertadores.pool.forEach(team => {
        if (!state.libertadores.selectedIds.has(team.id)) {
            availableByLeague[team.leagueKey] = availableByLeague[team.leagueKey] || [];
            availableByLeague[team.leagueKey].push(team);
        }
    });

    const leagueKeys = Object.keys(availableByLeague);
    let count = remaining;
    while (count > 0) {
        for (const key of leagueKeys) {
            if (count <= 0) break;
            const candidates = availableByLeague[key].filter(team => !state.libertadores.selectedIds.has(team.id));
            if (candidates.length === 0) continue;
            const candidate = candidates[Math.floor(Math.random() * candidates.length)];
            state.libertadores.selectedIds.add(candidate.id);
            count -= 1;
        }
        if (leagueKeys.every(key => availableByLeague[key].every(team => state.libertadores.selectedIds.has(team.id)))) {
            break;
        }
    }
}

function startTournamentGroupStage(mode) {
    const tournament = state[mode];
    const selected = tournament.selectedTeams;
    const targetSize = tournament.targetSize || 32;
    if (!selected || selected.length !== targetSize) {
        return;
    }
    const shuffled = shuffle(selected);
    const groupCount = mode === 'worldCup' ? 12 : 8;
    const teamsPerGroup = 4;
    const groups = [];
    for (let index = 0; index < groupCount; index += 1) {
        groups.push({
            name: String.fromCharCode(65 + index),
            teams: shuffled.slice(index * teamsPerGroup, index * teamsPerGroup + teamsPerGroup).map(team => ({
                ...team,
                strength: team.strength || 50, // Adicionado segurança aqui também
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0
            }))
        });
    }

    const roundPairs = [
        [[0, 1], [2, 3]],
        [[0, 2], [1, 3]],
        [[0, 3], [1, 2]],
        [[1, 0], [3, 2]],
        [[2, 0], [3, 1]],
        [[3, 0], [2, 1]]
    ];

    tournament.groups = groups.map(group => ({
        name: group.name,
        teams: group.teams,
        rounds: roundPairs.map(pairs => pairs.map(([a, b]) => ({
            teamA: group.teams[a],
            teamB: group.teams[b],
            goalsA: null,
            goalsB: null
        })))
    }));
    tournament.groupRound = 0;
    tournament.groupHistory = [];
    renderTournamentGroupStage(mode);
}

function renderTournamentGroupStage(mode) {
    const tournament = state[mode];
    const groupsHtml = tournament.groups.map(group => {
        const rows = getGroupStandings(group).map(team => `
            <tr>
                <td>${team.position}</td>
                <td>${team.name}</td>
                <td>${team.points}</td>
                <td>${team.played}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalsFor - team.goalsAgainst}</td>
            </tr>
        `).join('');
        return `
            <div class="group-table card">
                <h3>Grupo ${group.name}</h3>
                <table>
                    <thead>
                        <tr><th>#</th><th>Time</th><th>PTS</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }).join('');

    const historyRows = tournament.groupHistory.map(match => {
        return `<div class="match-item"><span>${match.group}</span><span>${match.teamA} ${match.goalsA} x ${match.goalsB} ${match.teamB}</span><span>${match.round}</span></div>`;
    }).join('') || '<div class="alert-box">Nenhuma rodada simulada ainda.</div>';

    const maxRounds = getMaxGroupRounds(mode);
    const canAdvance = tournament.groupRound < maxRounds;
    const showOitavas = tournament.groupRound >= maxRounds;
    const displayRound = Math.min(tournament.groupRound + 1, maxRounds);
    const title = `${state[mode].label} - Fase de Grupos`;
    const description = mode === 'libertadores'
        ? '8 grupos com 32 times. Avance ate 3 rodadas para a Libertadores.'
        : mode === 'worldCup'
            ? '12 grupos com 48 times. Avance cada rodada ate completar 6 rodadas de ida e volta e classificar os times para a fase final.'
            : '8 grupos com 32 times. Avance cada rodada ate completar 6 rodadas de ida e volta.';

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${title}</h2>
                    <p class="description">${description}</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="status-line">
                <span>Rodada atual: <strong>${displayRound}</strong> / ${maxRounds}</span>
                <button id="advanceRound" class="success" ${canAdvance ? '' : 'disabled'}>Avancar rodada</button>
                ${showOitavas ? '<button id="goOitavas" class="success">Oitavas</button>' : ''}
            </div>
        </section>
        <section class="group-grid">${groupsHtml}</section>
        <section class="card section-panel">
            <h3>Historico de jogos</h3>
            <div class="match-history">${historyRows}</div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('advanceRound').addEventListener('click', () => {
        advanceTournamentGroupRound(mode);
        renderTournamentGroupStage(mode);
    });
    if (showOitavas) {
        document.getElementById('goOitavas').addEventListener('click', () => startTournamentOitavas(mode));
    }
}

function getQualifiedTeamsForKnockout(mode) {
    const tournament = state[mode];
    if (mode === 'worldCup') {
        const firstTwo = tournament.groups.flatMap(group => getGroupStandings(group).slice(0, 2));
        const thirdPlaces = tournament.groups
            .map(group => getGroupStandings(group)[2])
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                const gdA = a.goalsFor - a.goalsAgainst;
                const gdB = b.goalsFor - b.goalsAgainst;
                if (gdB !== gdA) return gdB - gdA;
                return b.goalsFor - a.goalsFor;
            })
            .slice(0, 8);
        return [...firstTwo, ...thirdPlaces];
    }

    return tournament.groups.flatMap(group => getGroupStandings(group).slice(0, 2));
}

function getGroupStandings(group) {
    const sorted = [...group.teams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
    });
    return sorted.map((team, index) => ({ position: index + 1, ...team }));
}

function advanceTournamentGroupRound(mode) {
    const tournament = state[mode];
    const maxRounds = getMaxGroupRounds(mode);
    if (tournament.groupRound >= maxRounds) {
        return;
    }
    const currentRound = tournament.groupRound;
    tournament.groups.forEach(group => {
        const matches = group.rounds[currentRound];
        matches.forEach(match => {
            const [goalsA, goalsB] = getGoals(match.teamA, match.teamB);
            match.goalsA = goalsA;
            match.goalsB = goalsB;
            updateTeamStats(match.teamA, goalsA, goalsB);
            updateTeamStats(match.teamB, goalsB, goalsA);
            tournament.groupHistory.unshift({
                group: group.name,
                round: `R${currentRound + 1}`,
                teamA: match.teamA.name,
                teamB: match.teamB.name,
                goalsA,
                goalsB
            });
        });
    });
    tournament.groupRound += 1;
}

function startTournamentOitavas(mode) {
    const tournament = state[mode];
    const qualified = getQualifiedTeamsForKnockout(mode);
    const stage = mode === 'worldCup' ? stages.dezesseisavos : stages.oitavas;
    tournament.knockout = createKnockoutStage(stage, qualified);
    renderTournamentKnockout(mode);
}

function createKnockoutStage(stage, teams) {
    return {
        stage,
        completed: false,
        simulated: false,
        matches: createBracketPairs(teams)
    }
}

function renderTournamentKnockout(mode) {
    const tournament = state[mode];
    if (!tournament.knockout) {
        return renderMainScreen();
    }
    const stage = tournament.knockout.stage;
    if (stage === stages.champion) {
        return renderChampionScreen(mode);
    }
    
    if (stage === stages.quartas || stage === stages.semi || stage === stages.final) {
        return renderLiveKnockoutStage(mode);
    }

    renderKnockoutStage(mode);
}

function renderKnockoutStage(mode) {
    const knockout = state[mode].knockout;
    const title = knockout.stage === stages.dezesseisavos
        ? '16avos de Final'
        : knockout.stage === stages.oitavas
            ? 'Oitavas de Final'
            : knockout.stage === stages.quartas
                ? 'Quartas de Final'
                : knockout.stage === stages.semi
                    ? 'Semifinais'
                    : 'Final';

    const matchRows = knockout.matches.map((match, idx) => {
        let score = match.goalsA === null ? 'A definir' : `${match.goalsA} x ${match.goalsB}`;
        if (match.penalties && match.penalties.finished) {
            const scorePenA = match.penalties.attemptsA.filter(Boolean).length;
            const scorePenB = match.penalties.attemptsB.filter(Boolean).length;
            score += ` (${scorePenA}x${scorePenB} pen)`;
        }

        const result = match.winner ? ` - Vencedor: ${match.winner.name}` : '';
        let penaltyButton = '';
        if (!match.winner && match.goalsA !== null && match.goalsB !== null && match.goalsA === match.goalsB) {
            if (!match.penalties) {
                penaltyButton = `<button data-open-penalty="${idx}" class="secondary open-penalty">PÊNALTIS</button>`;
            } else {
                match._idx = idx;
                match._mode = mode;
                penaltyButton = renderPenaltyInterface(match);
            }
        }
        return `<div class="match-item"><span>${match.teamA.name}</span><span>${score}</span><span>${match.teamB.name}</span>${result}${penaltyButton}</div>`;
    }).join('');

    const simulateLabel = knockout.stage === stages.dezesseisavos
        ? 'Simular 16avos'
        : knockout.stage === stages.oitavas
            ? 'Simular Oitavas'
            : knockout.stage === stages.quartas
                ? 'Simular Quartas'
                : knockout.stage === stages.semi
                    ? 'Simular Semifinais'
                    : 'Simular Final';
    const advanceLabel = knockout.stage === stages.dezesseisavos
        ? 'Ir para Oitavas'
        : knockout.stage === stages.oitavas
            ? 'Ir para Quartas'
            : knockout.stage === stages.quartas
                ? 'Ir para Semifinais'
                : knockout.stage === stages.semi
                    ? 'Ir para Final'
                    : 'Ver Campeão';
    const canAdvance = knockout.matches.every(match => match.winner);
    const simulateButtonHtml = knockout.simulated ? '' : `<button id="simulateKnockout" class="success">${simulateLabel}</button>`;

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${title}</h2>
                    <p class="description">Simule a fase de mata-mata. Se algum jogo terminar empatado, use o botão PÊNALTIS.</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="status-line">
                ${simulateButtonHtml}
                ${canAdvance ? `<button id="advanceKnockout" class="success">${advanceLabel}</button>` : ''}
            </div>
        </section>
        <section class="knockout-list section-panel">${matchRows}</section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    const simulateKnockoutButton = document.getElementById('simulateKnockout');
    if (simulateKnockoutButton) {
        simulateKnockoutButton.addEventListener('click', () => {
            simulateKnockoutStage(mode);
            renderTournamentKnockout(mode);
        });
    }
    
    if (canAdvance) {
        document.getElementById('advanceKnockout').addEventListener('click', () => {
            advanceKnockoutStage(mode);
            renderTournamentKnockout(mode);
        });
    }

    document.querySelectorAll('.open-penalty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = Number(btn.getAttribute('data-open-penalty'));
            const match = state[mode].knockout.matches[idx];
            if (!match.penalties) {
                match.penalties = createPenaltyState(match.teamA, match.teamB);
                match._idx = idx;
                match._mode = mode;
            }
            renderTournamentKnockout(mode);
        });
    });

    document.querySelectorAll('[data-kick-penalty]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const [mIdx, mMode] = btn.getAttribute('data-kick-penalty').split(':').map(v => isNaN(v) ? v : Number(v));
            await handlePenaltyKick(mMode, Number(mIdx), false);
        });
    });

    document.querySelectorAll('[data-skip-penalty]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const [mIdx, mMode] = btn.getAttribute('data-skip-penalty').split(':').map(v => isNaN(v) ? v : Number(v));
            handleSkipPenalties(mMode, Number(mIdx), false);
        });
    });
}

function simulateKnockoutStage(mode) {
    const knockout = state[mode].knockout;
    if (knockout.simulated) {
        return;
    }

    knockout.matches.forEach(match => {
        const [goalsA, goalsB] = getGoals(match.teamA, match.teamB);
        match.goalsA = goalsA;
        match.goalsB = goalsB;
        if (goalsA !== goalsB) {
            match.winner = goalsA > goalsB ? match.teamA : match.teamB;
        } else {
            if (!match.penalties) match.penalties = createPenaltyState(match.teamA, match.teamB);
        }
    });

    knockout.simulated = true;
}

function advanceKnockoutStage(mode) {
    const knockout = state[mode].knockout;
    const winners = knockout.matches.map(match => match.winner).filter(Boolean);
    if (knockout.stage === stages.dezesseisavos) {
        state[mode].knockout = createKnockoutStage(stages.oitavas, winners);
    } else if (knockout.stage === stages.oitavas) {
        state[mode].knockout = createKnockoutStage(stages.quartas, winners);
    } else if (knockout.stage === stages.quartas) {
        state[mode].knockout = createKnockoutStage(stages.semi, winners);
    } else if (knockout.stage === stages.semi) {
        state[mode].knockout = createKnockoutStage(stages.final, winners);
    } else if (knockout.stage === stages.final) {
        state[mode].champion = winners[0];
        state[mode].knockout = { stage: stages.champion };
    }
}

function createBracketPairs(teams) {
    const pairs = [];
    for (let i = 0; i < teams.length; i += 2) {
        pairs.push({ id: i / 2, teamA: teams[i], teamB: teams[i + 1], goalsA: null, goalsB: null, winner: null, penalties: null });
    }
    return pairs;
}

function createPenaltyState(teamA, teamB) {
    return {
        teamA,
        teamB,
        attemptsA: [],
        attemptsB: [],
        turn: 'A',
        winner: null,
        finished: false,
        pendingKick: false
    };
}

function processPenaltyKick(match) {
    const penalties = match.penalties;
    if (!penalties || penalties.finished) {
        return;
    }
    const shooterAttempts = penalties.turn === 'A' ? penalties.attemptsA : penalties.attemptsB;
    const shooterTeam = penalties.turn === 'A' ? match.teamA : match.teamB;
    const success = Math.random() < Math.min(0.9, 0.45 + (shooterTeam.strength || 50) / 220);
    shooterAttempts.push(success);

    const scoreA = penalties.attemptsA.filter(Boolean).length;
    const scoreB = penalties.attemptsB.filter(Boolean).length;
    const kicksA = penalties.attemptsA.length;
    const kicksB = penalties.attemptsB.length;
    const remainingA = 5 - kicksA;
    const remainingB = 5 - kicksB;

    if (scoreA > scoreB + remainingB) {
        penalties.winner = match.teamA;
    } else if (scoreB > scoreA + remainingA) {
        penalties.winner = match.teamB;
    } else if (kicksA >= 5 && kicksB >= 5 && scoreA !== scoreB) {
        penalties.winner = scoreA > scoreB ? match.teamA : match.teamB;
    }

    if (kicksA >= 5 && kicksB >= 5 && scoreA === scoreB) {
        penalties.turn = penalties.turn === 'A' ? 'B' : 'A';
        return;
    }

    if (penalties.winner) {
        penalties.finished = true;
        match.winner = penalties.winner;
        return;
    }

    if (kicksA >= 5 && kicksB >= 5 && kicksA === kicksB && scoreA === scoreB) {
        penalties.turn = penalties.turn === 'A' ? 'B' : 'A';
        return;
    }

    penalties.turn = penalties.turn === 'A' ? 'B' : 'A';
}

function resolvePenaltyShootoutAutomatically(match) {
    if (!match.penalties) {
        match.penalties = createPenaltyState(match.teamA, match.teamB);
    }
    while (!match.penalties.finished) {
        processPenaltyKick(match);
    }
}

async function handlePenaltyKick(mode, matchIndex, isLive) {
    const tournament = state[mode];
    const match = isLive
        ? tournament.live?.matches?.[matchIndex]
        : tournament.knockout?.matches?.[matchIndex];

    if (!match) return;
    if (!match.penalties) {
        match.penalties = createPenaltyState(match.teamA, match.teamB);
    }
    if (match.penalties.finished || match.penalties.pendingKick) return;

    match.penalties.pendingKick = true;
    if (isLive) renderLiveKnockoutStage(mode);
    else renderTournamentKnockout(mode);

    await new Promise(resolve => setTimeout(resolve, 3000));
    match.penalties.pendingKick = false;
    processPenaltyKick(match);

    if (isLive) renderLiveKnockoutStage(mode);
    else renderTournamentKnockout(mode);
}

function handleSkipPenalties(mode, matchIndex, isLive) {
    const tournament = state[mode];
    let match = isLive ? tournament.live.matches[matchIndex] : tournament.knockout.matches[matchIndex];
    if (!match || !match.penalties || match.penalties.finished) return;
    
    resolvePenaltyShootoutAutomatically(match);
    
    if (isLive) renderLiveKnockoutStage(mode);
    else renderTournamentKnockout(mode);
}

function renderLiveKnockoutStage(mode) {
    const tournament = state[mode];
    const { stage, matches } = tournament.knockout;
    let title = 'Fase Final';
    if (stage === stages.quartas) title = 'Quartas de Final';
    else if (stage === stages.semi) title = 'Semifinal';
    else if (stage === stages.final) title = 'Final';

    if (stage === stages.final && matches.every(match => match.winner)) {
        tournament.champion = matches[0].winner;
        renderChampionScreen(mode);
        return;
    }

    if (!tournament.live || tournament.live.stage !== stage) {
        tournament.live = {
            stage,
            matches: [...matches],
            currentIndex: 0,
            inProgress: false,
            minute: 0,
            history: []
        };
    }

    const allMatchesFinished = tournament.live.matches.every(match => match.winner);
    
    const matchRows = tournament.live.matches.map((match, idx) => {
        let score = match.goalsA === null ? '0 x 0' : `${match.goalsA} x ${match.goalsB}`;
        if (match.penalties && match.penalties.finished) {
            const scorePenA = match.penalties.attemptsA.filter(Boolean).length;
            const scorePenB = match.penalties.attemptsB.filter(Boolean).length;
            score += ` (${scorePenA}x${scorePenB} pen)`;
        }

        const result = match.winner ? ` - Vencedor: ${match.winner.name}` : '';
        let penaltyPart = '';
        
        if (!match.winner && match.goalsA !== null && match.goalsB !== null && match.goalsA === match.goalsB && match.minute >= 90) {
            if (!match.penalties) {
                penaltyPart = `<button data-open-live-penalty="${match.id}" class="secondary open-live-penalty">PÊNALTIS</button>`;
            } else {
                match._idx = idx;
                match._mode = mode;
                penaltyPart = renderPenaltyInterface(match, mode, match._idx, true);
            }
        }
        return `<div class="match-item"><span>${match.teamA.name}</span><span>${score}</span><span>${match.teamB.name}</span>${result}${penaltyPart}</div>`;
    }).join('');

    const historyRows = tournament.live.history.length ? tournament.live.history.map(event => `<div class="match-item"><span>${event.minute}'</span><span>${event.message}</span><span></span></div>`).join('') : '<div class="alert-box">Nenhum evento ainda.</div>';

    let nextStageButton = '';
    if (allMatchesFinished) {
        if (stage === stages.quartas) nextStageButton = '<button id="goNext" class="success">Ir para Semifinal</button>';
        else if (stage === stages.semi) nextStageButton = '<button id="goNext" class="success">Ir para Final</button>';
        else if (stage === stages.final) nextStageButton = '<button id="goNext" class="success">Ver Campeão</button>';
    }

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${title}</h2>
                    <p class="description">Partidas simultâneas com tempo e histórico de gols.</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="status-line">
                <span>Tempo: <strong>${tournament.live.minute}'</strong></span>
                <button id="startLiveMatch" class="success">Iniciar partidas</button>
                ${nextStageButton}
            </div>
        </section>
        <section class="knockout-list section-panel">${matchRows}</section>
        <section class="card section-panel">
            <h3>Histórico de gols</h3>
            <div class="match-history">${historyRows}</div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    
    document.getElementById('startLiveMatch').addEventListener('click', () => {
        if (tournament.live.inProgress) return;
        startLiveMatch(mode);
    });

    document.querySelectorAll('.open-live-penalty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const matchId = btn.getAttribute('data-open-live-penalty');
            const match = tournament.live.matches.find(m => String(m.id) === String(matchId));
            if (match && !match.penalties) {
                match.penalties = createPenaltyState(match.teamA, match.teamB);
                match._idx = tournament.live.matches.indexOf(match);
                match._mode = mode;
            }
            renderLiveKnockoutStage(mode);
        });
    });

    document.querySelectorAll('[data-kick-penalty]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const [mIdx, mMode] = btn.getAttribute('data-kick-penalty').split(':');
            await handlePenaltyKick(mMode, Number(mIdx), true);
        });
    });
    
    document.querySelectorAll('[data-skip-penalty]').forEach(btn => {
        btn.addEventListener('click', () => {
            const [mIdx, mMode] = btn.getAttribute('data-skip-penalty').split(':');
            handleSkipPenalties(mMode, Number(mIdx), true);
        });
    });

    if (allMatchesFinished && document.getElementById('goNext')) {
        document.getElementById('goNext').addEventListener('click', () => {
            if (stage === stages.quartas) {
                tournament.knockout = { stage: stages.semi, matches: createBracketPairs(tournament.live.matches.map(m => m.winner)) };
            } else if (stage === stages.semi) {
                tournament.knockout = { stage: stages.final, matches: createBracketPairs(tournament.live.matches.map(m => m.winner)) };
            } else if (stage === stages.final) {
                tournament.champion = tournament.live.matches[0].winner;
                tournament.knockout = { stage: stages.champion };
            }
            tournament.live = null;
            renderTournamentKnockout(mode);
        });
    }
}

function startLiveMatch(mode) {
    const tournament = state[mode];
    
    if (tournament.live.intervalId) clearInterval(tournament.live.intervalId);

    tournament.live.inProgress = true;
    tournament.live.history = [];
    tournament.live.minute = 0;

    tournament.live.matches.forEach(match => {
        match.goalsA = 0;
        match.goalsB = 0;
        match.minute = 0;
        match.penalties = null;
        match.winner = null;
    });

    tournament.live.intervalId = setInterval(() => {
        tournament.live.minute += 1;
        
        tournament.live.matches.forEach(match => {
            match.minute = tournament.live.minute;
            const strengthA = match.teamA.strength || 50; // Segurança
            const strengthB = match.teamB.strength || 50; // Segurança
            let chanceA = 0.012 + (strengthA / 10000) + ((strengthA - strengthB) / 2000);
            let chanceB = 0.012 + (strengthB / 10000) + ((strengthB - strengthA) / 2000);
            chanceA = Math.max(0.002, Math.min(0.06, chanceA));
            chanceB = Math.max(0.002, Math.min(0.06, chanceB));
            
            if (Math.random() < chanceA) {
                match.goalsA += 1;
                tournament.live.history.unshift({ minute: tournament.live.minute, message: `${match.teamA.name} marcou!` });
            }
            if (Math.random() < chanceB) {
                match.goalsB += 1;
                tournament.live.history.unshift({ minute: tournament.live.minute, message: `${match.teamB.name} marcou!` });
            }
        });

        renderLiveKnockoutStage(mode);

        if (tournament.live.minute >= 90) {
            clearInterval(tournament.live.intervalId);
            tournament.live.inProgress = false;
            tournament.live.matches.forEach((match, idx) => {
                if (match.goalsA !== match.goalsB) {
                    match.winner = match.goalsA > match.goalsB ? match.teamA : match.teamB;
                }
            });
            renderLiveKnockoutStage(mode);
        }
    }, 1000);
}

function renderPenaltyInterface(match) {
    if (!match.penalties) return '';
    const penalties = match.penalties;
    const scoreA = penalties.attemptsA.filter(Boolean).length;
    const scoreB = penalties.attemptsB.filter(Boolean).length;
    const roundsA = [...penalties.attemptsA, ...Array(Math.max(0, 5 - penalties.attemptsA.length)).fill(null)].map(value => value === null ? '-' : value ? '1' : '0').join(' ');
    const roundsB = [...penalties.attemptsB, ...Array(Math.max(0, 5 - penalties.attemptsB.length)).fill(null)].map(value => value === null ? '-' : value ? '1' : '0').join(' ');
    const status = penalties.winner ? `<div><strong>Vencedor nos pênaltis: ${penalties.winner.name}</strong></div>` : `<div><strong>Turno:</strong> ${penalties.turn}</div>`;
    
    const buttonHtml = penalties.winner
        ? '<div class="alert-box">Pênaltis concluídos.</div>'
        : penalties.pendingKick
            ? `<button class="success" disabled style="margin-right: 10px;">Aguardando...</button><button data-skip-penalty="${match._idx}:${match._mode}" class="secondary skip-penalty">PULAR PÊNALTIS</button>`
            : `<button data-kick-penalty="${match._idx}:${match._mode}" class="success kick-penalty" style="margin-right: 10px;">BATER PÊNALTI</button>
               <button data-skip-penalty="${match._idx}:${match._mode}" class="secondary skip-penalty">PULAR PÊNALTIS</button>`;
            
    return `
        <div class="penalty-panel">
            <div class="penalty-row"><span>${match.teamA.name}</span><span class="penalty-circles">${roundsA}</span></div>
            <div class="penalty-row"><span>${match.teamB.name}</span><span class="penalty-circles">${roundsB}</span></div>
            <div class="penalty-row"><span>Placar</span><span class="penalty-circles">${scoreA} x ${scoreB}</span></div>
            ${status}
            <div style="margin-top: 10px;">${buttonHtml}</div>
        </div>
    `;
}

function renderChampionScreen(mode) {
    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>Campeão do ${state[mode].label}</h2>
                    <p class="description">A final foi concluida e o torneio ja tem um campeão.</p>
                </div>
                <button id="backButton" class="secondary">Voltar ao menu</button>
            </div>
            <div class="section-panel">
                <h3>${state[mode].champion?.name || 'Ainda sem campeão'}</h3>
                <p class="description">Parabens ao time que venceu a final.</p>
            </div>
        </section>
    `;
    document.getElementById('backButton').addEventListener('click', renderMainScreen);
}

// Inicialização com garantia de carregamento
function initApp() {
    // Salva as ligas no localStorage para uso futuro
    StorageManager.saveLeagues();
    
    // Renderiza a tela principal
    renderMainScreen();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}