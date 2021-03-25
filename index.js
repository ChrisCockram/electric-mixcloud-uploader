const express = require('express');
const FtpSvr = require ( 'ftp-srv' );
const fetch = require('node-fetch');
const moment = require('moment');


require('dotenv').config();

const app = express();
const port = process.env.SERVER_PORT;

const version = process.env.npm_package_version;

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
    console.log('request',show)
    start = new Date(show.date +' '+show.start);


    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));

    let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+process.env.RADIO_MONITOR_API+'&start_timestamp=20151110000000&end_timestamp=20151110000500';
    //console.log(rm_url);

}
getShow();
setInterval(getShow, 1000);
