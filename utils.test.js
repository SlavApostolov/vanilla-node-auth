const test = require('node:test')
const assert = require('node:assert')
const { generateCaptcha } = require('./utils');

test.describe('CAPTCHA Generator tests', () => {
    test.it('sholud generate a string that is exactly 6 characters long', () => {
        const result = generateCaptcha();

        assert.strictEqual(result.length, 6, "CAPTCHA length should be 6");
    });

    test.it('should  only contain aplpahanumeric characters', () => {
        const result = generateCaptcha();

        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(result);
        assert.strictEqual(isAlphanumeric, true, "CAPTCHA conatins invalid characters");
    });

    test.it('should generate random strings every time', () => {
        const result1 = generateCaptcha();
        const result2 = generateCaptcha();

        assert.notStrictEqual(result1, result2, "CAPTCHA is generating the same string twice!");
    });
});