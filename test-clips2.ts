import axios from "axios";
const username = "xqc";
const scraperApiKey = process.env.SCRAPERAPI_KEY;
let apiUrl = `https://kick.com/api/v2/channels/${username}/clips`;
if (scraperApiKey) {
   apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(apiUrl)}`;
}
axios.get(apiUrl).then(res => {
   if (res.data.clips && res.data.clips.length > 0) {
      console.log(JSON.stringify(res.data.clips[0], null, 2));
   } else {
      console.log("No clips found");
   }
}).catch(e => console.log(e.response?.status || e.message));
