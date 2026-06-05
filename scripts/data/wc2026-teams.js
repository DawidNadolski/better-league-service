const { TOURNAMENTS } = require('../../constants/tournaments');
const COUNTRY_CODES = require('./team-country-codes');

const TEAMS = [
    { name: 'Meksyk', group: 'A' },
    { name: 'Korea Południowa', group: 'A' },
    { name: 'RPA', group: 'A' },
    { name: 'Czechy', group: 'A' },

    { name: 'Kanada', group: 'B' },
    { name: 'Szwajcaria', group: 'B' },
    { name: 'Katar', group: 'B' },
    { name: 'Bośnia i Hercegowina', group: 'B' },

    { name: 'Brazylia', group: 'C' },
    { name: 'Maroko', group: 'C' },
    { name: 'Szkocja', group: 'C' },
    { name: 'Haiti', group: 'C' },

    { name: 'USA', group: 'D' },
    { name: 'Paragwaj', group: 'D' },
    { name: 'Australia', group: 'D' },
    { name: 'Turcja', group: 'D' },

    { name: 'Niemcy', group: 'E' },
    { name: 'Curaçao', group: 'E' },
    { name: 'Wybrzeże Kości Słoniowej', group: 'E' },
    { name: 'Ekwador', group: 'E' },

    { name: 'Holandia', group: 'F' },
    { name: 'Japonia', group: 'F' },
    { name: 'Tunezja', group: 'F' },
    { name: 'Szwecja', group: 'F' },

    { name: 'Belgia', group: 'G' },
    { name: 'Egipt', group: 'G' },
    { name: 'Iran', group: 'G' },
    { name: 'Nowa Zelandia', group: 'G' },

    { name: 'Hiszpania', group: 'H' },
    { name: 'Urugwaj', group: 'H' },
    { name: 'Arabia Saudyjska', group: 'H' },
    { name: 'Republika Zielonego Przylądka', group: 'H' },

    { name: 'Francja', group: 'I' },
    { name: 'Senegal', group: 'I' },
    { name: 'Norwegia', group: 'I' },
    { name: 'Irak', group: 'I' },

    { name: 'Argentyna', group: 'J' },
    { name: 'Algieria', group: 'J' },
    { name: 'Austria', group: 'J' },
    { name: 'Jordania', group: 'J' },

    { name: 'Portugalia', group: 'K' },
    { name: 'Kolumbia', group: 'K' },
    { name: 'Uzbekistan', group: 'K' },
    { name: 'DR Kongo', group: 'K' },

    { name: 'Anglia', group: 'L' },
    { name: 'Chorwacja', group: 'L' },
    { name: 'Ghana', group: 'L' },
    { name: 'Panama', group: 'L' },
];

module.exports = TEAMS.map((team) => ({
    ...team,
    tournament: TOURNAMENTS.WC2026,
    countryCode: COUNTRY_CODES[team.name],
}));
