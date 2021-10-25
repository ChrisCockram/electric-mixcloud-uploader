const moment = require('moment');
const momentTZ = require('moment-timezone');




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







console.log(show.date +' '+show.start);
console.log(momentTZ.tz(show.date +' '+show.start, 'Europe/London').utc().format('YYYYMMDD HH:mm:ss'));







console.log('')
console.log('')
console.log('')
console.log('')
console.log('')
console.log('')
console.log('')
console.log('')

console.log('Server Times');
console.log(new Date());
console.log(moment());
console.log('------');


//new Date().toLocaleString("en-GB", {timeZone: "Europe/London"})
console.log('Parse: ',show.date +' '+show.start)
d=new Date(show.date +' '+show.start);
console.log('Parsed: ',d);


start = moment(d);
end = moment(new Date(show.date +' '+show.end));

console.log(new Date(show.date +' '+show.end).toUTCString);
console.log(new Date(show.date +' '+show.end).toLocaleString("en-GB", {timeZone: "Europe/London"}));
//THIS IS WHAT NEEDS TO BE REPLACED
//start.subtract(1, 'hour');
//end.subtract(1, 'hour');


if(show.end<show.start){
    end.add(1, 'day');
}

console.log(d);

console.log('');
console.log('Original Formatting: ',start.format('YYYYMMDDHHmmss'));
console.log('Final Formatting: ',start.utc().format('YYYYMMDDHHmmss'));
