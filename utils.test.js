const test = require('node:test');
const assert = require('node:assert');
const { generateCaptcha, hashPassword, verifyPassword } = require('./utils');

test.describe('CAPTCHA Generator Tests', () => {
    test.it('should generate a string that is exactly 6 characters long', () => {
        const result = generateCaptcha();
        assert.strictEqual(result.length, 6, "CAPTCHA length should be 6");
    });

    test.it('should only contain alphanumeric characters', () => {
        const result = generateCaptcha();
        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(result);
        assert.strictEqual(isAlphanumeric, true, "CAPTCHA contains invalid characters");
    });

    test.it('should generate random strings every time', () => {
        const result1 = generateCaptcha();
        const result2 = generateCaptcha();
        assert.notStrictEqual(result1, result2, "CAPTCHA is generating the same string twice!");
    });
});

test.describe('Password Security Tests', () => {
    test.it('should securely hash a password into a salt:hash format', () => {
        const plainPassword = "MySuperSecretPassword123";
        const result = hashPassword(plainPassword);

        assert.notStrictEqual(result, plainPassword, "Password was not hashed!");
        assert.strictEqual(result.includes(':'), true, "Hash string is missing the salt separator");
    });

    test.it('should successfully verify the correct password', () => {
        const plainPassword = "MySuperSecretPassword123";
        const savedDatabaseString = hashPassword(plainPassword);
        const isMatch = verifyPassword(plainPassword, savedDatabaseString);

        assert.strictEqual(isMatch, true, "Failed to verify the correct password");
    });

    test.it('should reject an incorrect password', () => {
        const plainPassword = "MySuperSecretPassword123";
        const savedDatabaseString = hashPassword(plainPassword);

        const isMatch = verifyPassword("MySuperSecretPassword124", savedDatabaseString);

        assert.strictEqual(isMatch, false, "WARNING: Incorrect password was accepted!");
    });
});