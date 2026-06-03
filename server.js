const http = require('http');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'telebid_db',
    password: 'R1O2O3T4',
    port: 5432,
});

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
                const { names, email, password } = parsedData;

                if (!names || !email || !password) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'All fields are required' }));
                }

                const salt = crypto.randomBytes(16).toString('hex');
                const hashedPassword = crypto.scryptSync(password, salt, 64).toString('hex');
                const finalPasswordSring = `${salt}:${hashedPassword}`;

                const insertQuery = `
                INSERT INTO users (names, email, password)
                VALUES ($1, $2, $3) RETURNING id
                `;

                const values = [names, email, finalPasswordSring];

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
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
