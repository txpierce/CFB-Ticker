body {
    font-family: Arial, sans-serif;
    background-color: #120f0d;
    color: #e6dfd5;
    margin: 0;
    padding: 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
}

/* Single-Line Top Bar */
.top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 650px;
    margin-bottom: 15px;
    padding: 0 5px;
}

/* ESPN-style bold athletic header */
.top-bar h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    background: linear-gradient(135deg, #f5f0eb 20%, #d97706 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}

/* Subtle Filter Dropdown */
.top-bar select {
    background-color: #1a1412;
    color: #bfa181;
    border: 1px solid #3d2c22;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    outline: none;
    transition: all 0.2s ease;
}

.top-bar select:hover {
    border-color: #d97706;
    color: #f5f0eb;
}

/* Vertical Ticker Box Container */
.ticker-wrap {
    width: 100%;
    max-width: 650px;
    height: 80px; /* Locked to exact card height */
    overflow: hidden;
    background-color: #181210;
    border-radius: 6px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8);
    border-top: 2px solid #b45309;
    border-bottom: 2px solid #b45309;
    position: relative;
    cursor: pointer;
}

.ticker-wrap:hover::after {
    content: "Click for Game Details";
    position: absolute;
    bottom: 4px;
    right: 8px;
    font-size: 10px;
    color: #8c7355;
    background: rgba(0,0,0,0.6);
    padding: 2px 6px;
    border-radius: 3px;
    pointer-events: none;
}

/* The rolling list container */
.ticker {
    display: flex;
    flex-direction: column;
    transition: transform 0.6s ease-in-out;
}

/* Individual Score Item - Fixed strictly to 80px */
.ticker-item {
    height: 80px;
    min-height: 80px;
    max-height: 80px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    font-size: 15px;
    font-weight: bold;
    box-sizing: border-box;
}

.team-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-grow: 1;
    margin-right: 20px;
}

.team-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.team-left {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
}

.star-btn {
    background: none;
    border: none;
    color: #4a3b32;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
}

.star-btn.favorited {
    color: #f59e0b;
}

.team-logo {
    width: 20px;
    height: 20px;
    object-fit: contain;
    flex-shrink: 0;
}

.team-rank {
    font-size: 12px;
    color: #d97706;
    font-weight: bold;
    min-width: 18px;
}

.team-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
}

.score {
    color: #10b981;
    font-family: monospace;
    font-size: 16px;
    font-weight: bold;
}

.status-badge {
    background-color: #211915;
    border: 1px solid #3d2c22;
    padding: 6px 10px;
    border-radius: 4px;
    color: #d97706;
    font-size: 11px;
    text-transform: uppercase;
    text-align: center;
    min-width: 115px;
    flex-shrink: 0;
}

/* Flash alert styling when a team scores */
.score-flash {
    color: #ef4444 !important;
    animation: pulseScore 1s infinite alternate;
}

@keyframes pulseScore {
    0% { opacity: 1; }
    100% { opacity: 0.4; }
}

/* Modal Popup Window */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.85);
    align-items: center;
    justify-content: center;
}

.modal-content {
    background-color: #181210;
    border: 1px solid #3d2c22;
    padding: 25px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
    color: #f5f0eb;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8);
}

.close-btn {
    color: #8c7355;
    position: absolute;
    top: 15px;
    right: 20px;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.close-btn:hover {
    color: #f5f0eb;
}
