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

require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT;

const version = process.env.npm_package_version;

let processingQueue=[];

console.log('Software Version',version);
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
        console.log(hashedPassword);
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
            response.send('<a href="https://www.mixcloud.com/oauth/authorize?client_id=HzP4JwtYJaE8skCdgv&redirect_uri=http://localhost:8000/mixcloudauth">Link Mixcloud</a>');
        } else {
            response.redirect('/');
        }
        response.end();
    } catch (error) {
        response.redirect('/');
        response.end();
        return false;
    }
});
app.get('/mixcloudauth', function(request, response) {
    console.log(request.query.code);
    try {
        if (request.session.loggedin) {
            OAUTH_CODE=request.query.code

            let url = "https://www.mixcloud.com/oauth/access_token?client_id="+process.env.MIXCLOUD_API_CLIENT_ID+"&redirect_uri=http://localhost:8000/mixcloudauth&client_secret="+process.env.MIXCLOUD_API_CLIENT_SECRET+"&code="+OAUTH_CODE;

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
    console.log(`listening on port ${port}!`)
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


let current_show=false;
//Get Current Show

function getShow(){
    if(!process.env.MIXCLOUD_API_ACCESS_TOKEN) {
        console.log('Mixcloud API not set');
        return false;
    }
    fetch(process.env.RADIO_API, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            //console.log(json.broadcast.current_show);
            //console.log('current_show');
            if(current_show==false){
                current_show=json.broadcast.current_show;
            }else {
                if(current_show.show.id != json.broadcast.current_show.show.id){
                    console.log('New Current Show!')
                    request_show(current_show);
                    current_show=json.broadcast.current_show;
                }
            }
        });
}

function request_show(show){
    if(settings.exclude.includes(show.show.id)){
        console.log('This show is on the excluded list');
        return false;
    }

    start = moment(new Date(show.date +' '+show.start));
    end = moment(new Date(show.date +' '+show.end));
    show.start_date=start;
    if(show.end<show.start){
        end.add(1, 'day');
    }

    //console.log(moment(start).format('MMMM Do YYYY, h:mm:ss a'));

    let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+process.env.RADIO_MONITOR_API+'&start_timestamp='+start.format('YYYYMMDDhhmmss')+'&end_timestamp='+end.format('YYYYMMDDhhmmss');

    //TESTING URL
    //let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key=sgFggFgg66sHkj&start_timestamp=20210326010000&end_timestamp=20210326010100';


    fetch(rm_url)
        .then(res => res.text())
        .then(text => {

            xml2js.parseStringPromise(text).then(function (job) {
                if(job.response.job_id !== undefined ){
                    show.job_id=job.response.job_id[0];
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

    //console.log(rm_url);

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
    console.log('FILE UPLOADED');
    console.log(filePath);

    let fileName = filePath.replace(/^.*[\\\/]/, '');

    console.log(path.parse(filePath).name);
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
    console.log('Uploading To Mixcloud',show);
    getArtwork(show).then( () => {
        uploadToMixcloudGo(show).then(response => {
            console.log(response);
            return true;
            if (response.data.message) {
                //console.log(response.data.message);
            }
        }).catch(error => {
            console.log(error)
        });
    })



}

const getArtwork = async (show) => {
    console.log('Get Artwork',show.show.image_url);
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
    console.log('Uploading To Mixcloud GO',show);
    try {



        let audio = process.cwd() + "/ftp/"+show.job_id+'.mp3';
        let image = process.cwd() + "/images/"+show.show.id+'.jpg';

        const formData = new FormData();

        // Append any plain string values to the request
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
        // Append any files to the request
        formData.append("mp3", fs.createReadStream(audio), { knownLength: fs.statSync(audio).size });
        formData.append("picture", fs.createReadStream(image), { knownLength: fs.statSync(image).size });

        console.log(formData);
        // Prepare additional headers for Axios, which include FormData's headers and the Content-Length
        const headers = {
            ...formData.getHeaders(),
            "Content-Length": formData.getLengthSync()
        };

        //return true;
        // Now send the request
        axios.post("https://api.mixcloud.com/upload/?access_token="+process.env.MIXCLOUD_API_ACCESS_TOKEN, formData, {headers});
    } catch (error) {
        console.error(error)
    }
}

function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

getShow();
setInterval(getShow, 1000);