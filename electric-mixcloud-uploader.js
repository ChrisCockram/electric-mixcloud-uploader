const fetch = require('node-fetch');
const moment = require('moment-timezone');
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
const version = process.env.npm_package_version;
logger.info('Software Version',version);
let processingQueue=[];

let settings={
    include: [],
    "OFFSET_SIGN":0,
    "OFFSET_SECONDS":0
};

//Load Settings
function readData(){
    if(fs.existsSync('settings.json')){
        fs.readFile('settings.json', (err, data) => {
            if (err){
                logger.info(err);
                throw err;
            }
            settings = JSON.parse(data);
        });
    }else {
    }
}
readData();

const settingInterval = setInterval(readData, 5000);


//FTP
function checkFTP(){
    logger.info('FTP Check')
    const testFolder = './ftp/';
    const fs = require('fs');
    fs.readdirSync(testFolder).forEach(file => {
        let fileid = file.replace(/\.[^/.]+$/, "");
        console.log(fileid);
        logger.info('File found - ',file)
        if(jobIdExist(fileid)){
            logger.info('Job matched - ',fileid)
            processFile(file);
        }
    });
}
const checkFTPInterval = setInterval(checkFTP, 30000);

let current_show=false;
//Get Current Show
function getShow(){
    if(!settings.MIXCLOUD_API_ACCESS_TOKEN) {
        logger.info('Mixcloud API not set');
        return false;
    }
    fetch(settings.RADIO_API, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
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
    logger.info('Requesting', show.show.name);
    if(!show.upload_to_mixcloud){
        logger.info('This show is not to be uploaded to mixcloud');
        return false;
    }

    //is the show a split over midnight?
    if(show.split){
        if(show.real_end === undefined){
            logger.error('show.real_end is undefined');
            return false
        }else{
            show.end=formatTime(show.real_end);
            logger.info('This show runs over midnight until:', show.end);
        }
    }

    start = moment.tz(show.date+' '+show.start,'Europe/London');
    end = moment.tz(show.date+' '+show.end,'Europe/London');

    if(parseInt(settings.OFFSET_SIGN)===0){
        start.subtract(parseInt(settings.OFFSET_SECONDS), 'seconds');
        end.subtract(parseInt(settings.OFFSET_SECONDS), 'seconds');
    }else{
        start.add(parseInt(settings.OFFSET_SECONDS), 'seconds');
        end.add(parseInt(settings.OFFSET_SECONDS), 'seconds');
    }

    show.start_date=start;
    if(show.end<show.start){
        end.add(1, 'day');
    }
    logger.info(new Date(show.date +' '+show.start));
    logger.info(new Date(show.date +' '+show.end));
    logger.info(start.utc().format('YYYYMMDDHHmmss'));
    let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+settings.RADIO_MONITOR_API+'&start_timestamp='+start.utc().format('YYYYMMDDHHmmss')+'&end_timestamp='+end.utc().format('YYYYMMDDHHmmss');
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
}

function formatTime(inputTime) {
    // Split the input time into hours, minutes, and period (am/pm)
    const [timePart, period] = inputTime.split(' ');
  
    // Split the timePart into hours and minutes
    const [hours, minutes] = timePart.split(':');
  
    // Parse the hours and minutes as integers
    const hoursInt = parseInt(hours);
    const minutesInt = parseInt(minutes);
  
    // Format hours with leading zero if necessary
    const formattedHours = (hoursInt < 10 ? '0' : '') + hoursInt;
  
    // Format minutes with leading zero if necessary
    const formattedMinutes = (minutesInt < 10 ? '0' : '') + minutesInt;
  
    // Combine the formatted parts into the desired format
    const formattedTime = `${formattedHours}:${formattedMinutes}`;
  
    return formattedTime;
}

function jobIdExist(job_id){
    for (const show of processingQueue){
        if(show.job_id==job_id){
            return true;
        }
    }
    return false;
}

function fileExists(filePath){
    try {
        if (fs.existsSync(filePath)) {
            return true;
        }
    } catch(err) {
        return false
    }
}

function removeFromProcessingQueue(job_id){
    for (var i = processingQueue.length - 1; i >= 0; i--) {
        if (processingQueue[i]['job_id'] === job_id) {
            processingQueue.splice(i, 1);
        }
    }
}

function getFilesizeInBytes(filename) {
    if(!fileExists(filename)){
        return false;
    }
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
                    //console.log('filefound');
                    show.status = 'Uploading';
                    show.uploadsize=getFilesizeInBytes('./ftp/'+filePath);
                    show.uploadsizecheck=0;
                    logger.info('File:'+filePath+' File Size:'+show.uploadsize+' Upload Size Check:'+show.uploadsizecheck);
                    //console.log('uploadsizecheck',show.uploadsizecheck,show.uploadsize);
                }else{
                    //console.log('Status isnt false');
                    //console.log('uploadsizecheck>',show.uploadsizecheck,show.uploadsize,getFilesizeInBytes('./ftp/'+filePath));

                    if(show.uploadsize==getFilesizeInBytes('./ftp/'+filePath)){
                        show.uploadsizecheck=show.uploadsizecheck+1;
                        //console.log('uploadsizecheck',show.uploadsizecheck,show.uploadsize);
                        logger.info('File:'+filePath+' File Size:'+show.uploadsize+' Upload Size Check:'+show.uploadsizecheck);

                    }else{
                        show.uploadsize=getFilesizeInBytes('./ftp/'+filePath);
                    }
                    if(show.uploadsizecheck==5){
                        //console.log('uploadsizecheck',show.uploadsizecheck,show.uploadsize);
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
    logger.info('Uploading To Mixcloud',show.show.name);
    getArtwork(show).then( () => {
        uploadToMixcloudGo(show).then(response => {
            logger.info(response);
            console.log(show);
            if (response.data.result.success) {
                logger.info('show uploaded');
                removeFromProcessingQueue(show.job_id);
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
    logger.info('Uploading To Mixcloud GO',show.show.name);
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
        //return true;
        return axios.post("https://api.mixcloud.com/upload/?access_token="+settings.MIXCLOUD_API_ACCESS_TOKEN, formData, {headers});
    } catch (error) {
        console.error(error)
    }
}

function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

function processLog(){
    const fileName = 'output.log';
    const maxLines = 5000;
    // Read the file asynchronously and get the data and error
    fs.readFile(fileName, 'utf8', (error, data) => {
        // If there is an error, log it and exit
        if (error) {
            logger.error('Unable access '+fileName);
            return;
        }
        // Split the data by newline characters and get the number of lines
        const lines = data.split('\n');
        const numLines = lines.length;

        // If the number of lines is greater than the maximum, remove the first n lines
        if (numLines > maxLines) {
            const n = numLines - maxLines;
            lines.splice(0, n);
            // Join the remaining lines by newline characters and get the new data
            const newData = lines.join('\n');

            // Write the new data to the file asynchronously and get the error
            fs.writeFile(fileName, newData, 'utf8', (error) => {
                // If there is an error, log it and exit
                if (error) {
                    logger.error('Unable to shorten to the log file.');

                    return;
                }
                // Log a success message
            });
        } else {
            // Log a message that no changes are needed
        }
    });
}
processLog();

setTimeout(getShow, 3000);

setInterval(getShow, 60000);
setInterval(processLog, 70000);

function heartbeat(){
    logger.info('Heartbeat');
}
heartbeat();
setInterval(heartbeat, 3600000);
