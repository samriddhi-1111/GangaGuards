const http = require('http');

const payload = JSON.stringify({
    role: "NORMAL_USER",
    name: "Test User",
    username: "testuser_" + Date.now()
});

// Create a fake JWT token
const jwtPayload = Buffer.from(JSON.stringify({
    uid: "testUid_" + Date.now(),
    user_id: "testUid_" + Date.now(),
    email: "test@example.com",
    name: "Test User"
})).toString('base64');

const token = `fakeHeader.${jwtPayload}.fakeSignature`;

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/bootstrap',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(payload);
req.end();
