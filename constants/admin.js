const User = require('../models/user');

const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'Dawid')
	.split(',')
	.map((name) => name.trim())
	.filter(Boolean);

function isAdminUser(name) {
	return !!name && ADMIN_USERNAMES.includes(name);
}

async function requireAdmin(req) {
	if (!req.isAuth || !req.userId) {
		throw new Error('User not authenticated');
	}

	let userName = req.userName;
	if (!userName) {
		const user = await User.findById(req.userId);
		if (!user) {
			throw new Error('User not authenticated');
		}
		userName = user.name;
	}

	if (!isAdminUser(userName)) {
		throw new Error('Brak uprawnień administratora!');
	}
}

module.exports = { ADMIN_USERNAMES, isAdminUser, requireAdmin };
