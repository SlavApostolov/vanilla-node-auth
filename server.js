const http = require('http');
const { Pool } = require('pg');
const crypto = require('crypto');
const captchaSessions = new Map();
const activeSessions = new Map();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'telebid_db',
    password: 'R1O2O3T4',
    port: 5432,
});

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === "/api/status" && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Server is running, PostgreSQL connected!' }));
    } else if (req.url === "/api/register" && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const parsedData = JSON.parse(body);
                const { names, email, password, captchaAnswer } = parsedData;

                if (!names || !email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'All fields are required' }));
                }

                const cookieHeader = req.headers.cookie;
                let userSessionId = null;

                if (cookieHeader) {
                    const cookies = cookieHeader.split(';');
                    for (let cookie of cookies) {
                        if (cookie.trim().startsWith('captcha_session=')) {
                            userSessionId = cookie.trim().split('=')[1];
                        }
                    }
                }

                if (!userSessionId || !captchaSessions.has(userSessionId)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Captcha session expired or missing' }));
                }

                const correctCaptchaText = captchaSessions.get(userSessionId);

                if (!captchaAnswer || captchaAnswer.toLowerCase() !== correctCaptchaText) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Incorrect CAPTCHA code' }));
                }

                captchaSessions.delete(userSessionId);

                // const salt = crypto.randomBytes(16).toString('hex');
                // const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex');
                // const finalPasswordSring = `${salt}:${hashedPassword}`;

                const finalPasswordString = hashPassword(password);

                const insertQuery = `
                INSERT INTO users (names, email, password)
                VALUES ($1, $2, $3) RETURNING id
                `;

                const values = [names, email, finalPasswordString];

                const dbResult = await pool.query(insertQuery, values);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'User registered successfully', userId: dbResult.rows[0].id }));
            } catch (error) {
                console.error(error);
                if (error.code === '23505') {
                    res.writeHead(409, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Email already exists' }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            }
        });
    } else if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {

                const parsedData = JSON.parse(body);
                const { email, password } = parsedData;

                if (!email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Email and password are required' }));
                }

                const findUSerQuery = 'SELECT * FROM users WHERE email = $1';
                const dbResult = await pool.query(findUSerQuery, [email]);

                if (dbResult.rows.length === 0) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Invalid email or password' }));
                }

                const user = dbResult.rows[0];

                const isMatch = verifyPassword(password, user.password);

                if (isMatch) {
                    const loginSessionId = crypto.randomBytes(16).toString('hex');
                    activeSessions.set(loginSessionId, user.id);

                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Set-Cookie': `auth_session=${loginSessionId}; HttpOnly; Path=/`
                    });

                    res.end(JSON.stringify({
                        message: 'Login successful',
                        user: {
                            id: user.id,
                            names: user.names,
                            email: user.email
                        }
                    }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid email or password' }));
                }
            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
    } else if (req.url === '/api/logout' && req.method === 'POST') {
        const cookieHeader = req.headers.cookies;
        let userSessionId = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';')
            for (let cookie of cookies) {
                if (cookie.trim().startsWith('auth_session=')) {
                    userSessionId = cookie.trim().split('=')[1];
                }
            }
        }

        if (userSessionId) {
            activeSessions.delete(userSessionId);
        }

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': 'auth_session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        });

        res.end(JSON.stringify({ message: 'Logged out successuflly' }));

    } else if (req.url === '/api/update' && req.method === 'POST') {
        const cookieHeader = req.headers.cookie;
        let userSessionId = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';');
            for (let cookie of cookies) {
                if (cookie.trim().startsWith('auth_session')) {
                    userSessionId = cookie.trim().split('=')[1];
                }
            }
        }

        if (!userSessionId || !activeSessions.has(userSessionId)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Unauthorized. Please log in first.' }))
        }

        const userId = activeSessions.get(userSessionId);

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const parsedData = JSON.parse(body);
                const { newName, newPassword } = parsedData;

                if (!newName || !newPassword) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    return res.end(JSON.stringify({ error: 'Name and new password are required' }))
                }

                // const salt = crypto.randomBytes(16).toString('hex');
                // const hashedPassword = crypto.scryptSync(newPassword, salt, 64).toString('hex');
                // const finalPasswordString = `${salt}:${hashedPassword}`;
                const finalPasswordString = hashPassword(newPassword);

                const updateQuery = 'UPDATE users SET names = $1, password = $2 WHERE id = $3';
                await pool.query(updateQuery, [newName, finalPasswordString, userId]);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Profile updated successfully!' }));

            } catch (error) {

                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });

    } else if (req.url.startsWith('/api/captcha') && req.method === 'GET') {
        const text = generateCaptcha();
        const svgImage = createCaptchaImage(text);

        const sessionId = crypto.randomBytes(16).toString('hex');
        captchaSessions.set(sessionId, text.toLocaleLowerCase());

        console.log(`[DEBUG] Generated CAPTCHA: "${text}" for session: ${sessionId}`);

        res.writeHead(200, {
            'Content-Type': 'image/svg+xml',
            'Set-Cookie': `captcha_session=${sessionId}; HttpOnly; Path=/`
        });
        res.end(svgImage);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// function generateCaptcha() {
//     const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let captcha = '';

//     for (let i = 0; i < 6; i++) {
//         var randomIndex = Math.floor(Math.random() * alpha.length);
//         captcha += alpha[randomIndex];
//     }
//     return captcha;
// };

function createCaptchaImage(text) {
    let svg = `<svg width="160" height="50" xmlns="http://www.w3.org/2000/svg">`;

    svg += `<rect width="100%" height="100%" fill="#eeeeee"/>`;

    for (let i = 0; i < 5; i++) {
        const x1 = Math.random() * 160;
        const y1 = Math.random() * 50;
        const x2 = Math.random() * 160;
        const y2 = Math.random() * 50;
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#888888" stroke-width="2"/>`;
    }

    for (let i = 0; i < text.length; i++) {
        const x = 20 + (i * 20);
        const y = 30 + (Math.random() * 10);
        const rotation = (Math.random() - 0.5) * 40;

        svg += `<text x="${x}" y="${y}" transform="rotate(${rotation}, ${x}, ${y})" font-family="monospace" font-size="24" font-weight="bold" fill="#333333" >${text[i]}</text>`;
    }
    svg += `</svg>`;
    return svg;
}

const { generateCaptcha, hashPassword, verifyPassword } = require('./utils.js')