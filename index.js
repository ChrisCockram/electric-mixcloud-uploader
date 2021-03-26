const express = require('express');
const FtpSvr = require ( 'ftp-srv' );
const fetch = require('node-fetch');
const moment = require('moment');
const xml2js = require ('xml2js');


require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT;

const version = process.env.npm_package_version;

processingQueue=[];

console.log('Software Version',version);

app.use(express.static('public'));
app.listen(port, () => {
    console.log(`listening on port ${port}!`)
})


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
    fetch(process.env.RADIO_API, { method: "Get" })
        .then(res => res.json())
        .then((json) => {
            //console.log(json.broadcast.current_show);
            //console.log('current_show');
            if(current_show==false){
                current_show=json.broadcast.current_show;
            }else {
                request_show(current_show);
                if(current_show.show.id != json.broadcast.current_show.show.id){
                    console.log('New Current Show!')
                    request_show(current_show);
                    current_show=json.broadcast.current_show;
                }
            }
        });
}

function request_show(show){
    start = moment(new Date(show.date +' '+show.start));
    end = moment(new Date(show.date +' '+show.end));

    if(show.end<show.start){
        end.add(1, 'day');
    }

    //console.log(moment(start).format('MMMM Do YYYY, h:mm:ss a'));

    //let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+process.env.RADIO_MONITOR_API+'&start_timestamp='+start.format('YYYYMMDDhhmmss')+'&end_timestamp='+end.format('YYYYMMDDhhmmss');

    //TESTING URL
    let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key=sgFggFgg66sHkj&start_timestamp=20210326010000&end_timestamp=20210326010100';


    fetch('http://localhost:8000/test.xml')
        .then(res => res.text())
        .then(text => {
            xml2js.parseStringPromise(text).then(function (job) {
                if(job.response.job_id !== undefined ){
                    console.log(job.response.job_id[0]);
                    show.job_id=job.response.job_id[0];
                    processingQueue.append(show);
                }else{
                    console.error('No job id found',text);
                }

            }).catch(function (err) {
                console.log('Failed to parse XML',text);
            });
        })



    console.log(rm_url);

}
getShow();
setInterval(getShow, 1000);
