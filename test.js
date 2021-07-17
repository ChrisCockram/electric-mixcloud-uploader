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

new Date().toLocaleString("en-GB", {timeZone: "Europe/London"})
d=new Date(show.date +' '+show.start);
start = moment(d);
end = moment(new Date(show.date +' '+show.end));
if(show.end<show.start){
    end.add(1, 'day');
}

console.log(start.format('YYYYMMDDHHmmss'));
console.log(start.format('YYYYMMDDHHmmss'));
