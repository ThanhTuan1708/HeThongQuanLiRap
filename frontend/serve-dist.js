import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.FRONTEND_PORT || 5173);

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8'
};

const sendFile = (response, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(response);
};

const server = http.createServer((request, response) => {
    const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(distDir, safePath);

    if (requestPath === '/') {
        filePath = path.join(distDir, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return sendFile(response, filePath);
    }

    const fallbackFile = path.join(distDir, 'index.html');
    if (fs.existsSync(fallbackFile)) {
        return sendFile(response, fallbackFile);
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Frontend build not found.');
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Frontend static server running at http://localhost:${port}`);
});
