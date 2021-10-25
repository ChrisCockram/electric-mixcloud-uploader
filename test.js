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
    split: false,
    override: false
};

//console.log(show.date +' '+show.start);
//console.log(momentTZ.tz(show.date +' '+show.start, 'Europe/London').utc().format('YYYYMMDD HH:mm:ss'));

start = moment.tz(show.date+' '+show.start,'Europe/London');
end = moment.tz(show.date+' '+show.end,'Europe/London');


//THIS IS WHAT NEEDS TO BE REPLACED
//start.subtract(1, 'hour');
//end.subtract(1, 'hour');


if(show.end<show.start){
    end.add(1, 'day');
}
end.add(1, 'day');


console.log('Original Formatting: ',start.format('YYYYMMDDHHmmss'));
console.log('Final Formatting: ',start.utc().format('YYYYMMDDHHmmss'));
