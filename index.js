const express = require('express');
const FtpSvr = require ( 'ftp-srv' );
const fetch = require('node-fetch');
const moment = require('moment');
const xml2js = require ('xml2js');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const session = require('express-session');
const bodyParser = require('body-parser');
const FormData = require('form-data');
const followRedirects = require('follow-redirects');
const log4js = require("log4js");
const readLastLines = require('read-last-lines');

followRedirects.maxRedirects = 10;
followRedirects.maxBodyLength = 500 * 1024 * 1024 * 1024; // 500 GB

require('dotenv').config();

log4js.configure({
    appenders: {
        everything: { type: 'file', filename: 'output.log' }
    },
    categories: {
        default: { appenders: [ 'everything' ], level: 'debug' }
    }
});
const logger = log4js.getLogger();

const app = express();
const port = process.env.SERVER_PORT;

logger.info(port);
logger.info(FTP_PORT);
logger.info(RADIO_API);

const version = process.env.npm_package_version;

let processingQueue=[];


logger.info('Software Version',version);
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.post('/auth', function(request, response) {
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        hashedPassword=crypto.createHash('sha256').update(password).digest('hex');
        logger.info(hashedPassword);
        if(hashedPassword === process.env.LOGIN_PASSWORD && username === process.env.LOGIN_USERNAME){
            request.session.loggedin = true;
            request.session.username = username;
            response.redirect('/admin');
        }else{
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});
app.get('/admin', function(request, response) {
    try {
        if (request.session.loggedin) {

            readLastLines.read('output.log', 50)
                .then((lines) =>{
                    const log = fs.readFileSync('output.log', 'utf8')
                    let html ='<h1>Electric MixCloud Uploader</h1>';
                    html+='<br><a href="https://www.mixcloud.com/oauth/authorize?client_id=HzP4JwtYJaE8skCdgv&redirect_uri=http://mixcloud.electricradio.co.uk/mixcloudauth">Link Mixcloud</a>';
                    html+='<br><br><textarea style="width:800px; height: 400px;">'+log+'</textarea>';
                    response.send(html);
                    response.end();

                });

        } else {
            response.redirect('/');
            response.end();

        }
    } catch (error) {
        response.redirect('/');
        response.end();
        return false;
    }
});
app.get('/mixcloudauth', function(request, response) {
    logger.info(request.query.code);
    try {
        if (request.session.loggedin) {
            OAUTH_CODE=request.query.code
            let url = "https://www.mixcloud.com/oauth/access_token?client_id="+process.env.MIXCLOUD_API_CLIENT_ID+"&redirect_uri=http://mixcloud.electricradio.co.uk/mixcloudauth&client_secret="+process.env.MIXCLOUD_API_CLIENT_SECRET+"&code="+OAUTH_CODE;
            fetch(url, { method: "Get" })
                .then(res => res.json())
                .then((json) => {
                    if(json.access_token != undefined){
                        process.env.MIXCLOUD_API_ACCESS_TOKEN = json.access_token;
                        response.send(process.env.MIXCLOUD_API_ACCESS_TOKEN);
                        response.end();
                    }else{
                        response.send('Error getting Access Token');
                        response.end();
                    }

                });
        } else {
            response.send('Please login to view this page!');
            response.end();
        }
    } catch (error) {
        response.send('Please login to view this page!');
        response.end();
        return false;
    }
});
app.use(express.static('public'));
app.listen(port, () => {
    logger.info(`listening on port ${port}!`)
    logger.info(port);
    logger.info(process.env.SERVER_PORT);
})

settings={
    "exclude":['0000','0001']
};
function readData(){
    if(fs.existsSync('settings.json')){
        fs.readFile('settings.json', (err, data) => {
            if (err) throw err;
            settings = JSON.parse(data);

        });
    }
}
readData();

//FTP
const hostname = '0.0.0.0';
const server = new FtpSvr({
    url: 'ftp://' + hostname + ':' + process.env.FTP_PORT,
    pasv_min: process.env.FTP_PORT,
    greeting: ['Welcome', 'to', 'the', 'jungle!'],
    file_format: 'ep',
});

server.on('login', ({ connection, username, password }, resolve, reject) => {
    if (username === process.env.FTP_USERNAME && password === process.env.FTP_PASSWORD) {
        resolve({root: __dirname+'/ftp'});

        // If connected, add a handler to confirm file uploads
        connection.on('STOR', (error, fileName) => {
            if (error) {
                console.error(`FTP server error: could not receive file ${fileName} for upload ${error}`);
            }
            processFile(fileName);
            console.info(`FTP server: upload successfully received - ${fileName}`);
        });
        resolve();
    } else {
        reject(new Error('Unable to authenticate with FTP server: bad username or password'));
    }
});
server.listen();


let current_show= {
    date: "2021-03-29",
    start: "10:00",
    end: "11:00",
    show: {
        id: 9360,
        name: "Electric Anthems",
        slug: "anthems",
        url: "https://electricradio.co.uk/show/anthems/",
        latest: "",
        website: "",
        hosts: [ ],
        producers: [ ],
        genres: [
            "Classic House"
        ],
        languages: [ ],
        avatar_url: "https://electricradio.co.uk/wp-content/uploads/2020/04/electric-anthems-150x150.jpg",
        image_url: "https://electricradio.co.uk/wp-content/uploads/2020/04/electric-anthems-150x150.jpg",
        route: "https://electricradio.co.uk/wp-json/radio/shows/?show=anthems",
        feed: "https://electricradio.co.uk/feed/shows/?show=anthems"
    },
    encore: false,
    split: false,
    override: false
};

//current_show=false;
//Get Current Show

function getShow(){
    if(!process.env.MIXCLOUD_API_ACCESS_TOKEN) {
        logger.info('Mixcloud API not set');
        return false;
    }
    fetch(process.env.RADIO_API, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            //logger.info(json.broadcast.current_show);
            //logger.info('current_show');
            if(current_show==false){
                current_show=json.broadcast.current_show;
            }else {
                if(current_show.show.id != json.broadcast.current_show.show.id){
                    logger.info('New Current Show!')
                    request_show(current_show);
                    current_show=json.broadcast.current_show;
                }
            }
        });
}

function request_show(show){
    logger.info('Requesting', show);
    if(settings.exclude.includes(show.show.id)){
        logger.info('This show is on the excluded list');
        return false;
    }

    start = moment(new Date(show.date +' '+show.start));
    end = moment(new Date(show.date +' '+show.end));
    show.start_date=start;
    if(show.end<show.start){
        end.add(1, 'day');
    }

    //logger.info(moment(start).format('MMMM Do YYYY, h:mm:ss a'));

    //let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+process.env.RADIO_MONITOR_API+'&start_timestamp='+start.format('YYYYMMDDhhmmss')+'&end_timestamp='+end.format('YYYYMMDDhhmmss');

    //TESTING URL;
    let rm_url = 'http://localhost:8000/test.xml';

    logger.info(rm_url);
    
    fetch(rm_url)
        .then(res => res.text())
        .then(text => {

            xml2js.parseStringPromise(text).then(function (job) {
                if(job.response.job_id !== undefined ){
                    show.job_id=job.response.job_id[0];
                    logger.info('RM JobID',show.job_id);
                    if(!jobIdExist(job.response.job_id[0])){
                        processingQueue.push(show);
                    }else{
                        console.error('Job ID already exists',job.response.job_id[0]);
                    }
                }else{
                    console.error('No job id found',text);
                }

            }).catch(function (err) {
                console.error('Failed to parse XML',text);
            });
        })

    //logger.info(rm_url);

}

function jobIdExist(job_id){
    for (const show of processingQueue){
        if(show.job_id==job_id){
            return true;
        }
    }
    return false;
}

function processFile(filePath){
    logger.info('FILE UPLOADED');
    logger.info(filePath);
    let fileName = filePath.replace(/^.*[\\\/]/, '');
    logger.info(path.parse(filePath).name);
    if(path.parse(filePath).ext=='.mp3'){

        for(const show of processingQueue){
            if(show.job_id==path.parse(filePath).name){
                //is there a jingle to add?
                uploadToMixcloud(show);
            }
        }
        console.error('job_id not matched');
    }else{
        console.error('Unexpected file type');
    }
}

const uploadToMixcloud = async (show) =>{
    logger.info('Uploading To Mixcloud',show);
    getArtwork(show).then( () => {
        uploadToMixcloudGo(show).then(response => {
            //TODO Remove this item from processingQueue
            logger.info(response);
            return true;
            if (response.data.result.success) {
                logger.info('show uploaded');
            }else{
                logger.info('Error uploading show');
            }
        }).catch(error => {
            logger.info(error)
        });
    })
}

const getArtwork = async (show) => {
    logger.info('Get Artwork',show.show.image_url);
    const imgPath = path.resolve(__dirname, 'images', show.show.id+'.jpg');
    let urlf = show.show.image_url;
    let url = urlf.replace("-150x150", "");

    const writer = fs.createWriteStream(imgPath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })

    //TODO Download Artwork
}




const uploadToMixcloudGo = async (show) => {
    logger.info('Uploading To Mixcloud GO',show);
    try {
        let audio = process.cwd() + "/ftp/"+show.job_id+'.mp3';
        let image = process.cwd() + "/images/"+show.show.id+'.jpg';
        const formData = new FormData();
        formData.append("name", show.show.name+' '+start.format('DD.MM.YYYY'));
        formData.append("description", show.show.url);
        i=0;
        for (const genre of show.show.genres){
            if(i==5){
                break;
            }
            formData.append("tags-"+i+"-tag", genre);
            i++;
        }
        formData.append("mp3", fs.createReadStream(audio), { knownLength: fs.statSync(audio).size });
        formData.append("picture", fs.createReadStream(image), { knownLength: fs.statSync(image).size });
        const headers = {
            ...formData.getHeaders(),
            "Content-Length": formData.getLengthSync()
        };

        //return true;
        // Now send the request
        return axios.post("https://api.mixcloud.com/upload/?access_token="+process.env.MIXCLOUD_API_ACCESS_TOKEN, formData, {headers});
    } catch (error) {
        console.error(error)
    }
}

function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

getShow();
//setInterval(getShow, 1000);