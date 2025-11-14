const bcrypt = require('bcrypt');

/**
 * Function to hash password
 * @param  String pwd 	Plain password to hash
 * @return String
 */
const hashPassword = async (pwd) => {
	const saltRounds = 10;
	try {
		const salt = await bcrypt.genSalt(saltRounds);
		return await bcrypt.hash(pwd, salt);
	} catch (err) {
		console.log("hashPassword err", err);
		throw new Error(err);
	}
};

/**
 * Function to compare password
 * @param  String pwd 		Plain password
 * @param  String hashPwd  Hashed password from db
 * @return Boolean
 */
const comparePassword = async (pwd, hashPwd) => {
	try {
		return await bcrypt.compare(pwd, hashPwd);
	} catch (err) {
		console.log("comparePassword err", err);
		throw new Error(err);
	}
};

/**
 * Generate a random strong password
 * @param Number length 
 * @returns String
 */
const generatePassword = async (length = 8) => {
	let stringInclude = '';
	stringInclude += "@$!%*?&#^";
	stringInclude += '0123456789';
	stringInclude += 'abcdefghijklmnopqrstuvwxyz';
	stringInclude += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += stringInclude.charAt(Math.floor(Math.random() * stringInclude.length));
	}
	return password;
};

module.exports = { hashPassword, comparePassword, generatePassword };
