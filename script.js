const API_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=200';

async function fetchScores() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        parseGames(data.events);
    } catch (error) {
        console.error('Error fetching ESPN data:', error);
        document.getElementById('ticker-container').innerHTML = '<div class="ticker-item">Failed to load scores.</div>';
    }
}

function parseGames(events) {
    const tickerContainer = document.getElementById('ticker-container');
    if (!events || events.length === 0) {
        tickerContainer.innerHTML = '<div class="ticker-item">No games scheduled for today.</div>';
        return;
    }

    let tickerHTML = '';

    events.forEach(event => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

        const homeName = homeTeam.team.shortDisplayName;
        const homeScore = homeTeam.score;
        const awayName = awayTeam.team.shortDisplayName;
        const awayScore = awayTeam.score;

        const statusType = event.status.type.state; // 'pre', 'in', 'post'
        const statusDetail = event.status.type.detail; // e.g. "Halftime", "4th Qtr 2:15"

        let displayStatus = statusDetail;
        if (statusType === 'pre') {
            displayStatus = event.status.type.shortDetail; // Game time e.g. "7:30 PM"
        }

        tickerHTML += `
            <div class="ticker-item">
                ${awayName} ${awayScore} @ ${homeName} ${homeScore} 
                <span class="status">[${displayStatus}]</span>
            </div>
        `;
    });

    // Duplicate content to create a seamless infinite loop effect
    tickerContainer.innerHTML = tickerHTML + tickerHTML;
}

// Initial fetch
fetchScores();

// Auto-refresh scores every 30 seconds
setInterval(fetchScores, 30000);
