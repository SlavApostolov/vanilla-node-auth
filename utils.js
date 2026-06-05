const crypto = require('crypto')

function generateCaptcha() {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';

    for (let i = 0; i < 6; i++) {
        var randomIndex = Math.floor(Math.random() * alpha.length);
        captcha += alpha[randomIndex];
    }
    return captcha;
};

function hashPassword(plainTextPassword) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.scryptSync(plainTextPassword, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
}

function verifyPassword(plainTextPassword, storedPasswordString) {
    const [salt, storedHash] = storedPasswordString.split(':');
    const candidateHash = crypto.scryptSync(plainTextPassword, salt, 64).toString('hex');
    return candidateHash === storedHash;
}


module.exports = { generateCaptcha, hashPassword, verifyPassword };
