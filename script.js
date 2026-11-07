let currentQuery = 'groups=80'; // Default to All FBS
let gamesData = [];
let currentIndex = 0;
let slideInterval = null;

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
                return comp.competitors.some(c => c.curRank && c.curRank <= 25);
            });
        } else if (currentQuery === 'live') {
            events = events.filter(event => event.status.type.state === 'in');
        }

        gamesData = events;
        currentIndex = 0; // Reset scroll index on refresh/filter change

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
        console.error('Error fetching ESPN data:', error);
        document.getElementById('ticker-container').innerHTML = `
            <div class="ticker-item"><span style="margin: auto;">Failed to load scores.</span></div>
        `;
    }
}

function changeFilter() {
    const selectElement = document.getElementById('filter-select');
    currentQuery = selectElement.value;
    fetchScores();
}

function parseTeamData(competitor) {
    const name = competitor.team.shortDisplayName || competitor.team.name;
    const score = competitor.score ?? '0';
    const logo = competitor.team.logo || '';
    
    // Extract ranking reliably from ESPN payload
    let rank = '';
    if (competitor.curRank && competitor.curRank <= 25) {
        rank = `#${competitor.curRank}`;
    } else if (competitor.rank && competitor.rank <= 25) {
        rank = `#${competitor.rank}`;
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

        let displayStatus = statusDetail;
        if (statusType === 'pre') {
            displayStatus = event.status.type.shortDetail; // e.g., "7:30 PM"
        }

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
                <div class="status-badge">${displayStatus}</div>
            </div>
        `;
    });

    // Duplicate first item for seamless infinite loop
    if (gamesData.length > 0) {
        const firstEvent = gamesData[0];
        const comp = firstEvent.competitions[0];
        const home = parseTeamData(comp.competitors.find(c => c.homeAway === 'home'));
        const away = parseTeamData(comp.competitors.find(c => c.homeAway === 'away'));
        
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
                <div class="status-badge">${firstEvent.status.type.shortDetail}</div>
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
fetchScores();

// Refresh data every 60 seconds
setInterval(fetchScores, 60000);
