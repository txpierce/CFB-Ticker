let currentQuery = 'groups=80';
let gamesData = [];
let previousScores = {}; 
let rankingsMap = {};
let currentIndex = 0;
let slideInterval = null;
let isGridView = false;
const CARD_HEIGHT = 80;

window.addEventListener('DOMContentLoaded', () => {
    fetchAllData();
});

async function fetchAllData() {
    await Promise.allSettled([
        fetchRankings(),
        fetchScores()
    ]);
}

async function fetchRankings() {
    try {
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings');
        const data = await response.json();
        rankingsMap = {};
        if (data.rankings && data.rankings.length > 0) {
            const topPoll = data.rankings[0]; 
            if (topPoll && topPoll.ranks) {
                topPoll.ranks.forEach(item => {
                    if (item.team && item.team.id) {
                        rankingsMap[item.team.id] = item.current;
                    }
                });
            }
        }
    } catch (error) {
        console.warn('Rankings fetch failed:', error);
    }
}

async function fetchScores() {
    const API_URL = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?${currentQuery}&limit=200`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        let events = data.events || [];
        
        let favorites = getFavorites();

        if (currentQuery === 'favorites') {
            events = events.filter(event => {
                const comp = event.competitions[0];
                return comp.competitors.some(c => favorites.includes(c.team.id));
            });
        } else if (currentQuery === 'top25') {
            events = events.filter(event => {
                const comp = event.competitions[0];
                return comp.competitors.some(c => rankingsMap[c.team.id] && rankingsMap[c.team.id] <= 25);
            });
        } else if (currentQuery === 'live') {
            events = events.filter(event => event.status.type.state === 'in');
        }

        gamesData = events;
        if (currentIndex >= gamesData.length) currentIndex = 0;

        if (gamesData.length > 0) {
            if (isGridView) {
                renderGridView();
            } else {
                renderTickerItems();
                startTickerAnimation();
            }
        } else {
            const tickerContainer = document.getElementById('ticker-container');
            if (slideInterval) clearInterval(slideInterval);
            tickerContainer.style.transform = 'translateY(0px)';
            tickerContainer.innerHTML = `
                <div class="ticker-item"><span style="margin: auto;">No matching games found.</span></div>
            `;
            document.getElementById('grid-container').innerHTML = `<div style="text-align: center; color: #8c7355; padding: 40px; grid-column: 1/-1;">No matching games found.</div>`;
        }
    } catch (error) {
        console.error('Error fetching scoreboard:', error);
    }
}

function changeFilter() {
    currentQuery = document.getElementById('filter-select').value;
    fetchAllData();
}

function toggleGridView() {
    isGridView = !isGridView;
    const btn = document.getElementById('grid-toggle-btn');
    const tickerWrap = document.querySelector('.ticker-wrap');
    const gridContainer = document.getElementById('grid-container');

    if (isGridView) {
        btn.textContent = 'Ticker View';
        btn.classList.add('active');
        tickerWrap.style.display = 'none';
        gridContainer.style.display = 'grid';
        if (slideInterval) clearInterval(slideInterval);
        renderGridView();
    } else {
        btn.textContent = 'Live Ranked Grid';
        btn.classList.remove('active');
        tickerWrap.style.display = 'block';
        gridContainer.style.display = 'none';
        renderTickerItems();
        startTickerAnimation();
    }
}

function renderGridView() {
    const gridContainer = document.getElementById('grid-container');
    
    // Filter for live games where at least one team is ranked in the top 25
    const liveRankedGames = gamesData.filter(event => {
        const isLive = event.status.type.state === 'in';
        const comp = event.competitions[0];
        const hasRankedTeam = comp.competitors.some(c => rankingsMap[c.team.id] && rankingsMap[c.team.id] <= 25);
        return isLive && hasRankedTeam;
    });

    if (liveRankedGames.length === 0) {
        gridContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #8c7355; padding: 40px;">No live ranked games right now.</div>`;
        return;
    }

    let html = '';
    liveRankedGames.forEach(event => {
        const competition = event.competitions[0];
        const homeComp = competition.competitors.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors.find(c => c.homeAway === 'away');

        const home = parseTeamData(homeComp);
        const away = parseTeamData(awayComp);

        const statusDetail = event.status.type.detail;
        let tvChannel = '';
        if (competition.broadcasts && competition.broadcasts.length > 0) {
            const b = competition.broadcasts.find(x => x.names && x.names.length > 0);
            if (b) tvChannel = b.names[0];
        }
        const badgeContent = tvChannel ? `${statusDetail} • ${tvChannel}` : statusDetail;

        html += `
            <div class="grid-card" onclick="openGameModalById('${event.id}')">
                <div class="grid-status">${badgeContent}</div>
                <div class="grid-team-row">
                    <div class="team-left">
                        <button class="star-btn ${away.isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${away.teamId}')">★</button>
                        ${away.rank ? `<span class="team-rank">${away.rank}</span>` : ''}
                        ${away.logo ? `<img class="team-logo" src="${away.logo}" alt="">` : ''}
                        <span class="team-name">${away.name}</span>
                    </div>
                    <span class="score">${away.score}</span>
                </div>
                <div class="grid-team-row">
                    <div class="team-left">
                        <button class="star-btn ${home.isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${home.teamId}')">★</button>
                        ${home.rank ? `<span class="team-rank">${home.rank}</span>` : ''}
                        ${home.logo ? `<img class="team-logo" src="${home.logo}" alt="">` : ''}
                        <span class="team-name">${home.name}</span>
                    </div>
                    <span class="score">${home.score}</span>
                </div>
            </div>
        `;
    });
    gridContainer.innerHTML = html;
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('cfb_favorites')) || [];
    } catch {
        return [];
    }
}

function toggleFavorite(event, teamId) {
    event.stopPropagation();
    let favorites = getFavorites();
    if (favorites.includes(teamId)) {
        favorites = favorites.filter(id => id !== teamId);
    } else {
        favorites.push(teamId);
    }
    localStorage.setItem('cfb_favorites', JSON.stringify(favorites));
    if (isGridView) renderGridView();
    else renderTickerItems();
}

function parseTeamData(competitor) {
    const teamId = competitor.team.id;
    const name = competitor.team.shortDisplayName || competitor.team.name;
    const score = competitor.score ?? '0';
    const logo = competitor.team.logo || '';
    
    let rank = '';
    const mappedRank = rankingsMap[teamId];
    if (mappedRank && mappedRank <= 25) {
        rank = `#${mappedRank}`;
    }

    const favorites = getFavorites();
    const isFav = favorites.includes(teamId);

    return { teamId, name, score, logo, rank, isFav };
}

function formatCentralTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return date.toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function renderTickerItems() {
    const tickerContainer = document.getElementById('ticker-container');
    let html = '';

    gamesData.forEach(event => {
        const competition = event.competitions[0];
        const homeComp = competition.competitors.find(c => c.homeAway === 'home');
        const awayComp = competition.competitors.find(c => c.homeAway === 'away');

        if (!homeComp || !awayComp) return;

        const home = parseTeamData(homeComp);
        const away = parseTeamData(awayComp);

        let awayFlash = false;
        let homeFlash = false;
        if (previousScores[awayComp.id] !== undefined && previousScores[awayComp.id] !== away.score) awayFlash = true;
        if (previousScores[homeComp.id] !== undefined && previousScores[homeComp.id] !== home.score) homeFlash = true;
        
        previousScores[awayComp.id] = away.score;
        previousScores[homeComp.id] = home.score;

        const statusType = event.status.type.state;
        const statusDetail = event.status.type.detail; 

        let tvChannel = '';
        if (competition.broadcasts && competition.broadcasts.length > 0) {
            const b = competition.broadcasts.find(x => x.names && x.names.length > 0);
            if (b) tvChannel = b.names[0];
        }

        let displayStatus = statusDetail;
        if (statusType === 'pre') {
            const ct = formatCentralTime(event.date);
            displayStatus = ct ? `${ct} CT` : event.status.type.shortDetail;
        }

        const badgeContent = tvChannel ? `${displayStatus} • ${tvChannel}` : displayStatus;

        html += `
            <div class="ticker-item" data-eventid="${event.id}">
                <div class="team-info">
                    <div class="team-row">
                        <div class="team-left">
                            <button class="star-btn ${away.isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${away.teamId}')">★</button>
                            ${away.rank ? `<span class="team-rank">${away.rank}</span>` : ''}
                            ${away.logo ? `<img class="team-logo" src="${away.logo}" alt="">` : ''}
                            <span class="team-name">${away.name}</span>
                        </div>
                        <span class="score ${awayFlash ? 'score-flash' : ''}">${away.score}</span>
                    </div>
                    <div class="team-row">
                        <div class="team-left">
                            <button class="star-btn ${home.isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${home.teamId}')">★</button>
                            ${home.rank ? `<span class="team-rank">${home.rank}</span>` : ''}
                            ${home.logo ? `<img class="team-logo" src="${home.logo}" alt="">` : ''}
                            <span class="team-name">${home.name}</span>
                        </div>
                        <span class="score ${homeFlash ? 'score-flash' : ''}">${home.score}</span>
                    </div>
                </div>
                <div class="status-badge">${badgeContent}</div>
            </div>
        `;
    });

    if (gamesData.length > 0) {
        const firstEvent = gamesData[0];
        const comp = firstEvent.competitions[0];
        const homeComp = comp.competitors.find(c => c.homeAway === 'home');
        const awayComp = comp.competitors.find(c => c.homeAway === 'away');
        
        if (homeComp && awayComp) {
            const home = parseTeamData(homeComp);
            const away = parseTeamData(awayComp);
            
            let tvChannel = '';
            if (comp.broadcasts && comp.broadcasts.length > 0) {
                const b = comp.broadcasts.find(x => x.names && x.names.length > 0);
                if (b) tvChannel = b.names[0];
            }
            let firstStatus = firstEvent.status.type.shortDetail;
            if (firstEvent.status.type.state === 'pre') {
                const ct = formatCentralTime(firstEvent.date);
                firstStatus = ct ? `${ct} CT` : firstStatus;
            }
            const badgeContent = tvChannel ? `${firstStatus} • ${tvChannel}` : firstStatus;
            
            html += `
                <div class="ticker-item" data-eventid="${firstEvent.id}">
                    <div class="team-info">
                        <div class="team-row">
                            <div class="team-left">
                                <button class="star-btn ${away.isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${away.teamId}')">★</button>
                                ${away.rank ? `<span class="team-rank">${away.rank}</span>` : ''}
                                ${away.logo ? `<img class="team-logo" src="${away.logo}" alt="">` : ''}
                                <span class="team-name">${away.name}</span>
                            </div>
                            <span class="score">${away.score}</span>
                        </div>
                        <div class="team-row">
                            <div class="team-left">
                                <button class="star-btn ${home.isFav ? 'favorited' : ''}" onclick="toggleFavorite(event, '${home.teamId}')">★</button>
                                ${home.rank ? `<span class="team-rank">${home.rank}</span>` : ''}
                                ${home.logo ? `<img class="team-logo" src="${home.logo}" alt="">` : ''}
                                <span class="team-name">${home.name}</span>
                            </div>
                            <span class="score">${home.score}</span>
                        </div>
                    </div>
                    <div class="status-badge">${badgeContent}</div>
                </div>
            `;
        }
    }

    tickerContainer.innerHTML = html;
}

function startTickerAnimation() {
    if (slideInterval) clearInterval(slideInterval);
    if (isGridView) return;

    slideInterval = setInterval(() => {
        currentIndex++;
        const tickerContainer = document.getElementById('ticker-container');
        tickerContainer.style.transform = `translateY(-${currentIndex * CARD_HEIGHT}px)`;

        if (currentIndex >= gamesData.length) {
            setTimeout(() => {
                tickerContainer.style.transition = 'none';
                currentIndex = 0;
                tickerContainer.style.transform = `translateY(0px)`;
                setTimeout(() => {
                    tickerContainer.style.transition = 'transform 0.6s ease-in-out';
                }, 50);
            }, 650); 
        }
    }, 4000); 
}

// Modal Detail Popup
function openGameModal() {
    if (gamesData.length === 0) return;
    const activeEvent = gamesData[currentIndex % gamesData.length];
    fetchAndShowModal(activeEvent.id);
}

function openGameModalById(eventId) {
    fetchAndShowModal(eventId);
}

async function fetchAndShowModal(eventId) {
    const modal = document.getElementById('game-modal');
    const modalBody = document.getElementById('modal-body');
    
    modal.style.display = 'flex';
    modalBody.innerHTML = '<h3>Loading live game stats...</h3>';

    try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${eventId}`);
        const summary = await res.json();
        
        const comp = summary.header.competitions[0];
        const competitors = comp.competitors;
        const away = competitors.find(c => c.homeAway === 'away');
        const home = competitors.find(c => c.homeAway === 'home');

        let html = `
            <h2 style="text-align:center; margin-bottom: 5px; font-size: 16px; color: #d97706;">${summary.header.competitions[0].status.type.detail}</h2>
            <hr style="border-color: #3d2c22; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                <div>${away.team.shortDisplayName}: <span style="color:#10b981;">${away.score}</span></div>
                <div style="color: #8c7355; font-size: 14px; align-self: center;">@</div>
                <div>${home.team.shortDisplayName}: <span style="color:#10b981;">${home.score}</span></div>
            </div>
        `;

        if (summary.boxscore && summary.boxscore.linescores) {
            html += `<h4 style="color: #d97706; margin-bottom: 8px;">Quarter Scores</h4><table style="width:100%; text-align:center; margin-bottom:15px; border-collapse:collapse; font-size: 13px;">`;
            html += `<tr style="border-bottom:1px solid #3d2c22; color: #8c7355;"><th style="text-align:left;">Team</th>`;
            summary.boxscore.linescores[0].linescores.forEach((_, idx) => html += `<th>Q${idx+1}</th>`);
            html += `<th>T</th></tr>`;

            competitors.forEach(c => {
                html += `<tr><td style="text-align:left; padding:6px 0;">${c.team.shortDisplayName}</td>`;
                if (summary.boxscore.linescores) {
                    const teamLines = summary.boxscore.linescores.find(l => l.team.id === c.team.id);
                    if (teamLines && teamLines.linescores) {
                        teamLines.linescores.forEach(q => html += `<td>${q.value}</td>`);
                    }
                }
                html += `<td><b>${c.score}</b></td></tr>`;
            });
            html += `</table>`;
        }

        if (summary.drives && summary.drives.current) {
            html += `<h4 style="color: #d97706; margin-bottom: 6px;">Current Drive</h4><p style="font-size:13px; color:#bfa181;">${summary.drives.current.description || 'No active drive summary.'}</p>`;
        }

        modalBody.innerHTML = html;
    } catch (e) {
        console.error(e);
        modalBody.innerHTML = '<h3>Failed to load game summary details.</h3>';
    }
}

function closeGameModal() {
    document.getElementById('game-modal').style.display = 'none';
}

// Background poll every 30 seconds
setInterval(fetchAllData, 30000);
