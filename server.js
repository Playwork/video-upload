var app = require('express')();
var bodyParser = require('body-parser');
const Busboy = require('busboy');
const inspect = require('util').inspect;
const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const Jimp = require('jimp');
const exec = require('child_process').exec;
const port = 3002;

const config = require('./config');

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
        const previewSmall = `${config.imagePath}/small_${newFileName}.jpg`;
        const previewBig = `${config.imagePath}/big_${newFileName}.jpg`;
        // local: /usr/local/bin/ffmpeg
        // server: /usr/bin/ffmpeg
        exec(`/usr/bin/ffmpeg -loglevel panic -y -i "${saveTo}" -frames 1 -q:v 1 -vf fps=1,scale=535x346 ${previewBig} -frames 1 -q:v 1 -vf fps=1,scale=200x130 ${previewSmall}`,function(error, stdout, stderr){
          if (error) {
            console.log('--------err cut preview image----------', error);
          };
          res.writeHead(200, { 'Connection': 'close', 'Content-Length': responseData.length });
          res.end(responseData);
        });
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

app.post('/upload-image', function (req, res) {
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
      console.log(mimetype);
      if (mimetype==="image/jpeg" || mimetype==="image/png" || mimetype==="image/gif") {
        const fullpath = config.imagePath;
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
        const responseData = JSON.stringify({
          filenId: newFileName,
          small: `/imgae/small_${newFileName}.jpg`,
          big: `/image/big_${newFileName}.jpg`
        });
        const previewSmall = `${config.imagePath}/small_${newFileName}.jpg`;
        const previewBig = `${config.imagePath}/big_${newFileName}.jpg`;
        // local: /usr/local/bin/ffmpeg
        // server: /usr/bin/ffmpeg
        // exec(`/usr/bin/ffmpeg -loglevel panic -y -i "${saveTo}" -frames 1 -q:v 1 -vf fps=1,scale=535x346 ${previewBig} -frames 1 -q:v 1 -vf fps=1,scale=200x130 ${previewSmall}`,function(error, stdout, stderr){
        //   if (error) {
        //     console.log('--------err cut preview image----------', error);
        //   };
        //   res.writeHead(200, { 'Connection': 'close', 'Content-Length': responseData.length });
        //   res.end(responseData);
        // });
        console.log(previewSmall);
        //small
        Jimp.read(saveTo).then(function (small) {
            small.resize(300, Jimp.AUTO)
                 .quality(80)
                 .write(previewSmall);

                 //big
                 Jimp.read(saveTo).then(function (big) {
                      big.resize(700, Jimp.AUTO)
                          .quality(80)
                          .write(previewSmall);

                          res.writeHead(200, { 'Connection': 'close', 'Content-Length': responseData.length });
                          res.end(responseData);

                 }).catch(function (err) {
                   res.writeHead(500, { Connection: 'close' });
                   res.end('please upload file image');
                 });


        }).catch(function (err) {
          res.writeHead(500, { Connection: 'close' });
          res.end('please upload file image');
        });



      } else {
        res.writeHead(500, { Connection: 'close' });
        res.end('please upload file image');
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
    res.end('ok');
  } else {
    res.writeHead(403, { 'Connection': 'close' });
    res.end('Pleas check file Id');
  }
});


app.get('/delete-image', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  if(req.query.fileId) {
    const imageSmall = `${config.imagePath}/small_${req.query.fileId}.jpg`;
    const imageBig = `${config.imagePath}/big_${req.query.fileId}.jpg`;
    const image = `${config.imagePath}/${req.query.fileId}.jpg`
    console.log(imageSmall);

    exec(`rm -rf ${imageSmall} ${imageBig} ${image}`,function(error, stdout, stderr) {
      if (error) {
        console.log('--------err delete images----------', error);
      };
    });
    res.writeHead(200, { 'Connection': 'close' });
    res.end('ok');
  } else {
    res.writeHead(403, { 'Connection': 'close' });
    res.end('Pleas check file Id');
  }
});


app.listen(port, function () {
  console.log('Starting node.js on port ' + port);
});

module.exports = app;
