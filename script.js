let currentQuery = 'groups=80'; // Default to All FBS
let gamesData = [];
let rankingsMap = {}; // Stores teamId -> rank number
let currentIndex = 0;
let slideInterval = null;

async function fetchAllData() {
    await fetchRankings();
    await fetchScores();
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
        console.error('Error fetching ESPN rankings:', error);
    }
}

async function fetchScores() {
    const API_URL = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?${currentQuery}&limit=200`;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        let events = data.events || [];
        
        // Handle custom client-side filters
        if (currentQuery === 'top25') {
            events = events.filter(event => {
                const comp = event.competitions[0];
                return comp.competitors.some(c => rankingsMap[c.team.id] && rankingsMap[c.team.id] <= 25);
            });
        } else if (currentQuery === 'live') {
            events = events.filter(event => event.status.type.state === 'in');
        }

        gamesData = events;
        currentIndex = 0; // Reset scroll index on filter change

        if (gamesData.length > 0) {
            renderTickerItems();
            startTickerAnimation();
        } else {
            const tickerContainer = document.getElementById('ticker-container');
            if (slideInterval) clearInterval(slideInterval);
            tickerContainer.style.transform = 'translateY(0px)';
            tickerContainer.innerHTML = `
                <div class="ticker-item"><span style="margin: auto;">No matching games found right now.</span></div>
            `;
        }
    } catch (error) {
        console.error('Error fetching ESPN scoreboard data:', error);
        document.getElementById('ticker-container').innerHTML = `
            <div class="ticker-item"><span style="margin: auto;">Failed to load scores.</span></div>
        `;
    }
}

function changeFilter() {
    const selectElement = document.getElementById('filter-select');
    currentQuery = selectElement.value;
    fetchAllData();
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

    return { name, score, logo, rank };
}

function renderTickerItems() {
    const tickerContainer = document.getElementById('ticker-container');
    let html = '';

    gamesData.forEach(event => {
        const competition = event.competitions[0];
        const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
        const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

        const home = parseTeamData(homeCompetitor);
        const away = parseTeamData(awayCompetitor);

        const statusType = event.status.type.state; // 'pre', 'in', 'post'
        const statusDetail = event.status.type.detail; 

        // Extract broadcast TV channel (e.g., ABC, ESPN, FOX) if available
        let tvChannel = '';
        if (competition.broadcasts && competition.broadcasts.length > 0) {
            // Find the first valid broadcast network name
            const broadcast = competition.broadcasts.find(b => b.names && b.names.length > 0);
            if (broadcast) {
                tvChannel = broadcast.names[0];
            }
        }

        let displayStatus = statusDetail;
        if (statusType === 'pre') {
            displayStatus = event.status.type.shortDetail; // e.g., "7:30 PM"
        }

        // Combine status and TV network into the badge layout
        const badgeContent = tvChannel ? `${displayStatus} • ${tvChannel}` : displayStatus;

        html += `
            <div class="ticker-item">
                <div class="team-info">
                    <div class="team-row">
                        <div class="team-left">
                            ${away.rank ? `<span class="team-rank">${away.rank}</span>` : ''}
                            ${away.logo ? `<img class="team-logo" src="${away.logo}" alt="">` : ''}
                            <span class="team-name">${away.name}</span>
                        </div>
                        <span class="score">${away.score}</span>
                    </div>
                    <div class="team-row">
                        <div class="team-left">
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
    });

    // Duplicate first item for seamless infinite loop
    if (gamesData.length > 0) {
        const firstEvent = gamesData[0];
        const comp = firstEvent.competitions[0];
        const home = parseTeamData(comp.competitors.find(c => c.homeAway === 'home'));
        const away = parseTeamData(comp.competitors.find(c => c.homeAway === 'away'));
        
        let tvChannel = '';
        if (comp.broadcasts && comp.broadcasts.length > 0) {
            const broadcast = comp.broadcasts.find(b => b.names && b.names.length > 0);
            if (broadcast) tvChannel = broadcast.names[0];
        }
        const firstStatus = firstEvent.status.type.shortDetail;
        const badgeContent = tvChannel ? `${firstStatus} • ${tvChannel}` : firstStatus;
        
        html += `
            <div class="ticker-item">
                <div class="team-info">
                    <div class="team-row">
                        <div class="team-left">
                            ${away.rank ? `<span class="team-rank">${away.rank}</span>` : ''}
                            ${away.logo ? `<img class="team-logo" src="${away.logo}" alt="">` : ''}
                            <span class="team-name">${away.name}</span>
                        </div>
                        <span class="score">${away.score}</span>
                    </div>
                    <div class="team-row">
                        <div class="team-left">
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

    tickerContainer.innerHTML = html;
}

function startTickerAnimation() {
    if (slideInterval) clearInterval(slideInterval);

    // Changes score every 4 seconds
    slideInterval = setInterval(() => {
        currentIndex++;
        const tickerContainer = document.getElementById('ticker-container');
        
        tickerContainer.style.transform = `translateY(-${currentIndex * 80}px)`;

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

// Initial fetch
fetchAllData();

// Refresh data every 60 seconds
setInterval(fetchAllData, 60000);
