const moment = require('moment-timezone');




let show= {
    date: "2021-05-27",
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
    split: true,
    real_start:"1:00 am",
    override: false
};

//console.log(show.date +' '+show.start);
//console.log(momentTZ.tz(show.date +' '+show.start, 'Europe/London').utc().format('YYYYMMDD HH:mm:ss'));

//is the show a split over midnight?
if(show.split){
    if(show.real_end === undefined){
        return false
    }else{
        show.end=formatTime(show.real_end);
        //logger.info('This show runs over midnight until:', show.end);
    }
}

start = moment.tz(show.date+' '+show.start,'Europe/London');
end = moment.tz(show.date+' '+show.end,'Europe/London');

//THIS IS WHAT NEEDS TO BE REPLACED
//start.subtract(1, 'hour');
//end.subtract(1, 'hour');


if(show.end<show.start){
    end.add(1, 'day');
}

console.log('START')
console.log('Original Formatting: ',start.format('YYYYMMDDHHmmss'));
console.log('Final Formatting: ',start.utc().format('YYYYMMDDHHmmss'));
console.log('END')
console.log('Original Formatting: ',end.format('YYYYMMDDHHmmss'));
console.log('Final Formatting: ',end.utc().format('YYYYMMDDHHmmss'));




function formatTime(inputTime) {
    console.log(inputTime)
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