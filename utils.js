function generateCaptcha() {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';

    for (let i = 0; i < 6; i++) {
        var randomIndex = Math.floor(Math.random() * alpha.length);
        captcha += alpha[randomIndex];
    }
    return captcha;
};

module.exports = { generateCaptcha };