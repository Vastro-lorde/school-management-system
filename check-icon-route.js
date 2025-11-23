const http = require('http');

http.get('http://localhost:3000/icon', (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
}).on('error', (err) => {
    console.error('Error:', err.message);
});
