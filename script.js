const API_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=200';

let gamesData = [];
let currentIndex = 0;
let slideInterval = null;

async function fetchScores() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        gamesData = data.events || [];
        
        if (gamesData.length > 0) {
            renderTickerItems();
            startTickerAnimation();
        } else {
            document.getElementById('ticker-container').innerHTML = `
                <div class="ticker-item"><span style="margin: auto;">No games scheduled for today.</span></div>
            `;
        }
    } catch (error) {
        console.error('Error fetching ESPN data:', error);
        document.getElementById('ticker-container').innerHTML = `
            <div class="ticker-item"><span style="margin: auto;">Failed to load scores.</span></div>
        `;
    }
}

function renderTickerItems() {
    const tickerContainer = document.getElementById('ticker-container');
    let html = '';

    gamesData.forEach(event => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

        const homeName = homeTeam.team.shortDisplayName;
        const homeScore = homeTeam.score ?? '0';
        const awayName = awayTeam.team.shortDisplayName;
        const awayScore = awayTeam.score ?? '0';

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
                        <span class="team-name">${awayName}</span>
                        <span class="score">${awayScore}</span>
                    </div>
                    <div class="team-row">
                        <span class="team-name">${homeName}</span>
                        <span class="score">${homeScore}</span>
                    </div>
                </div>
                <div class="status-badge">${displayStatus}</div>
            </div>
        `;
    });

    // Duplicate the first item at the end for the infinite loop illusion
    if (gamesData.length > 0) {
        const firstEvent = gamesData[0];
        const competition = firstEvent.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        
        html += `
            <div class="ticker-item">
                <div class="team-info">
                    <div class="team-row">
                        <span class="team-name">${awayTeam.team.shortDisplayName}</span>
                        <span class="score">${awayTeam.score ?? '0'}</span>
                    </div>
                    <div class="team-row">
                        <span class="team-name">${homeTeam.team.shortDisplayName}</span>
                        <span class="score">${homeTeam.score ?? '0'}</span>
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
        
        // Slide up by 80px per item
        tickerContainer.style.transform = `translateY(-${currentIndex * 80}px)`;

        // Seamless infinite loop reset
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

// Refresh data from ESPN every 60 seconds
setInterval(fetchScores, 60000);
