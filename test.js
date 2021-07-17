const moment = require('moment');
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

start = moment.utc(new Date(show.date +' '+show.start));
start2 = moment(new Date(show.date +' '+show.start));
end = moment.utc(new Date(show.date +' '+show.end));
show.start_date=start;
if(show.end<show.start){
    end.add(1, 'day');
}
let rm_url = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+'&start_timestamp='+start.format('YYYYMMDDHHmmss')+'&end_timestamp='+end.format('YYYYMMDDHHmmss');
let rm_url2 = 'http://radiomonitor.com/api/thisiselectric/?action=create_job&key='+'&start_timestamp='+start2.format('YYYYMMDDHHmmss')+'&end_timestamp='+end.format('YYYYMMDDHHmmss');
console.log(rm_url);
console.log(rm_url2);