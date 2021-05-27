const fetch = require('node-fetch');
const moment = require('moment');
const xml2js = require ('xml2js');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const followRedirects = require('follow-redirects');
const log4js = require("log4js");

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

logger.info(process.env.RADIO_API);
const version = process.env.npm_package_version;
logger.info('Software Version',version);
let processingQueue=[];

settings={
    "exclude":['0000','0001']
};

//Load Settings
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
function checkFTP(){
    const testFolder = './ftp/';
    const fs = require('fs');
    fs.readdirSync(testFolder).forEach(file => {
        logger.info(file);
        console.log(file);
        var fileid = file.replace(/\.[^/.]+$/, "");
        console.log(fileid);
        if(jobIdExist(fileid)){
            console.log('File Exists!');
            processFile(file);
        }
    });
}

const interval = setInterval(checkFTP, 5000);

let current_show= {
    date: "2021-05-25",
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
    let rm_url = 'http://151.80.42.167/sams/test.xml';

    logger.info(rm_url);

    fetch(rm_url)
        .then(res => res.text())
        .then(text => {

            xml2js.parseStringPromise(text).then(function (job) {
                if(job.response.job_id !== undefined ){
                    show.job_id=job.response.job_id[0];
                    show.status=false;
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

function getFilesizeInBytes(filename) {
    let stats = fs.statSync(filename);
    let fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

function processFile(filePath){
    logger.info('Checking file:'+filePath);
    let fileName = filePath.replace(/^.*[\\\/]/, '');
    logger.info(path.parse(filePath).name);
    if(path.parse(filePath).ext=='.mp3'){
        for(const show of processingQueue){
            if(show.job_id==path.parse(filePath).name){
                if(show.status==false) {
                    console.log('filefound');
                    show.status = 'Uploading';
                    show.uploadsize=getFilesizeInBytes('./ftp/'+filePath);
                    show.uploadsizecheck=0;
                    logger.info('File:'+filePath+' File Size:'+show.uploadsize+' Upload Size Check:'+show.uploadsizecheck);
                    console.log('uploadsizecheck',show.uploadsizecheck,show.uploadsize);
                }else{
                    if(show.uploadsize==getFilesizeInBytes('./ftp/'+filePath)){
                        show.uploadsizecheck=show.uploadsizecheck+1;
                        console.log('uploadsizecheck',show.uploadsizecheck,show.uploadsize);
                        logger.info('File:'+filePath+' File Size:'+show.uploadsize+' Upload Size Check:'+show.uploadsizecheck);

                    }
                    if(show.uploadsizecheck==5){
                        console.log('uploadsizecheck',show.uploadsizecheck,show.uploadsize);
                        logger.info('File:'+filePath+' File Size:'+show.uploadsize+' Upload Size Check:'+show.uploadsizecheck);
                        logger.info('File Upload Complete:'+filePath);
                        show.status='File Received';
                        uploadToMixcloud(show);
                    }
                }
            }
        }
    }else{
        logger.error('Unexpected file type'+filePath);
    }
}

const uploadToMixcloud = async (show) =>{
    logger.info('Uploading To Mixcloud',show);
    getArtwork(show).then( () => {
        uploadToMixcloudGo(show).then(response => {
            //TODO Remove this item from processingQueue
            logger.info(response);
            console.log(show);
            return true;
            if (response.data.result.success) {
                logger.info('show uploaded');
                //remove file from FTP.
                console.log('remove file!');
                try {
                    fs.unlinkSync('./ftp/'+show.job_id+'.mp3');
                    fs.unlinkSync('./images/'+show.show.id+'.jpg');
                } catch(err) {
                    console.error(err)
                }
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

        // Now send the request
        logger.info('Uploading to MixCloud');
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
//setInterval(getShow, 60000);