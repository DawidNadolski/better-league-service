const TOURNAMENTS = {
    EURO2024: 'euro2024',
    WC2026: 'wc2026',
};

const ACTIVE_TOURNAMENT = process.env.ACTIVE_TOURNAMENT || TOURNAMENTS.WC2026;

function resolveTournament(tournament) {
    return tournament || ACTIVE_TOURNAMENT;
}

module.exports = { TOURNAMENTS, ACTIVE_TOURNAMENT, resolveTournament };
