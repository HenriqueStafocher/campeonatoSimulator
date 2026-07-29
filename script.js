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
    trintaedoisavos: 'trintaedoisavos',
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
    isScoresPanelOpen: false, 
    multiplayer: {
        numPlayers: 1,
        activePlayer: 1,
        playerAssignments: {}, 
        colors: {
            1: '#3a86ff', 
            2: '#ffd60a', 
            3: '#ff006e', 
            4: '#06d6a0', 
            5: '#9d4edd', 
            6: '#ff6b6b'
        },
        leaguePoints: JSON.parse(localStorage.getItem('multiplayerLeaguePoints')) || {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}
    },
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
        manualSelectedIds: new Set(),
        pool: [],
        selectedTeams: [],
        groups: [],
        groupRound: 0,
        groupHistory: [],
        knockout: null,
        live: null,
        champion: null,
        label: 'Personalizado',
        targetSize: 32,
        groupRounds: 6,
        step: 'teamCount'
    },
    championsleague: {
        selectedIds: new Set(),
        manualSelectedIds: new Set(),
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
        manualSelectedIds: new Set(),
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

function getEffectiveStrength(team) {
    const baseStrength = Number(team?.strength);
    if (Number.isFinite(baseStrength) && baseStrength > 0) {
        return Math.max(1, Math.round(baseStrength));
    }
    return 50;
}

function renderTeamLabel(team, options = {}) {
    const { mode = null, highlight = false } = options;
    const isTeamObject = team && typeof team === 'object';
    const teamId = isTeamObject ? team.id : null;
    const teamName = isTeamObject ? team.name : team || '';
    const isHighlighted = Boolean(highlight || (mode && state[mode]?.manualSelectedIds?.has(teamId)));
    const imageMarkup = isTeamObject && team.image
        ? `<img src="${team.image}" alt="${teamName}" class="team-avatar" />`
        : '';
        
    const playerId = teamId ? state.multiplayer.playerAssignments[teamId] : null;
    const playerColor = playerId ? state.multiplayer.colors[playerId] : null;
    const styleAttr = playerColor ? ` style="color: ${playerColor}; font-weight: 700;"` : '';

    return `
        <span class="team-label">
            ${imageMarkup}
            <span class="team-name${isHighlighted ? ' team-name--selected' : ''}"${styleAttr}>${teamName}</span>
        </span>
    `;
}

function getTournamentTeamsForStats(mode) {
    const tournament = state[mode];
    const tracked = new Map();

    const addTeam = team => {
        if (!team?.id) return;
        if (!tracked.has(team.id)) {
            tracked.set(team.id, team);
        }
    };

    if (tournament?.groups?.length) {
        tournament.groups.flatMap(group => group.teams || []).forEach(addTeam);
    }

    (tournament?.knockout?.matches || []).forEach(match => {
        addTeam(match.teamA);
        addTeam(match.teamB);
        addTeam(match.winner);
    });

    (tournament?.live?.matches || []).forEach(match => {
        addTeam(match.teamA);
        addTeam(match.teamB);
        addTeam(match.winner);
    });

    if (tracked.size) {
        return Array.from(tracked.values());
    }

    if (tournament?.selectedTeams?.length) {
        return tournament.selectedTeams;
    }
    return [];
}

function renderTournamentStats(mode, expanded = false) {
    const teams = getTournamentTeamsForStats(mode);
    if (!teams.length) return '';
    
    // Fallback initialize
    teams.forEach(t => {
        if (t.yellows === undefined) t.yellows = 0;
        if (t.reds === undefined) t.reds = 0;
        if (t.fouls === undefined) t.fouls = 0;
        if (t.shots === undefined) t.shots = 0;
        if (t.penaltiesScored === undefined) t.penaltiesScored = 0;
        if (t.penaltiesMissed === undefined) t.penaltiesMissed = 0;
    });

    const activeTab = state.activeStatsTab || 'goals';

    let sortedTeams = [];
    let thead = '';
    let rowMapper = null;

    if (activeTab === 'goals') {
        sortedTeams = [...teams].sort((a, b) => {
            const goalsDiff = (b.goalsFor || 0) - (a.goalsFor || 0);
            if (goalsDiff !== 0) return goalsDiff;
            return (a.goalsAgainst || 0) - (b.goalsAgainst || 0);
        });
        thead = `<tr><th>Time</th><th>Gols (GP)</th><th>Sofridos (GC)</th>${expanded ? '<th>Saldo</th><th>Pts</th>' : ''}</tr>`;
        rowMapper = team => `<tr>
            <td data-label="Time">${renderTeamLabel(team, { mode })}</td>
            <td data-label="GP">${team.goalsFor || 0}</td>
            <td data-label="GC">${team.goalsAgainst || 0}</td>
            ${expanded ? `<td data-label="SG">${team.goalsFor - team.goalsAgainst}</td>` : ''}
            ${expanded ? `<td data-label="PTS">${team.points || 0}</td>` : ''}
        </tr>`;
    } else if (activeTab === 'cards') {
        sortedTeams = [...teams].sort((a, b) => (b.reds - a.reds) || (b.yellows - a.yellows) || (b.fouls - a.fouls));
        thead = `<tr><th>Time</th><th>🟥 Vermelhos</th><th>🟨 Amarelos</th><th>Faltas</th></tr>`;
        rowMapper = team => `<tr>
            <td data-label="Time">${renderTeamLabel(team, { mode })}</td>
            <td data-label="Vermelhos">${team.reds}</td>
            <td data-label="Amarelos">${team.yellows}</td>
            <td data-label="Faltas">${team.fouls}</td>
        </tr>`;
    } else if (activeTab === 'penalties') {
        sortedTeams = [...teams].sort((a, b) => (b.penaltiesScored - a.penaltiesScored) || (a.penaltiesMissed - b.penaltiesMissed));
        thead = `<tr><th>Time</th><th>✅ Convertidos</th><th>❌ Perdidos</th></tr>`;
        rowMapper = team => `<tr>
            <td data-label="Time">${renderTeamLabel(team, { mode })}</td>
            <td data-label="Convertidos">${team.penaltiesScored}</td>
            <td data-label="Perdidos">${team.penaltiesMissed}</td>
        </tr>`;
    } else if (activeTab === 'shots') {
        sortedTeams = [...teams].sort((a, b) => (b.shots - a.shots) || (a.goalsAgainst - b.goalsAgainst));
        thead = `<tr><th>Time</th><th>🎯 Finalizações</th><th>🛡️ Defesas (Menos Gols Sofridos)</th></tr>`;
        rowMapper = team => `<tr>
            <td data-label="Time">${renderTeamLabel(team, { mode })}</td>
            <td data-label="Finalizações">${team.shots}</td>
            <td data-label="Gols Sofridos">${team.goalsAgainst || 0}</td>
        </tr>`;
    }

    const rows = sortedTeams.map(rowMapper).join('');

    const getBtnColor = (tab) => {
        if (tab === 'goals') return '#3a86ff'; // blue
        if (tab === 'cards') return '#ffb703'; // yellow-orange
        if (tab === 'penalties') return '#ff006e'; // vibrant pink/red
        return '#8338ec'; // purple
    };
    const btnStyle = (tab) => {
        const color = getBtnColor(tab);
        if (activeTab === tab) {
            return `background: ${color}; color: white; border-color: ${color}; box-shadow: 0 4px 15px ${color}80; text-shadow: 0 1px 3px rgba(0,0,0,0.5); font-weight: bold;`;
        }
        return `background: ${color}33; color: ${color}; border-color: ${color}80;`;
    };

    return `
        <section class="card section-panel stats-panel">
            <div class="title-group">
                <div>
                    <h3>Ranking e Estatísticas</h3>
                    <p class="description">Alterne entre as abas para ver os líderes de cada categoria.</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <button class="btn-stats btn-tab" data-tab="goals" style="${btnStyle('goals')}">Gols</button>
                <button class="btn-stats btn-tab" data-tab="cards" style="${btnStyle('cards')}">Cartões & Faltas</button>
                <button class="btn-stats btn-tab" data-tab="penalties" style="${btnStyle('penalties')}">Pênaltis</button>
                <button class="btn-stats btn-tab" data-tab="shots" style="${btnStyle('shots')}">Finalizações & Defesa</button>
            </div>

            <div class="table-wrapper">
                <table class="stats-table">
                    <thead>${thead}</thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </section>
    `;
}

function getPlayerStatsRowsHtml(mode) {
    if (state.multiplayer.numPlayers < 1) return '';
    const numPlayers = state.multiplayer.numPlayers;
    
    const isLeague = !['libertadores', 'custom', 'worldCup', 'championsleague'].includes(mode);
    const tournament = isLeague ? null : state[mode];
    
    const allTeams = isLeague ? state.leagueTeams : getTournamentTeamsForStats(mode);
    
    const rows = [];
    for (let p = 1; p <= numPlayers; p++) {
        const playerColor = state.multiplayer.colors[p];
        const assignedIds = Object.entries(state.multiplayer.playerAssignments)
            .filter(([id, pid]) => pid === p)
            .map(([id, pid]) => id);
            
        if (assignedIds.length === 0) continue;
        
        let aliveCount = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;
        
        assignedIds.forEach(id => {
            const team = allTeams.find(t => t.id === id);
            if (team) {
                goalsFor += team.goalsFor || 0;
                goalsAgainst += team.goalsAgainst || 0;
            }
        });
        
        if (isLeague) {
            aliveCount = assignedIds.length;
        } else {
            if (tournament.knockout && tournament.knockout.matches) {
                if (tournament.knockout.stage === stages.champion) {
                    aliveCount = assignedIds.includes(tournament.champion?.id) ? 1 : 0;
                } else {
                    tournament.knockout.matches.forEach(m => {
                        if (assignedIds.includes(m.teamA.id)) aliveCount++;
                        if (assignedIds.includes(m.teamB.id)) aliveCount++;
                    });
                }
            } else {
                let stillAlive = 0;
                assignedIds.forEach(id => {
                    const team = tournament.selectedTeams?.find(t => t.id === id);
                    if (team) stillAlive++;
                });
                aliveCount = stillAlive;
            }
        }
        
        rows.push({ p, playerColor, aliveCount, goalsFor, goalsAgainst });
    }
    
    if (rows.length === 0) return '';
    
    rows.sort((a, b) => b.aliveCount - a.aliveCount || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    
    return rows.map(r => `
        <tr>
            <td data-label="Player"><span class="player-badge" style="background: ${r.playerColor}">P${r.p}</span></td>
            <td data-label="Times Vivos">${r.aliveCount}</td>
            <td data-label="Gols Feitos">${r.goalsFor}</td>
            <td data-label="Gols Sofridos">${r.goalsAgainst}</td>
        </tr>
    `).join('');
}

function renderPlayerStatsTable(mode) {
    const htmlRows = getPlayerStatsRowsHtml(mode);
    if (!htmlRows) return '';
    
    return `
        <section class="card section-panel stats-panel">
            <div class="title-group" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="display: inline-block;">Acompanhamento de Jogadores</h3>
                    <button class="btn-toggle-panel toggle-player-stats">OCULTAR</button>
                    <p class="description">Desempenho total dos times escolhidos por cada player.</p>
                </div>
            </div>
            <div class="table-wrapper player-stats-wrapper">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Times Vivos</th>
                            <th>Gols Feitos</th>
                            <th>Gols Sofridos</th>
                        </tr>
                    </thead>
                    <tbody id="player-stats-tbody">${htmlRows}</tbody>
                </table>
            </div>
        </section>
    `;
}

function renderMainScreen() {
    state.isScoresPanelOpen = false;

    const buttons = leagueButtons.map(button => {
        return `<button data-key="${button.key}" class="league-btn">${button.label}</button>`;
    }).join('');

    app.innerHTML = `
        <div class="top-external-links">
            <button class="btn-discord" onclick="window.open('https://discord.gg/guw9HhE', '_blank')">Discord</button>
            <button class="league-btn btn-feedback" onclick="window.open('https://forms.gle/uUqpSgCfStb6ZSrv6', '_blank')">Feedback</button>
        </div>
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
    state.leagueKey = key;
    renderPlayerCountSelection(key);
}

function renderPlayerCountSelection(key) {
    const isCustom = key === 'custom';
    
    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>Configuração: Quantos jogadores irão participar?</h2>
                    <p class="description">Escolha quantos players vão escolher times neste modo.</p>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                </div>
            </div>
            <div class="wizard-options">
                <button class="wizard-btn" data-players="1">1 Player</button>
                <button class="wizard-btn" data-players="2">2 Players</button>
                <button class="wizard-btn" data-players="3">3 Players</button>
                <button class="wizard-btn" data-players="4">4 Players</button>
                <button class="wizard-btn" data-players="5">5 Players</button>
                <button class="wizard-btn" data-players="6">6 Players</button>
            </div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    
    app.querySelectorAll('.wizard-btn[data-players]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.multiplayer.numPlayers = Number(btn.getAttribute('data-players'));
            state.multiplayer.activePlayer = 1;
            state.multiplayer.playerAssignments = {};
            
            if (isCustom) {
                renderCustomTeamCountSelection();
            } else {
                setupLeagueOrTournament(key);
            }
        });
    });
}

function renderCustomTeamCountSelection() {
    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>Configuração: Quantos times seu campeonato terá?</h2>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar</button>
                </div>
            </div>
            <div class="wizard-options">
                <button class="wizard-btn" data-teams="16">16 times (Mata-mata direto)</button>
                <button class="wizard-btn" data-teams="32">32 times (8 grupos)</button>
                <button class="wizard-btn" data-teams="48">48 times (12 grupos)</button>
                <button class="wizard-btn" data-teams="64">64 times (16 grupos)</button>
                <button class="wizard-btn" data-teams="128">128 times (32 grupos)</button>
            </div>
        </section>
    `;
    
    document.getElementById('backButton').addEventListener('click', () => renderPlayerCountSelection('custom'));
    
    app.querySelectorAll('.wizard-btn[data-teams]').forEach(btn => {
        btn.addEventListener('click', () => {
            const teams = Number(btn.getAttribute('data-teams'));
            state.custom.targetSize = teams;
            
            if (teams === 16) {
                state.custom.groupRounds = 0;
                setupLeagueOrTournament('custom');
            } else {
                renderCustomGroupRoundsSelection();
            }
        });
    });
}

function renderCustomGroupRoundsSelection() {
    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>Configuração: Quantas rodadas terá a fase de grupos?</h2>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar</button>
                </div>
            </div>
            <div class="wizard-options">
                <button class="wizard-btn" data-rounds="3">3 rodadas</button>
                <button class="wizard-btn" data-rounds="6">6 rodadas (Ida e volta)</button>
            </div>
        </section>
    `;
    
    document.getElementById('backButton').addEventListener('click', renderCustomTeamCountSelection);
    
    app.querySelectorAll('.wizard-btn[data-rounds]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.custom.groupRounds = Number(btn.getAttribute('data-rounds'));
            setupLeagueOrTournament('custom');
        });
    });
}

function setupLeagueOrTournament(key) {
    if (['libertadores', 'custom', 'worldCup', 'championsleague'].includes(key)) {
        setupTournamentSelection(key);
    } else {
        setupLeagueAssignment(key);
    }
}

function setupLeagueAssignment(key) {
    const league = leagueData[key];
    state.leagueTeams = createChampionshipTeams(league.teams);
    state.leagueTeams.forEach((t, i) => t.id = `league-${key}-${i}`);
    renderLeagueAssignment(key);
}

function renderLeagueAssignment(key) {
    const league = leagueData[key];
    
    let playerButtons = '';
    for(let i=1; i<=state.multiplayer.numPlayers; i++) {
        const isActive = i === state.multiplayer.activePlayer ? ' active' : '';
        const color = state.multiplayer.colors[i];
        playerButtons += `<button class="player-btn${isActive}" data-select-player="${i}">
            <div class="player-color-dot" style="background: ${color}"></div> Player ${i}
        </button>`;
    }
    
    const items = state.leagueTeams.map(team => {
        const playerId = state.multiplayer.playerAssignments[team.id];
        const isHighlighted = !!playerId;
        const playerColor = playerId ? state.multiplayer.colors[playerId] : null;
        const styleAttr = playerColor ? ` style="border-color: ${playerColor}; box-shadow: 0 0 0 2px ${playerColor} inset;"` : '';
        
        return `
            <div class="team-card${isHighlighted ? ' team-card--selected' : ''}" data-id="${team.id}"${styleAttr}>
                ${renderTeamLabel(team)}
            </div>
        `;
    }).join('');

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${league.label} - Atribuir Times</h2>
                    <p class="description">Clique nos times para atribuí-los ao Player selecionado. Quando terminar, clique em Iniciar Liga.</p>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="startLeagueBtn" class="success">Iniciar Liga</button>
                </div>
            </div>
            ${state.multiplayer.numPlayers > 1 ? `<div class="player-selector-bar">${playerButtons}</div>` : ''}
        </section>
        <div class="section-panel team-selection">${items}</div>
        ${renderMultiplayerSidebar(key)}
    `;
    
    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('startLeagueBtn').addEventListener('click', () => {
        renderLeagueSimulator(key);
    });
    
    app.querySelectorAll('.player-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.multiplayer.activePlayer = Number(btn.getAttribute('data-select-player'));
            renderLeagueAssignment(key);
        });
    });
    
    app.querySelectorAll('.multiplayer-sidebar .sidebar-player-row').forEach(row => {
        row.addEventListener('click', () => {
            state.multiplayer.activePlayer = Number(row.getAttribute('data-select-player'));
            if (document.querySelector('.league-group-card')) {
                if (typeof mode !== 'undefined') renderTournamentSelection(mode);
                else if (typeof key !== 'undefined') renderTournamentSelection(key);
            } else {
                if (typeof key !== 'undefined') renderLeagueAssignment(key);
                else if (typeof mode !== 'undefined') renderLeagueAssignment(mode);
            }
        });
    });

    app.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-id');
            const currentOwner = state.multiplayer.playerAssignments[id];
            
            if (currentOwner === state.multiplayer.activePlayer) {
                delete state.multiplayer.playerAssignments[id];
            } else {
                state.multiplayer.playerAssignments[id] = state.multiplayer.activePlayer;
            }
            renderLeagueAssignment(key);
        });
    });
}

function setupTournamentSelection(mode) {
    const tournament = state[mode];
    tournament.selectedIds.clear();
    tournament.manualSelectedIds = new Set();
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
    
    if (mode === 'custom' && state.custom.targetSize) {
        tournament.targetSize = state.custom.targetSize;
    } else {
        tournament.targetSize = mode === 'worldCup' ? 48 : 32;
    }
    
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
    if (mode === 'custom' && state.custom.groupRounds) {
        return state.custom.groupRounds;
    }
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
            const highlighted = tournament.manualSelectedIds.has(team.id);
            return `
                <label class="team-card${highlighted ? ' team-card--selected' : ''}" data-name="${team.name.toLowerCase()}">
                    ${renderTeamLabel(team)}
                    <input type="checkbox" data-id="${team.id}" ${selected ? 'checked' : ''} />
                    <span class="custom-checkbox" aria-hidden="true"></span>
                </label>
            `;
        }).join('');
        return `
            <div class="card league-group-card" data-league="${leagueKey}">
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
        : `Selecione ${targetSize} times para montar o campeonato. Use o botão RANDOM para completar automaticamente.`;

    let playerButtons = '';
    for(let i=1; i<=state.multiplayer.numPlayers; i++) {
        const isActive = i === state.multiplayer.activePlayer ? ' active' : '';
        const color = state.multiplayer.colors[i];
        playerButtons += `<button class="player-btn${isActive}" data-select-player="${i}">
            <div class="player-color-dot" style="background: ${color}"></div> Player ${i}
        </button>`;
    }

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${tournament.label}</h2>
                    <p class="description">${description}</p>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            ${state.multiplayer.numPlayers > 1 ? `<div class="player-selector-bar">${playerButtons}</div>` : ''}
            <div class="status-line">
                <span>Times selecionados: <strong>${selectedCount}</strong> / ${targetSize}</span>
                <button id="randomFill" class="success">Randomizar times restantes</button>
                <button id="startGroups" class="success" ${startDisabled ? 'disabled' : ''}>Iniciar Campeonato</button>
            </div>
        </section>
        <div class="search-container">
            <input type="text" id="teamSearchInput" class="team-search-input" placeholder="🔍 Digite para buscar um time..." value="${tournament.searchQuery || ''}" />
        </div>
        <div class="section-panel">${sections}</div>
        ${renderMultiplayerSidebar(mode)}
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => {
        if (mode === 'libertadores') setupLibertadoresSelection();
        else setupTournamentSelection(mode);
    });
    
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

    const searchInput = document.getElementById('teamSearchInput');
    if (searchInput) {
        const filterTeams = () => {
            const query = searchInput.value.toLowerCase().trim();
            tournament.searchQuery = searchInput.value;

            const leagueCards = app.querySelectorAll('.league-group-card');
            let totalVisible = 0;

            leagueCards.forEach(card => {
                const teamLabels = card.querySelectorAll('.team-card');
                let visibleInGroup = 0;

                teamLabels.forEach(label => {
                    const teamName = label.getAttribute('data-name') || '';
                    if (!query || teamName.includes(query)) {
                        label.style.display = 'flex';
                        visibleInGroup++;
                        totalVisible++;
                    } else {
                        label.style.display = 'none';
                    }
                });

                card.style.display = (visibleInGroup === 0 && query !== '') ? 'none' : 'block';
            });

            let noResultsEl = app.querySelector('.no-search-results');
            if (totalVisible === 0 && query !== '') {
                if (!noResultsEl) {
                    noResultsEl = document.createElement('div');
                    noResultsEl.className = 'alert-box no-search-results';
                    app.querySelector('.section-panel').appendChild(noResultsEl);
                }
                noResultsEl.textContent = `Nenhum time encontrado com "${searchInput.value}".`;
            } else if (noResultsEl) {
                noResultsEl.remove();
            }
        };

        searchInput.addEventListener('input', filterTeams);
        if (tournament.searchQuery) {
            filterTeams();
        }
    }

    if (state.multiplayer.numPlayers > 1) {
        app.querySelectorAll('.player-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.multiplayer.activePlayer = Number(btn.getAttribute('data-select-player'));
                renderTournamentSelection(mode);
            });
        });
    }

    app.querySelectorAll('input[type=checkbox][data-id]').forEach(input => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            if (input.checked) {
                if (tournament.selectedIds.size >= targetSize) {
                    input.checked = false;
                    return;
                }
                tournament.selectedIds.add(id);
                tournament.manualSelectedIds.add(id);
                state.multiplayer.playerAssignments[id] = state.multiplayer.activePlayer;
            } else {
                tournament.selectedIds.delete(id);
                tournament.manualSelectedIds.delete(id);
                delete state.multiplayer.playerAssignments[id];
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
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            <div class="status-line">
                <span>Rodada atual: <strong>0 / ${state.schedule.length}</strong></span>
            </div>
            
            <div class="section-panel" style="position: relative; z-index: 10;">
                <button id="simulateRound" class="success">Simular rodada</button>
                <button id="simulateAll" class="success">Simular campeonato</button>
            </div>
            
            <div id="leagueSummary" class="section-panel"></div>

            <div style="text-align: center; margin: 15px 0;">
                <button id="toggleScoresBtn" class="secondary" style="display: none;">Placares</button>
            </div>
            <div id="latestScoresWrapper" style="max-height: 0; overflow: hidden; transition: max-height 0.4s ease-in-out;">
                <div id="latestScoresContent"></div>
            </div>

            <div id="leagueTable" class="table-wrapper section-panel"></div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => renderSimpleSpecial(title, description));
    document.getElementById('simulateRound').addEventListener('click', simulateLeagueRound);
    document.getElementById('simulateAll').addEventListener('click', simulateLeagueAll);
    document.getElementById('toggleScoresBtn').addEventListener('click', toggleScoresPanel);

    app.querySelectorAll('.btn-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeStatsTab = btn.getAttribute('data-tab');
            const container = document.getElementById('leagueStatsTabsContainer');
            if (container) container.innerHTML = renderTournamentStats(key, true);
            
            // Re-bind listeners for tabs in this scope
            document.querySelectorAll('.btn-tab').forEach(b => {
                b.addEventListener('click', () => {
                    state.activeStatsTab = b.getAttribute('data-tab');
                    if (container) container.innerHTML = renderTournamentStats(key, true);
                    // A proper component framework would be nice here, but for now we reload the full screen or re-bind
                    renderLeagueSimulator(key);
                });
            });
        });
    });
    
    renderLeagueStatus();
    updateScoresPanel();
    renderLeagueStandings();
}

function createChampionshipTeams(teams) {
    return teams.map(team => ({
        id: `${team.name}-${team.nation || team.country}`,
        name: team.name,
        image: team.image,
        strength: getEffectiveStrength(team),
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
    updateScoresPanel();
    renderLeagueStandings();
}

function simulateLeagueAll() {
    for (; state.currentRound < state.schedule.length; state.currentRound += 1) {
        state.schedule[state.currentRound].forEach(match => simulateMatch(match));
    }
    renderLeagueStatus();
    updateScoresPanel();
    renderLeagueStandings();
}

function simulateMatch(match) {
    if (match.goalsA !== null) {
        return;
    }
    const [goalsA, goalsB, statsA, statsB] = getLeagueGoals(match.teamA, match.teamB); 
    match.goalsA = goalsA;
    match.goalsB = goalsB;
    updateTeamStats(match.teamA, goalsA, goalsB, statsA);
    updateTeamStats(match.teamB, goalsB, goalsA, statsB);
}

function updateTeamStats(team, forGoals, againstGoals, stats = null) {
    if (team.yellows === undefined) team.yellows = 0;
    if (team.reds === undefined) team.reds = 0;
    if (team.fouls === undefined) team.fouls = 0;
    if (team.shots === undefined) team.shots = 0;
    if (team.penaltiesScored === undefined) team.penaltiesScored = 0;
    if (team.penaltiesMissed === undefined) team.penaltiesMissed = 0;

    team.played += 1;
    team.goalsFor += forGoals;
    team.goalsAgainst += againstGoals;

    if (stats) {
        team.yellows += (stats.yellows || 0);
        team.reds += (stats.reds || 0);
        team.fouls += (stats.fouls || 0);
        team.shots += (stats.shots || 0);
    }

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

function getLeagueGoals(teamA, teamB) {
    const strengthA = Math.max(1, getEffectiveStrength(teamA));
    const strengthB = Math.max(1, getEffectiveStrength(teamB));
    
    const diff = (strengthA - strengthB) / 80;
    
    let probA = 0.35 + diff; 
    let probTie = 0.30 - (Math.abs(diff) * 0.05); 
    
    probTie = Math.max(0.20, Math.min(0.40, probTie)); 
    probA = Math.max(0.35, Math.min(1 - probTie - 0.25, probA)); 
    
    const roll = Math.random();
    
    let goalsA = 0;
    let goalsB = 0;

    if (roll < probA) {
        goalsA = Math.floor(Math.random() * 3) + 1; 
        goalsB = Math.floor(Math.random() * goalsA);
    } else if (roll < probA + probTie) {
        goalsA = Math.floor(Math.random() * 3); 
        goalsB = goalsA;
    } else {
        goalsB = Math.floor(Math.random() * 3) + 1; 
        goalsA = Math.floor(Math.random() * goalsB);
    }
    
    return [goalsA, goalsB];
}

function getTournamentGoals(teamA, teamB) {
    const strengthA = Math.max(1, getEffectiveStrength(teamA));
    const strengthB = Math.max(1, getEffectiveStrength(teamB));
    
    const diff = (strengthA - strengthB) / 40;
    
    let probA = 0.40 + diff; 
    let probTie = 0.25 - (Math.abs(diff) * 0.1); 
    
    probTie = Math.max(0.15, Math.min(0.35, probTie)); 
    probA = Math.max(0.15, Math.min(1 - probTie - 0.15, probA)); 
    
    const roll = Math.random();
    
    let goalsA = 0;
    let goalsB = 0;

    if (roll < probA) {
        goalsA = Math.floor(Math.random() * 3) + 1;
        goalsB = Math.floor(Math.random() * goalsA);
    } else if (roll < probA + probTie) {
        goalsA = Math.floor(Math.random() * 3); 
        goalsB = goalsA;
    } else {
        goalsB = Math.floor(Math.random() * 3) + 1; 
        goalsA = Math.floor(Math.random() * goalsB); 
    }
    
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

function updateScoresPanel() {
    const toggleBtn = document.getElementById('toggleScoresBtn');
    const wrapper = document.getElementById('latestScoresWrapper');
    const content = document.getElementById('latestScoresContent');

    if (!toggleBtn || !wrapper || !content) return;

    if (state.currentRound === 0) {
        toggleBtn.style.display = 'none';
        content.innerHTML = '';
        wrapper.style.maxHeight = '0px';
        return;
    }

    toggleBtn.style.display = 'inline-block';

    const lastRoundIndex = state.currentRound - 1;
    const matches = state.schedule[lastRoundIndex];

    const matchRows = matches.map(match => {
        const score = match.goalsA !== null ? `${match.goalsA} x ${match.goalsB}` : '-';
        return `<div class="match-item"><span>${renderTeamLabel(match.teamA)}</span><span class="score-badge">${score}</span><span>${renderTeamLabel(match.teamB)}</span></div>`;
    }).join('');

    content.innerHTML = `
        <div class="card section-panel" style="margin-bottom: 20px; padding: 15px;">
            <h4 style="text-align: center; color: var(--muted, #888); margin: 0 0 15px 0;">Referente à Rodada ${state.currentRound}</h4>
            <div style="display: grid; gap: 10px;">${matchRows}</div>
        </div>
    `;

    if (state.isScoresPanelOpen) {
        setTimeout(() => {
            wrapper.style.maxHeight = content.scrollHeight + 'px';
        }, 10);
    } else {
        wrapper.style.maxHeight = '0px';
    }
}

function toggleScoresPanel() {
    const wrapper = document.getElementById('latestScoresWrapper');
    const content = document.getElementById('latestScoresContent');
    if (!wrapper || !content) return;

    state.isScoresPanelOpen = !state.isScoresPanelOpen;

    if (state.isScoresPanelOpen) {
        wrapper.style.maxHeight = content.scrollHeight + 'px';
    } else {
        wrapper.style.maxHeight = '0px';
    }
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
            <td data-label="#">${index + 1}</td>
            <td data-label="Time">${renderTeamLabel(team)}</td>
            <td data-label="PTS">${team.points}</td>
            <td data-label="J">${team.played}</td>
            <td data-label="V">${team.wins}</td>
            <td data-label="E">${team.draws}</td>
            <td data-label="D">${team.losses}</td>
            <td data-label="GP">${team.goalsFor}</td>
            <td data-label="GC">${team.goalsAgainst}</td>
            <td data-label="SG">${team.goalsFor - team.goalsAgainst}</td>
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

    if (!state.leagueTeams || state.leagueKey !== key) {
        state.leagueTeams = createChampionshipTeams(league.teams);
        state.leagueTeams.forEach((t, i) => t.id = `league-${key}-${i}`);
    } else {
        state.leagueTeams.forEach(t => {
            t.played = 0; t.wins = 0; t.draws = 0; t.losses = 0;
            t.goalsFor = 0; t.goalsAgainst = 0; t.points = 0;
        });
    }

    state.schedule = buildSchedule(state.leagueTeams);
    state.currentRound = 0;
    state.isScoresPanelOpen = false;

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${league.label}</h2>
                    <p class="description">Simule um campeonato com os times desta liga. Use as opcoes abaixo para avancar rodada a rodada ou finalizar a competicao.</p>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            
            <div class="section-panel" style="position: relative; z-index: 10;">
                <button id="simulateRound" class="success">Simular rodada</button>
                <button id="simulateAll" class="success">Simular campeonato</button>
            </div>
            
            ${renderPlayerStatsTable(key)}
            
            <div id="leagueSummary"></div>
        <div id="leagueStatsTabsContainer">
            ${renderTournamentStats(key, true)}
        </div>
            
            <div style="text-align: center; margin: 15px 0;">
                <button id="toggleScoresBtn" class="secondary" style="display: none;">Placares</button>
            </div>
            <div id="latestScoresWrapper" style="max-height: 0; overflow: hidden; transition: max-height 0.4s ease-in-out;">
                <div id="latestScoresContent"></div>
            </div>

            <div id="leagueTable"></div>
        </section>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => setupLeagueAssignment(key));
    document.getElementById('simulateRound').addEventListener('click', simulateLeagueRound);
    document.getElementById('simulateAll').addEventListener('click', simulateLeagueAll);
    document.getElementById('toggleScoresBtn').addEventListener('click', toggleScoresPanel);

    app.querySelectorAll('.btn-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeStatsTab = btn.getAttribute('data-tab');
            const container = document.getElementById('leagueStatsTabsContainer');
            if (container) container.innerHTML = renderTournamentStats(key, true);
            
            // Re-bind listeners for tabs in this scope
            document.querySelectorAll('.btn-tab').forEach(b => {
                b.addEventListener('click', () => {
                    state.activeStatsTab = b.getAttribute('data-tab');
                    if (container) container.innerHTML = renderTournamentStats(key, true);
                    // A proper component framework would be nice here, but for now we reload the full screen or re-bind
                    renderLeagueSimulator(key);
                });
            });
        });
    });
    
    renderLeagueStatus();
    updateScoresPanel();
    renderLeagueStandings();
}

function setupLibertadoresSelection() {
    state.libertadores.selectedIds.clear();
    state.libertadores.manualSelectedIds = new Set();
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
            const highlighted = state.libertadores.manualSelectedIds.has(team.id);
            return `
                <label class="team-card${highlighted ? ' team-card--selected' : ''}" data-name="${team.name.toLowerCase()}">
                    ${renderTeamLabel(team)}
                    <input type="checkbox" data-id="${team.id}" ${selected ? 'checked' : ''} />
                    <span class="custom-checkbox" aria-hidden="true"></span>
                </label>
            `;
        }).join('');
        return `
            <div class="card league-group-card">
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
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            <div class="status-line">
                <span>Times selecionados: <strong>${selectedCount}</strong> / 32</span>
                <button id="randomFill" class="success">Randomizar times restantes</button>
                <button id="startGroups" class="success" ${selectedCount < 1 ? 'disabled' : ''}>Fase de Grupos</button>
            </div>
        </section>
        <div class="search-container">
            <input type="text" id="teamSearchInput" class="team-search-input" placeholder="🔍 Digite para buscar um time..." value="${state.libertadores.searchQuery || ''}" />
        </div>
        <div class="section-panel">
            ${sections}
        </div>
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => setupLibertadoresSelection());
    document.getElementById('randomFill').addEventListener('click', () => {
        fillLibertadoresWithRandomTeams();
        renderLibertadoresSelection();
    });

    const searchInput = document.getElementById('teamSearchInput');
    if (searchInput) {
        const filterTeams = () => {
            const query = searchInput.value.toLowerCase().trim();
            state.libertadores.searchQuery = searchInput.value;

            const leagueCards = app.querySelectorAll('.league-group-card');
            let totalVisible = 0;

            leagueCards.forEach(card => {
                const teamLabels = card.querySelectorAll('.team-card');
                let visibleInGroup = 0;

                teamLabels.forEach(label => {
                    const teamName = label.getAttribute('data-name') || '';
                    if (!query || teamName.includes(query)) {
                        label.style.display = 'flex';
                        visibleInGroup++;
                        totalVisible++;
                    } else {
                        label.style.display = 'none';
                    }
                });

                card.style.display = (visibleInGroup === 0 && query !== '') ? 'none' : 'block';
            });

            let noResultsEl = app.querySelector('.no-search-results');
            if (totalVisible === 0 && query !== '') {
                if (!noResultsEl) {
                    noResultsEl = document.createElement('div');
                    noResultsEl.className = 'alert-box no-search-results';
                    app.querySelector('.section-panel').appendChild(noResultsEl);
                }
                noResultsEl.textContent = `Nenhum time encontrado com "${searchInput.value}".`;
            } else if (noResultsEl) {
                noResultsEl.remove();
            }
        };

        searchInput.addEventListener('input', filterTeams);
        if (state.libertadores.searchQuery) {
            filterTeams();
        }
    }
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
                state.libertadores.manualSelectedIds.add(id);
            } else {
                state.libertadores.selectedIds.delete(id);
                state.libertadores.manualSelectedIds.delete(id);
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

    if (mode === 'custom' && tournament.groupRounds === 0) {
        let stage;
        if (targetSize === 128) stage = stages.trintaedoisavos;
        else if (targetSize === 64) stage = stages.trintaedoisavos;
        else if (targetSize === 32) stage = stages.dezesseisavos;
        else if (targetSize === 16) stage = stages.oitavas;
        else stage = stages.oitavas;
        
        const shuffled = shuffle(selected);
        tournament.knockout = createKnockoutStage(stage, shuffled);
        renderTournamentKnockout(mode);
        return;
    }

    const shuffled = shuffle(selected);
    const groupCount = targetSize / 4;
    const teamsPerGroup = 4;
    const groups = [];
    for (let index = 0; index < groupCount; index += 1) {
        groups.push({
            name: groupCount > 26 ? String(index + 1) : String.fromCharCode(65 + index),
            teams: shuffled.slice(index * teamsPerGroup, index * teamsPerGroup + teamsPerGroup).map(team => ({
                ...team,
                strength: getEffectiveStrength(team),
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
                <td>${renderTeamLabel(team, { mode })}</td>
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
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>#</th><th>Time</th><th>PTS</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }).join('');

    const historyRows = tournament.groupHistory.length
        ? tournament.groupHistory.map(match => `
            <tr>
                <td data-label="Grupo">${match.group}</td>
                <td data-label="Rodada">${match.round}</td>
                <td data-label="Partida">${renderTeamLabel(match.teamA, { mode })} <strong>x</strong> ${renderTeamLabel(match.teamB, { mode })}</td>
                <td data-label="Placar">${match.goalsA} x ${match.goalsB}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="4"><div class="alert-box">Nenhuma rodada simulada ainda.</div></td></tr>';

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
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            <div class="status-line">
                <span>Rodada atual: <strong>${displayRound}</strong> / ${maxRounds}</span>
                <button id="advanceRound" class="success" ${canAdvance ? '' : 'disabled'}>Avancar rodada</button>
                ${showOitavas ? '<button id="goOitavas" class="success">Ir para o Mata-mata</button>' : ''}
            </div>
        </section>
        ${renderPlayerStatsTable(mode)}
        <section class="group-grid">${groupsHtml}</section>
        <section class="card section-panel">
            <div class="title-group" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="display: inline-block;">Histórico de jogos</h3>
                <button class="btn-toggle-panel toggle-history-stats">OCULTAR</button>
            </div>
            <div class="table-wrapper history-wrapper">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Rodada</th>
                            <th>Partida</th>
                            <th>Placar</th>
                        </tr>
                    </thead>
                    <tbody>${historyRows}</tbody>
                </table>
            </div>
        </section>
        ${renderTournamentStats(mode, false)}
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => {
        if (mode === 'libertadores') setupLibertadoresSelection();
        else setupTournamentSelection(mode);
    });
    document.getElementById('advanceRound').addEventListener('click', () => {
        advanceTournamentGroupRound(mode);
        renderTournamentGroupStage(mode);
    });
    if (showOitavas) {
        document.getElementById('goOitavas').addEventListener('click', () => startTournamentKnockout(mode));
    }
}

function getQualifiedTeamsForKnockout(mode) {
    const tournament = state[mode];
    const groupCount = tournament.groups.length;

    if (groupCount === 12) { // 48 teams
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
    return sorted.map((team, index) => {
        team.position = index + 1;
        return team;
    });
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
            const [goalsA, goalsB, statsA, statsB] = getTournamentGoals(match.teamA, match.teamB); 
            match.goalsA = goalsA;
            match.goalsB = goalsB;
            updateTeamStats(match.teamA, goalsA, goalsB);
            updateTeamStats(match.teamB, goalsB, goalsA);
            tournament.groupHistory.unshift({
                group: group.name,
                round: `R${currentRound + 1}`,
                teamA: match.teamA,
                teamB: match.teamB,
                goalsA,
                goalsB
            });
        });
    });
    tournament.groupRound += 1;
}

function startTournamentKnockout(mode) {
    const tournament = state[mode];
    const qualified = getQualifiedTeamsForKnockout(mode);
    let stage;
    if (qualified.length === 64) stage = stages.trintaedoisavos;
    else if (qualified.length === 32) stage = stages.dezesseisavos;
    else if (qualified.length === 16) stage = stages.oitavas;
    else if (qualified.length === 8) stage = stages.quartas;
    else stage = stages.oitavas;
    
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
    
    return renderLiveKnockoutStage(mode);
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
                penaltyButton = `<button data-open-penalty="${idx}" class="btn-stats toggle-match-stats">PÊNALTIS</button>`;
            } else {
                match._idx = idx;
                match._mode = mode;
                penaltyButton = renderPenaltyInterface(match);
            }
        }
        return `<div class="match-item"><span>${renderTeamLabel(match.teamA, { mode })}</span><span>${score}</span><span>${renderTeamLabel(match.teamB, { mode })}</span>${result}${penaltyButton}</div>`;
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
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            <div class="status-line">
                ${simulateButtonHtml}
                ${canAdvance ? `<button id="advanceKnockout" class="success">${advanceLabel}</button>` : ''}
            </div>
        </section>
        <section class="knockout-list section-panel">${matchRows}</section>
        ${renderTournamentStats(mode, false)}
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => {
        if (mode === 'libertadores') setupLibertadoresSelection();
        else setupTournamentSelection(mode);
    });
    
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
        const [goalsA, goalsB] = getTournamentGoals(match.teamA, match.teamB); 
        match.goalsA = goalsA;
        match.goalsB = goalsB;
        updateTeamStats(match.teamA, goalsA, goalsB);
        updateTeamStats(match.teamB, goalsB, goalsA);
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
    if (knockout.stage === stages.trintaedoisavos) {
        state[mode].knockout = createKnockoutStage(stages.dezesseisavos, winners);
    } else if (knockout.stage === stages.dezesseisavos) {
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
    
    if (shooterTeam.penaltiesScored === undefined) shooterTeam.penaltiesScored = 0;
    if (shooterTeam.penaltiesMissed === undefined) shooterTeam.penaltiesMissed = 0;
    if (success) shooterTeam.penaltiesScored++; else shooterTeam.penaltiesMissed++;

    const scoreA = penalties.attemptsA.filter(Boolean).length;
    const scoreB = penalties.attemptsB.filter(Boolean).length;
    const kicksA = penalties.attemptsA.length;
    const kicksB = penalties.attemptsB.length;

    // Fase normal (primeiros 5 pênaltis para cada)
    if (kicksA <= 5 && kicksB <= 5) {
        const remainingA = 5 - kicksA;
        const remainingB = 5 - kicksB;

        if (scoreA > scoreB + remainingB) {
            penalties.winner = match.teamA;
        } else if (scoreB > scoreA + remainingA) {
            penalties.winner = match.teamB;
        } else if (kicksA === 5 && kicksB === 5) {
            if (scoreA > scoreB) penalties.winner = match.teamA;
            else if (scoreB > scoreA) penalties.winner = match.teamB;
        }
    } else {
        // Morte súbita (cobranças alternadas a partir da 6ª):
        // Só avalia vencedor quando AMBOS os times já cobraram no mesmo número de rodadas (kicksA === kicksB)
        if (kicksA === kicksB) {
            if (scoreA > scoreB) penalties.winner = match.teamA;
            else if (scoreB > scoreA) penalties.winner = match.teamB;
        }
    }

    if (penalties.winner) {
        penalties.finished = true;
        match.winner = penalties.winner;
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

function getMatchStatsSeed(match) {
    if (match._statsSeed) return match._statsSeed;

    const strengthA = match.teamA.strength || 50;
    const strengthB = match.teamB.strength || 50;
    const diff = strengthA - strengthB;

    let possessionA = Math.round(50 + diff * 0.3 + (Math.random() * 10 - 5));
    possessionA = Math.max(33, Math.min(67, possessionA));
    const possessionB = 100 - possessionA;

    const basePassesA = Math.round(possessionA * 7.2 + (Math.random() * 60 - 30));
    const basePassesB = Math.round(possessionB * 7.2 + (Math.random() * 60 - 30));

    const precisionA = Math.max(72, Math.min(94, Math.round(74 + possessionA * 0.2 + (Math.random() * 6 - 3))));
    const precisionB = Math.max(72, Math.min(94, Math.round(74 + possessionB * 0.2 + (Math.random() * 6 - 3))));

    const totalShotsA = Math.max(4, Math.round(8 + (strengthA / 12) + (Math.random() * 8 - 4)));
    const totalShotsB = Math.max(4, Math.round(8 + (strengthB / 12) + (Math.random() * 8 - 4)));

    const targetShotsA = Math.max(0, Math.min(totalShotsA, Math.round(totalShotsA * (0.35 + Math.random() * 0.3))));
    const targetShotsB = Math.max(0, Math.min(totalShotsB, Math.round(totalShotsB * (0.35 + Math.random() * 0.3))));

    const foulsA = Math.max(4, Math.min(22, Math.round(11 + (Math.random() * 10 - 5))));
    const foulsB = Math.max(4, Math.min(22, Math.round(11 + (Math.random() * 10 - 5))));

    const yellowsA = Math.max(0, Math.min(8, Math.round((foulsA / 15) * 3 + (Math.random() * 3 - 1.5))));
    const yellowsB = Math.max(0, Math.min(8, Math.round((foulsB / 15) * 3 + (Math.random() * 3 - 1.5))));

    const redsA = Math.random() < 0.1 ? (Math.random() < 0.2 ? 2 : 1) : 0;
    const redsB = Math.random() < 0.1 ? (Math.random() < 0.2 ? 2 : 1) : 0;

    const offsidesA = Math.max(0, Math.min(6, Math.round(Math.random() * 4)));
    const offsidesB = Math.max(0, Math.min(6, Math.round(Math.random() * 4)));

    const cornersA = Math.max(0, Math.min(11, Math.round(Math.random() * 8 + (possessionA > 50 ? 2 : 0))));
    const cornersB = Math.max(0, Math.min(11, Math.round(Math.random() * 8 + (possessionB > 50 ? 2 : 0))));

    match._statsSeed = {
        possessionA, possessionB,
        basePassesA, basePassesB,
        precisionA, precisionB,
        totalShotsA, totalShotsB,
        targetShotsA, targetShotsB,
        foulsA, foulsB,
        yellowsA, yellowsB,
        redsA, redsB,
        offsidesA, offsidesB,
        cornersA, cornersB
    };

    return match._statsSeed;
}

function updatePossessionFluctuation(match) {
    const seed = getMatchStatsSeed(match);
    if (match._currentPossessionA === undefined) {
        match._currentPossessionA = seed.possessionA;
    }
    // Oscilação de 1 em 1% conforme o tempo passa
    if (Math.random() < 0.45) {
        const delta = Math.random() < 0.5 ? 1 : -1;
        match._currentPossessionA = Math.max(30, Math.min(70, match._currentPossessionA + delta));
    }
    return {
        possessionA: match._currentPossessionA,
        possessionB: 100 - match._currentPossessionA
    };
}

function getLiveMatchStats(match, minute) {
    const seed = getMatchStatsSeed(match);
    const poss = updatePossessionFluctuation(match);
    const progress = Math.min(1, Math.max(0, (minute || 0) / 90));

    if (minute === 0) {
        return {
            possessionA: poss.possessionA, possessionB: poss.possessionB,
            passesA: 0, passesB: 0,
            precisionA: seed.precisionA, precisionB: seed.precisionB,
            shotsA: 0, shotsB: 0,
            targetShotsA: 0, targetShotsB: 0,
            foulsA: 0, foulsB: 0,
            yellowsA: 0, yellowsB: 0,
            redsA: 0, redsB: 0,
            offsidesA: 0, offsidesB: 0,
            cornersA: 0, cornersB: 0
        };
    }

    const passesA = Math.round((poss.possessionA * 7.2 + (seed.basePassesA - seed.possessionA * 7.2)) * progress);
    const passesB = Math.round((poss.possessionB * 7.2 + (seed.basePassesB - seed.possessionB * 7.2)) * progress);

    let targetShotsA = Math.round(seed.targetShotsA * progress);
    let targetShotsB = Math.round(seed.targetShotsB * progress);
    let shotsA = Math.round(seed.totalShotsA * progress);
    let shotsB = Math.round(seed.totalShotsB * progress);

    const goalsA = match.goalsA || 0;
    const goalsB = match.goalsB || 0;

    targetShotsA = Math.max(goalsA, targetShotsA);
    targetShotsB = Math.max(goalsB, targetShotsB);
    shotsA = Math.max(targetShotsA, shotsA);
    shotsB = Math.max(targetShotsB, shotsB);

    return {
        possessionA: poss.possessionA,
        possessionB: poss.possessionB,
        passesA: Math.max(0, passesA),
        passesB: Math.max(0, passesB),
        precisionA: seed.precisionA,
        precisionB: seed.precisionB,
        shotsA: shotsA,
        shotsB: shotsB,
        targetShotsA: targetShotsA,
        targetShotsB: targetShotsB,
        foulsA: Math.round(seed.foulsA * progress),
        foulsB: Math.round(seed.foulsB * progress),
        yellowsA: Math.round(seed.yellowsA * progress),
        yellowsB: Math.round(seed.yellowsB * progress),
        redsA: Math.round(seed.redsA * progress),
        redsB: Math.round(seed.redsB * progress),
        offsidesA: Math.round(seed.offsidesA * progress),
        offsidesB: Math.round(seed.offsidesB * progress),
        cornersA: Math.round(seed.cornersA * progress),
        cornersB: Math.round(seed.cornersB * progress)
    };
}

function calculateWinProbabilities(match, minute) {
    const strengthA = match.teamA.strength || 50;
    const strengthB = match.teamB.strength || 50;
    const goalsA = match.goalsA || 0;
    const goalsB = match.goalsB || 0;
    const m = Math.min(90, Math.max(0, minute || 0));

    const diffGoals = goalsA - goalsB;
    const diffStr = strengthA - strengthB;

    let probA = 38 + diffStr * 0.4 + diffGoals * 22;
    let probB = 38 - diffStr * 0.4 - diffGoals * 22;
    let draw = 24;

    if (m > 0) {
        if (diffGoals > 0) {
            const factor = (m / 90) * 35;
            probA += factor;
            probB = Math.max(2, probB - factor * 0.7);
            draw = Math.max(3, draw - factor * 0.3);
        } else if (diffGoals < 0) {
            const factor = (m / 90) * 35;
            probB += factor;
            probA = Math.max(2, probA - factor * 0.7);
            draw = Math.max(3, draw - factor * 0.3);
        } else {
            const drawBoost = (m / 90) * 15;
            draw += drawBoost;
            probA = Math.max(5, probA - drawBoost * 0.5);
            probB = Math.max(5, probB - drawBoost * 0.5);
        }
    }

    probA = Math.max(3, probA);
    probB = Math.max(3, probB);
    draw = Math.max(3, draw);

    const total = probA + probB + draw;
    const pctA = Math.round((probA / total) * 100);
    const pctB = Math.round((probB / total) * 100);
    const pctDraw = Math.max(0, 100 - pctA - pctB);

    return { pctA, pctDraw, pctB };
}

function getBadgeClasses(valA, valB, higherIsBetter = true) {
    const numA = typeof valA === 'number' ? valA : parseFloat(String(valA).replace('%', '')) || 0;
    const numB = typeof valB === 'number' ? valB : parseFloat(String(valB).replace('%', '')) || 0;

    if (numA === numB) {
        return {
            classA: 'stats-badge stats-badge--neutral',
            classB: 'stats-badge stats-badge--neutral'
        };
    }

    const isAWinner = higherIsBetter ? (numA > numB) : (numA < numB);
    if (isAWinner) {
        return {
            classA: 'stats-badge stats-badge--highlight',
            classB: 'stats-badge stats-badge--neutral'
        };
    } else {
        return {
            classA: 'stats-badge stats-badge--neutral',
            classB: 'stats-badge stats-badge--highlight'
        };
    }
}

function renderLiveMatchStatsPanel(match, mode) {
    const stats = getLiveMatchStats(match, match.minute);
    const prob = calculateWinProbabilities(match, match.minute);

    const rows = [
        { label: 'Chutes', keyA: 'shotsA', keyB: 'shotsB', valA: stats.shotsA, valB: stats.shotsB, higherIsBetter: true },
        { label: 'Chutes a gol', keyA: 'targetShotsA', keyB: 'targetShotsB', valA: stats.targetShotsA, valB: stats.targetShotsB, higherIsBetter: true },
        { label: 'Posse de bola', keyA: 'possessionA', keyB: 'possessionB', valA: `${stats.possessionA}%`, valB: `${stats.possessionB}%`, higherIsBetter: true },
        { label: 'Passes', keyA: 'passesA', keyB: 'passesB', valA: stats.passesA, valB: stats.passesB, higherIsBetter: true },
        { label: 'Precisão de passe', keyA: 'precisionA', keyB: 'precisionB', valA: `${stats.precisionA}%`, valB: `${stats.precisionB}%`, higherIsBetter: true },
        { label: 'Faltas', keyA: 'foulsA', keyB: 'foulsB', valA: stats.foulsA, valB: stats.foulsB, higherIsBetter: false },
        { label: 'Cartões amarelos', keyA: 'yellowsA', keyB: 'yellowsB', valA: stats.yellowsA, valB: stats.yellowsB, higherIsBetter: false },
        { label: 'Cartões vermelhos', keyA: 'redsA', keyB: 'redsB', valA: stats.redsA, valB: stats.redsB, higherIsBetter: false },
        { label: 'Impedimentos', keyA: 'offsidesA', keyB: 'offsidesB', valA: stats.offsidesA, valB: stats.offsidesB, higherIsBetter: false },
        { label: 'Escanteios', keyA: 'cornersA', keyB: 'cornersB', valA: stats.cornersA, valB: stats.cornersB, higherIsBetter: true }
    ];

    const rowsHtml = rows.map(r => {
        const { classA, classB } = getBadgeClasses(r.valA, r.valB, r.higherIsBetter);
        return `
            <div class="stats-row-item">
                <span class="${classA}" data-stat="${r.keyA}-${match.id}">${r.valA}</span>
                <span class="stats-metric-name">${r.label}</span>
                <span class="${classB}" data-stat="${r.keyB}-${match.id}">${r.valB}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="match-stats-panel" id="stats-panel-${match.id}">
            <div class="stats-header-title">
                <span>${renderTeamLabel(match.teamA, { mode })}</span>
                <span>ESTATÍSTICAS DOS TIMES</span>
                <span>${renderTeamLabel(match.teamB, { mode })}</span>
            </div>
            <div class="stats-table-list">
                ${rowsHtml}
            </div>
            <div class="win-prob-section">
                <div class="win-prob-title">PROBABILIDADE DE VITÓRIA</div>
                <div class="win-prob-labels">
                    <span><strong>${match.teamA.name}</strong> <span data-prob-val-a="${match.id}">${prob.pctA}%</span></span>
                    <span><strong>Empate</strong> <span data-prob-val-draw="${match.id}">${prob.pctDraw}%</span></span>
                    <span><strong>${match.teamB.name}</strong> <span data-prob-val-b="${match.id}">${prob.pctB}%</span></span>
                </div>
                <div class="win-prob-bar-container">
                    <div class="win-prob-segment win-prob-segment--teamA" data-prob-bar-a="${match.id}" style="width: ${prob.pctA}%;"></div>
                    <div class="win-prob-segment win-prob-segment--draw" data-prob-bar-draw="${match.id}" style="width: ${prob.pctDraw}%;"></div>
                    <div class="win-prob-segment win-prob-segment--teamB" data-prob-bar-b="${match.id}" style="width: ${prob.pctB}%;"></div>
                </div>
            </div>
        </div>
    `;
}

function renderLiveKnockoutStage(mode) {
    const tournament = state[mode];
    const { stage, matches } = tournament.knockout;
    let title = 'Fase Final';
    if (stage === stages.trintaedoisavos) title = '32avos de Final';
    else if (stage === stages.dezesseisavos) title = '16avos de Final';
    else if (stage === stages.oitavas) title = 'Oitavas de Final';
    else if (stage === stages.quartas) title = 'Quartas de Final';
    else if (stage === stages.semi) title = 'Semifinal';
    else if (stage === stages.final) title = 'Final';

    if (stage === stages.final && matches.every(match => match.winner)) {
        tournament.champion = matches[0].winner;
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
        
        if (!match.winner && match.goalsA !== null && match.goalsB !== null && match.goalsA === match.goalsB && match.seconds >= 5400) {
            if (!match.penalties) {
                penaltyPart = `<button data-open-live-penalty="${match.id}" class="btn-stats open-live-penalty">PÊNALTIS</button>`;
            } else {
                match._idx = idx;
                match._mode = mode;
                penaltyPart = renderPenaltyInterface(match, mode, match._idx, true);
            }
        }

        const statsBtn = `<button data-toggle-match-stats="${match.id}" class="btn-stats toggle-match-stats">${match.showStats ? 'OCULTAR ESTAT.' : 'ESTATÍSTICAS'}</button>`;
        const historyBtn = `<button data-toggle-match-history="${match.id}" class="btn-stats toggle-match-history">${match.showHistory ? 'OCULTAR MIN.' : 'MINUTO A MINUTO'}</button>`;

        const statsPanelHtml = match.showStats ? renderLiveMatchStatsPanel(match, mode) : '';
        const historyPanelHtml = match.showHistory ? renderLiveMatchHistoryPanel(match) : '';

        const formattedTimer = formatMatchTimer(match.seconds || 0);

        return `
            <div class="knockout-match-block" id="match-block-${match.id}">
                <div class="match-content-wrapper">
                    <div class="match-item-grid">
                        <span class="match-team-a">${renderTeamLabel(match.teamA, { mode })}</span>
                        <div class="match-score-center" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 90px;">
                            <span id="score-display-${match.id}" style="font-size: 1.2rem; font-weight: bold; margin-bottom: 4px;">${score}</span>
                            <div id="timer-${match.id}" class="match-timer ${(match.seconds || 0) >= 5400 ? 'finished' : ''}">${formattedTimer}</div>
                        </div>
                        <span class="match-team-b">${renderTeamLabel(match.teamB, { mode })}</span>
                    </div>
                    ${result}
                    ${penaltyPart}
                    <div class="match-actions-row">
                        ${statsBtn}
                        ${historyBtn}
                    </div>
                    ${statsPanelHtml}
                    ${historyPanelHtml}
                </div>
            </div>
        `;
    }).join('');

    const historyRows = '';

    let nextStageButton = '';
    if (allMatchesFinished) {
        if (stage === stages.trintaedoisavos) nextStageButton = '<button id="goNext" class="success">Ir para 16avos</button>';
        else if (stage === stages.dezesseisavos) nextStageButton = '<button id="goNext" class="success">Ir para Oitavas</button>';
        else if (stage === stages.oitavas) nextStageButton = '<button id="goNext" class="success">Ir para Quartas</button>';
        else if (stage === stages.quartas) nextStageButton = '<button id="goNext" class="success">Ir para Semifinal</button>';
        else if (stage === stages.semi) nextStageButton = '<button id="goNext" class="success">Ir para Final</button>';
        else if (stage === stages.final) nextStageButton = '<button id="goNext" class="success" style="background-color: gold; color: black; font-weight: bold; border: 2px solid #b8860b;">LEVANTAR TROFÉU 🏆</button>';
    }

    app.innerHTML = `
        <section class="card">
            <div class="title-group">
                <div>
                    <h2>${title}</h2>
                    <p class="description">Partidas simultâneas com tempo e histórico de gols.</p>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            <div class="status-line">
                <button id="startLiveMatch" class="success">Iniciar partidas</button>
                ${nextStageButton}
            </div>
        </section>
        ${renderPlayerStatsTable(mode)}
        <section class="knockout-list section-panel">${matchRows}</section>

        ${renderTournamentStats(mode, true)}
    `;

    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => {
        if (mode === 'libertadores') setupLibertadoresSelection();
        else setupTournamentSelection(mode);
    });
    
    document.getElementById('startLiveMatch').addEventListener('click', () => {
        if (tournament.live.inProgress) return;
        startLiveMatch(mode);
    });

    app.querySelectorAll('.toggle-match-stats').forEach(btn => {
        btn.addEventListener('click', () => {
            const matchId = btn.getAttribute('data-toggle-match-stats');
            const match = tournament.live.matches.find(m => String(m.id) === String(matchId));
            if (match) {
                match.showStats = !match.showStats;
                renderLiveKnockoutStage(mode);
            }
        });
    });

    app.querySelectorAll('.toggle-match-history').forEach(btn => {
        btn.addEventListener('click', () => {
            const matchId = btn.getAttribute('data-toggle-match-history');
            const match = tournament.live.matches.find(m => String(m.id) === String(matchId));
            if (match) {
                match.showHistory = !match.showHistory;
                renderLiveKnockoutStage(mode);
            }
        });
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
            advanceKnockoutStage(mode);
            tournament.live = null;
            renderTournamentKnockout(mode);
        });
    }
}

function formatMatchTimer(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateLiveDOM(mode) {
    const tournament = state[mode];
    if (!tournament || !tournament.live) return;

    // Placar, Tempo e Painéis de estatísticas em tempo real (SEM PISCAR)
    tournament.live.matches.forEach(match => {
        const scoreEl = document.getElementById(`score-display-${match.id}`);
        if (scoreEl) {
            let scoreText = match.goalsA === null ? '0 x 0' : `${match.goalsA} x ${match.goalsB}`;
            if (match.penalties && match.penalties.finished) {
                const scorePenA = match.penalties.attemptsA.filter(Boolean).length;
                const scorePenB = match.penalties.attemptsB.filter(Boolean).length;
                scoreText += ` (${scorePenA}x${scorePenB} pen)`;
            }
            scoreEl.textContent = scoreText;
        }

        const timerEl = document.getElementById(`timer-${match.id}`);
        if (timerEl) {
            timerEl.textContent = formatMatchTimer(match.seconds || 0);
            if ((match.seconds || 0) >= 5400) {
                timerEl.classList.add('finished');
            }
        }

        // Se o painel de estatísticas da partida estiver aberto, atualiza APENAS os valores
        const statsPanel = document.getElementById(`stats-panel-${match.id}`);
        if (statsPanel) {
            const stats = getLiveMatchStats(match, match.minute);
            const prob = calculateWinProbabilities(match, match.minute);

            const updateBadge = (keyA, keyB, valA, valB, higherIsBetter = true) => {
                const badgeA = statsPanel.querySelector(`[data-stat="${keyA}-${match.id}"]`);
                const badgeB = statsPanel.querySelector(`[data-stat="${keyB}-${match.id}"]`);
                if (badgeA && badgeB) {
                    badgeA.textContent = valA;
                    badgeB.textContent = valB;

                    const { classA, classB } = getBadgeClasses(valA, valB, higherIsBetter);
                    badgeA.className = classA;
                    badgeB.className = classB;
                }
            };

            updateBadge('shotsA', 'shotsB', stats.shotsA, stats.shotsB, true);
            updateBadge('targetShotsA', 'targetShotsB', stats.targetShotsA, stats.targetShotsB, true);
            updateBadge('possessionA', 'possessionB', `${stats.possessionA}%`, `${stats.possessionB}%`, true);
            updateBadge('passesA', 'passesB', stats.passesA, stats.passesB, true);
            updateBadge('precisionA', 'precisionB', `${stats.precisionA}%`, `${stats.precisionB}%`, true);
            updateBadge('foulsA', 'foulsB', stats.foulsA, stats.foulsB, false);
            updateBadge('yellowsA', 'yellowsB', stats.yellowsA, stats.yellowsB, false);
            updateBadge('redsA', 'redsB', stats.redsA, stats.redsB, false);
            updateBadge('offsidesA', 'offsidesB', stats.offsidesA, stats.offsidesB, false);
            updateBadge('cornersA', 'cornersB', stats.cornersA, stats.cornersB, true);

            // Atualiza Probabilidades
            const lblA = statsPanel.querySelector(`[data-prob-val-a="${match.id}"]`);
            const lblDraw = statsPanel.querySelector(`[data-prob-val-draw="${match.id}"]`);
            const lblB = statsPanel.querySelector(`[data-prob-val-b="${match.id}"]`);
            if (lblA) lblA.textContent = `${prob.pctA}%`;
            if (lblDraw) lblDraw.textContent = `${prob.pctDraw}%`;
            if (lblB) lblB.textContent = `${prob.pctB}%`;

            const barA = statsPanel.querySelector(`[data-prob-bar-a="${match.id}"]`);
            const barDraw = statsPanel.querySelector(`[data-prob-bar-draw="${match.id}"]`);
            const barB = statsPanel.querySelector(`[data-prob-bar-b="${match.id}"]`);
            if (barA) barA.style.width = `${prob.pctA}%`;
            if (barDraw) barDraw.style.width = `${prob.pctDraw}%`;
            if (barB) barB.style.width = `${prob.pctB}%`;
        }

        const historyPanel = document.getElementById(`history-panel-${match.id}`);
        if (historyPanel && match.showHistory) {
            historyPanel.outerHTML = renderLiveMatchHistoryPanel(match);
        }
    });

    // 3. Histórico de gols


    const pStatsTbody = document.getElementById('player-stats-tbody');
    if (pStatsTbody) {
        pStatsTbody.innerHTML = getPlayerStatsRowsHtml(mode);
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
        match.seconds = 0;
        match.penalties = null;
        match.winner = null;
        match.matchHistory = [];
        match._lastStats = getLiveMatchStats(match, 0);
    });

    tournament.live.intervalId = setInterval(() => {
        let allFinished = true;
        
        tournament.live.matches.forEach(match => {
            if (match.seconds >= 5400) return;
            allFinished = false;
            
            match.seconds += Math.floor(Math.random() * 12) + 4;
            if (match.seconds > 5400) match.seconds = 5400;
            match.minute = Math.floor(match.seconds / 60);

            const strengthA = match.teamA.strength || 50;
            const strengthB = match.teamB.strength || 50;
            
            let chanceA = (0.012 + (strengthA / 10000) + ((strengthA - strengthB) / 4000)) / 6;
            let chanceB = (0.012 + (strengthB / 10000) + ((strengthB - strengthA) / 4000)) / 6;
            
            chanceA = Math.max(0.001, Math.min(0.015, chanceA));
            chanceB = Math.max(0.001, Math.min(0.015, chanceB));
            
            const currentStats = getLiveMatchStats(match, match.minute);
            const prev = match._lastStats || currentStats;

            if (Math.random() < chanceA) {
                match.goalsA += 1;
                updateTeamStats(match.teamA, 1, 0, {shots:1});
                updateTeamStats(match.teamB, 0, 1, {});
                match.matchHistory.unshift({ minute: match.minute, type: 'goal', teamName: match.teamA.name });
            }
            if (Math.random() < chanceB) {
                match.goalsB += 1;
                updateTeamStats(match.teamB, 1, 0, {shots:1});
                updateTeamStats(match.teamA, 0, 1, {});
                match.matchHistory.unshift({ minute: match.minute, type: 'goal', teamName: match.teamB.name });
            }

            // Sync yellows, reds, fouls, shots from deterministic stats generator
            const updateCumulative = (team, stat, amount) => {
                if (amount > 0) {
                    team[stat] = (team[stat] || 0) + amount;
                }
            };
            updateCumulative(match.teamA, 'yellows', currentStats.yellowsA - prev.yellowsA);
            updateCumulative(match.teamB, 'yellows', currentStats.yellowsB - prev.yellowsB);
            updateCumulative(match.teamA, 'reds', currentStats.redsA - prev.redsA);
            updateCumulative(match.teamB, 'reds', currentStats.redsB - prev.redsB);
            updateCumulative(match.teamA, 'fouls', currentStats.foulsA - prev.foulsA);
            updateCumulative(match.teamB, 'fouls', currentStats.foulsB - prev.foulsB);
            updateCumulative(match.teamA, 'shots', currentStats.shotsA - prev.shotsA);
            updateCumulative(match.teamB, 'shots', currentStats.shotsB - prev.shotsB);
            
            for(let i = 0; i < (currentStats.yellowsA - prev.yellowsA); i++) {
                match.matchHistory.unshift({ minute: match.minute, type: 'yellow', teamName: match.teamA.name });
            }
            for(let i = 0; i < (currentStats.yellowsB - prev.yellowsB); i++) {
                match.matchHistory.unshift({ minute: match.minute, type: 'yellow', teamName: match.teamB.name });
            }
            for(let i = 0; i < (currentStats.redsA - prev.redsA); i++) {
                match.matchHistory.unshift({ minute: match.minute, type: 'red', teamName: match.teamA.name });
            }
            for(let i = 0; i < (currentStats.redsB - prev.redsB); i++) {
                match.matchHistory.unshift({ minute: match.minute, type: 'red', teamName: match.teamB.name });
            }
            match._lastStats = currentStats;
        });

        // Atualização SEM PISCAR O DOM:
        updateLiveDOM(mode);

        if (allFinished) {
            clearInterval(tournament.live.intervalId);
            tournament.live.inProgress = false;
            tournament.live.matches.forEach((match) => {
                if (match.goalsA !== match.goalsB) {
                    match.winner = match.goalsA > match.goalsB ? match.teamA : match.teamB;
                }
            });
            renderLiveKnockoutStage(mode);
        }
    }, 120);
}

function renderPenaltyInterface(match, mode = match._mode) {
    if (!match.penalties) return '';
    const penalties = match.penalties;
    const scoreA = penalties.attemptsA.filter(Boolean).length;
    const scoreB = penalties.attemptsB.filter(Boolean).length;
    const roundsA = [...penalties.attemptsA, ...Array(Math.max(0, 5 - penalties.attemptsA.length)).fill(null)].map(value => value === null ? '-' : value ? '1' : '0').join(' ');
    const roundsB = [...penalties.attemptsB, ...Array(Math.max(0, 5 - penalties.attemptsB.length)).fill(null)].map(value => value === null ? '-' : value ? '1' : '0').join(' ');
    const isSuddenDeath = penalties.attemptsA.length >= 5 && penalties.attemptsB.length >= 5;
    const currentRound = Math.max(penalties.attemptsA.length, penalties.attemptsB.length) + (penalties.turn === 'A' ? 1 : 0);
    const shooterName = penalties.turn === 'A' ? match.teamA.name : match.teamB.name;
    const status = penalties.winner
        ? `<div><strong>Vencedor nos pênaltis: ${penalties.winner.name}</strong></div>`
        : isSuddenDeath
            ? `<div><strong>Morte Súbita (${currentRound}ª cobrança) - Turno: ${shooterName}</strong></div>`
            : `<div><strong>Turno:</strong> ${shooterName}</div>`;
    
    const buttonHtml = penalties.winner
        ? '<div class="alert-box">Pênaltis concluídos.</div>'
        : penalties.pendingKick
            ? `<button class="success" disabled style="margin-right: 10px;">Aguardando...</button><button data-skip-penalty="${match._idx}:${match._mode}" class="secondary skip-penalty">PULAR PÊNALTIS</button>`
            : `<button data-kick-penalty="${match._idx}:${match._mode}" class="success kick-penalty" style="margin-right: 10px;">BATER PÊNALTI</button>
               <button data-skip-penalty="${match._idx}:${match._mode}" class="secondary skip-penalty">PULAR PÊNALTIS</button>`;
            
    return `
        <div class="penalty-panel">
            <div class="penalty-row"><span>${renderTeamLabel(match.teamA, { mode })}</span><span class="penalty-circles">${roundsA}</span></div>
            <div class="penalty-row"><span>${renderTeamLabel(match.teamB, { mode })}</span><span class="penalty-circles">${roundsB}</span></div>
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
                    <h2>🏆 Campeão 🏆</h2>
                    <p class="description">Parabens ao time que venceu a final.</p>
                </div>
                <div class="header-action-buttons">
                    <button id="backButton" class="secondary">Voltar ao menu</button>
                    <button id="restartButton" class="danger">Recomeçar</button>
                </div>
            </div>
            <div class="champion-display">
                ${renderTeamLabel(state[mode].champion, { mode, large: true })}
            </div>
        </section>
        ${renderPlayerStatsTable(mode)}
        ${renderTournamentStats(mode, true)}
    `;
    document.getElementById('backButton').addEventListener('click', renderMainScreen);
    document.getElementById('restartButton').addEventListener('click', () => {
        if (mode === 'libertadores') setupLibertadoresSelection();
        else setupTournamentSelection(mode);
    });
}

function initApp() {
    StorageManager.saveLeagues();
    renderMainScreen();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Global Toggle Handlers
document.addEventListener('click', (e) => {
    if (e.target.matches('.toggle-history-stats')) {
        const wrapper = e.target.closest('.section-panel').querySelector('.history-wrapper');
        if (wrapper) {
            const isHidden = wrapper.style.display === 'none';
            wrapper.style.display = isHidden ? '' : 'none';
            e.target.textContent = isHidden ? 'OCULTAR' : 'MOSTRAR';
        }
    } else if (e.target.matches('.toggle-player-stats')) {
        const wrapper = e.target.closest('.section-panel').querySelector('.player-stats-wrapper');
        if (wrapper) {
            const isHidden = wrapper.style.display === 'none';
            wrapper.style.display = isHidden ? '' : 'none';
            e.target.textContent = isHidden ? 'OCULTAR' : 'MOSTRAR';
        }
    } else if (e.target.closest('.sidebar-player-row')) {
        const row = e.target.closest('.sidebar-player-row');
        state.multiplayer.activePlayer = Number(row.getAttribute('data-select-player'));
        
        document.querySelectorAll('.sidebar-player-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');

        if (document.querySelector('.league-group-card')) {
            if (typeof mode !== 'undefined') renderTournamentSelection(mode);
            else if (state.leagueKey) renderTournamentSelection(state.leagueKey);
        } else {
            if (state.leagueKey) renderLeagueAssignment(state.leagueKey);
        }
    } else if (e.target.matches('.btn-tab')) {
        state.activeStatsTab = e.target.getAttribute('data-tab');
        
        // Re-render
        if (document.getElementById('leagueStatsTabsContainer')) {
            const container = document.getElementById('leagueStatsTabsContainer');
            if (container) container.innerHTML = renderTournamentStats(state.leagueKey, true);
        } else {
            const panel = e.target.closest('.stats-panel');
            if (panel && panel.parentElement) {
                const isExpanded = panel.querySelector('th:nth-child(4)') !== null;
                const mode = state.leagueKey || 'worldCup';
                panel.outerHTML = renderTournamentStats(mode, isExpanded);
            }
        }
    }
});

function renderMultiplayerSidebar(mode) {
    if (state.multiplayer.numPlayers < 2) return '';
    
    let isLeague = !['libertadores', 'custom', 'worldCup', 'championsleague'].includes(mode);
    const tournament = isLeague ? null : state[mode];
    const allTeams = isLeague ? state.leagueTeams : (tournament.pool || []);
    
    let rows = '';
    for (let p = 1; p <= state.multiplayer.numPlayers; p++) {
        const playerColor = state.multiplayer.colors[p];
        const count = Object.values(state.multiplayer.playerAssignments).filter(pid => pid === p).length;
        const isActive = p === state.multiplayer.activePlayer ? ' active' : '';
        
        rows += `
            <div class="sidebar-player-row${isActive}" data-select-player="${p}">
                <div class="player-info">
                    <div class="player-color-dot" style="background: ${playerColor}"></div>
                    <span>Player ${p}</span>
                </div>
                <div class="player-count">${count} times</div>
            </div>
        `;
    }
    
    return `
        <aside class="multiplayer-sidebar">
            <h3>Seleção Atual</h3>
            ${rows}
        </aside>
    `;
}

function renderLiveMatchHistoryPanel(match) {
    if (!match.matchHistory || match.matchHistory.length === 0) {
        return `
            <div class="stats-panel history-panel" id="history-panel-${match.id}">
                <div class="alert-box">Nenhum evento registrado ainda.</div>
            </div>
        `;
    }

    const rows = match.matchHistory.map(event => {
        let icon = '';
        if (event.type === 'goal') icon = '⚽';
        if (event.type === 'yellow') icon = '🟨';
        if (event.type === 'red') icon = '🟥';

        return `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span style="font-weight: bold; width: 40px;">${event.minute}'</span>
                <span style="flex: 1; text-align: center;">${icon} ${event.teamName}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="stats-panel history-panel" id="history-panel-${match.id}">
            <h4 style="text-align: center; margin-bottom: 10px; font-size: 0.9rem;">Histórico da Partida</h4>
            <div style="max-height: 200px; overflow-y: auto;">
                ${rows}
            </div>
        </div>
    `;
}
