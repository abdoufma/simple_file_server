const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const UPLOAD_DIR = './uploads';

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve upload form
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>File Upload</title>
        <style>
          body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
          .upload-box { border: 2px dashed #ccc; padding: 40px; text-align: center; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
          #progress { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Upload File to Machine A</h1>
        <div class="upload-box">
          <input type="file" id="fileInput" />
          <br><br>
          <button onclick="uploadFile()">Upload</button>
        </div>
        <div id="progress"></div>

        <script>
          function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const progress = document.getElementById('progress');
            const file = fileInput.files[0];

            if (!file) {
              alert('Please select a file');
              return;
            }

            const formData = new FormData();
            formData.append('file', file);

            progress.innerHTML = 'Uploading...';

            fetch('/upload', {
              method: 'POST',
              body: formData
            })
            .then(r => r.json())
            .then(data => {
              progress.innerHTML = '<span style="color: green;">✓ ' + data.message + '</span>';
              fileInput.value = '';
            })
            .catch(err => {
              progress.innerHTML = '<span style="color: red;">✗ Upload failed: ' + err.message + '</span>';
            });
          }
        </script>
      </body>
      </html>
    `);
    return;
  }

  // Handle file upload
  if (req.method === 'POST' && req.url === '/upload') {
    let body = [];
    let filename = '';
    let boundary = '';

    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
      boundary = '--' + contentType.split('boundary=')[1];
    }

    req.on('data', chunk => {
      body.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(body);

      // Parse multipart form data
      const parts = buffer.toString('binary').split(boundary);

      for (let part of parts) {
        if (part.includes('filename=')) {
          const filenameMatch = part.match(/filename="(.+?)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }

          const dataStart = part.indexOf('\r\n\r\n') + 4;
          const dataEnd = part.lastIndexOf('\r\n');

          if (dataStart > 3 && dataEnd > dataStart) {
            const fileData = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
            const filepath = path.join(UPLOAD_DIR, filename);

            fs.writeFileSync(filepath, fileData);
            console.log(`File saved: ${filepath} (${fileData.length} bytes)`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: `File "${filename}" uploaded successfully!`,
              path: filepath,
              size: fileData.length
            }));
            return;
          }
        }
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No file found in upload' }));
    });

    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  const interfaces = os.networkInterfaces();
  console.log(`\n=== File Upload Server Started ===`);
  console.log(`\nAccess from Machine B using any of these URLs:\n`);

  for (let name of Object.keys(interfaces)) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  http://${iface.address}:${PORT}`);
      }
    }
  }

  console.log(`\nFiles will be saved to: ${path.resolve(UPLOAD_DIR)}\n`);
});
