const WINNER_PICK_POINTS = 10;

function calculateWinnerPoints(winningTeam) {
    if (winningTeam && winningTeam.didWin) {
        return WINNER_PICK_POINTS;
    }
    return 0;
}

module.exports = { WINNER_PICK_POINTS, calculateWinnerPoints };
