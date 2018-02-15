var app = require('express')();
var bodyParser = require('body-parser');
const Busboy = require('busboy');
const inspect = require('util').inspect;
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const exec = require('child_process').exec;
const port = 3000;

const config = require('./config');
const smil_path = '/var/www/html/vod';
const smail_file = '.smil'

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

    res.writeHead(200, { 'Connection': 'close' });
    res.end('API upload-video');
});

app.post('/upload-video', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  if (req.method === 'POST' || req.method === 'OPTIONS') {
    const busboy = new Busboy({ headers: req.headers });
    let saveTo;
    let newFileName;
    let typeOfFile;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      // const fullpath = path.resolve(__dirname, './video');
      if (mimetype.indexOf('video') !== -1) {
        const fullpath = config.vodPath;
        typeOfFile = path.extname(filename);
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
        const responseData = JSON.stringify({`/farmsuk/smil:${newFileName}.smil/playlist.m3u8`,
          img: `/img/small_${newFileName}.jpg`,
          vodId: newFileName
        });
        const previewSmall = `${config.imagePath}/small_${newFileName}.jpg`;
        const previewBig = `${config.imagePath}/big_${newFileName}.jpg`;
        // local: /usr/local/bin/ffmpeg
        // server: /usr/bin/ffmpeg
        exec(`/usr/local/ffmpeg -loglevel panic -y -i "${saveTo}" -frames 1 -q:v 1 -vf fps=1,scale=535x346 ${previewBig} -frames 1 -q:v 1 -vf fps=1,scale=200x130 ${previewSmall}`,function(error, stdout, stderr){
          if (error) {
            console.log('--------err cut preview image----------', error);
          };
          res.writeHead(200, { 'Connection': 'close', 'Content-Length': responseData.length });
          res.end(responseData);
        });
        exec(`echo \'<?xml version="1.0" encoding="UTF-8"?>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<smil title="${newFileName}">\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<body>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<switch>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<video height="228" src="${newFileName}${typeOfFile}" systemLanguage="en" width="512">\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<param name="videoBitrate" value="640000" valuetype="data"></param>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<param name="audioBitrate" value="48000" valuetype="data"></param>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'</video>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<video height="288" src="${newFileName}${typeOfFile}" systemLanguage="en" width="512">\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<param name="videoBitrate" value="192000" valuetype="data"></param>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'<param name="audioBitrate" value="48000" valuetype="data"></param>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'</video>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'</switch>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'</body>\' >> ${smil_path}/${newFileName}${smail_file}`);
        exec(`echo \'</smil>\' >> ${smil_path}/${newFileName}${smail_file}`);

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
