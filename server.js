const http = require('http');
const router = require('routes')();
const Busboy = require('busboy');
const inspect = require('util').inspect;
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const exec = require('child_process').exec;
const port = 3002;

const config = require('./config');

const previewImage = (file, filename) => {
  const previewSmall = `${config.imagePath}/small_${filename}.jpg`;
  const previewBig = `${config.imagePath}/big_${filename}.jpg`;
  // /usr/local/bin/ffmpeg
  exec(`/usr/bin/ffmpeg -loglevel panic -y -i "${file}" -frames 1 -q:v 1 -vf fps=1,scale=535x346 ${previewBig} -frames 1 -q:v 1 -vf fps=1,scale=200x130 ${previewSmall}`,function(error, stdout, stderr){
    if (error) {
      console.log('--------err cut preview image----------', error);
    };
  });
};

router.addRoute('/upload-video', function (req, res, params) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  if (req.method === 'POST' || req.method === 'OPTIONS') {
    const busboy = new Busboy({ headers: req.headers });
    let saveTo;
    let newFileName;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      // const fullpath = path.resolve(__dirname, './video');
      if (mimetype.indexOf('video') !== -1) {
        const fullpath = config.vodPath;
        const typeOfFile = path.extname(filename);
        newFileName = uuid.v1();
        saveTo = path.join(fullpath, path.basename(`${newFileName}${typeOfFile}`));
        
        file.pipe(fs.createWriteStream(saveTo));
      } else {
        file.on('data', function(data) { });
        file.on('end', function() {
          console.log('--------end of upload error-----------');
        });
      }
    });
    busboy.on('finish', function() {
      if(saveTo) {
        const returnPath = saveTo.split('html');
        const responseData = JSON.stringify({
          url: returnPath[1],
          vodId: newFileName
        });
        previewImage(saveTo, newFileName);
        res.writeHead(200, { 'Connection': 'close', 'Content-Length': responseData.length });
        res.end(responseData);
      } else {
        res.writeHead(500, { Connection: 'close' });
        res.end('please upload file video');
      }
    });
    return req.pipe(busboy);

  } else {
    res.writeHead(500, { Connection: 'close' });
    res.end('some thing wrong, please check you data');
  }
});
 
const server = http.createServer(function (req, res) {
  const match = router.match(req.url);
  if (match) match.fn(req, res, match.params);
});
 
server.listen(port, function () {
  console.log('start on port ' + port);
});
