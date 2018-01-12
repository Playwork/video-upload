var app = require('express')();
var bodyParser = require('body-parser');
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
  // ffmpeg local path : /usr/local/bin/ffmpeg
  // ffmpeg server : usr/bin/ffmpeg
  exec(`/usr/local/bin/ffmpeg -loglevel panic -y -i "${file}" -frames 1 -q:v 1 -vf fps=1,scale=535x346 ${previewBig} -frames 1 -q:v 1 -vf fps=1,scale=200x130 ${previewSmall}`,function(error, stdout, stderr){
    if (error) {
      console.log('--------err cut preview image----------', error);
    };
  });
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/upload-video', function (req, res) {
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

app.get('/delete-video', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  if(req.query.fileId) {
    const imageSmall = `${config.imagePath}/small_${req.query.fileId}.jpg`;
    const imageBig = `${config.imagePath}/big_${req.query.fileId}.jpg`;
    const video = `${config.vodPath}/${req.query.fileId}.mp4`

    console.log('---imageSmall--->>', imageSmall);
    console.log('---imageBig--->>', imageBig);

    exec(`rm -rf ${imageSmall} ${imageBig} ${video}`,function(error, stdout, stderr) {
      if (error) {
        console.log('--------err delete images and video----------', error);
      };
    });
    res.writeHead(200, { 'Connection': 'close' });
    res.end();
  } else {
    res.writeHead(403, { 'Connection': 'close' });
    res.end('Pleas check file Id');
  }
});


app.listen(port, function () {
  console.log('Starting node.js on port ' + port);
});

module.exports = app;
