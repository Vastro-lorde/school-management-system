const http = require('http');

http.get('http://localhost:3000', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const match = data.match(/<link[^>]*rel="icon"[^>]*>/i) || data.match(/<link[^>]*rel="shortcut icon"[^>]*>/i);
        if (match) {
            console.log('Found favicon link:', match[0]);
        } else {
            console.log('No favicon link found in HTML.');
            // Print first 500 chars to see what we got
            console.log('HTML start:', data.substring(0, 500));
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
