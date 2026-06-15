import axios from "axios";
const username = "xqc";
const scraperApiKey = process.env.SCRAPERAPI_KEY;
let apiUrl = `https://kick.com/api/v2/channels/${username}/clips`;
if (scraperApiKey) {
   apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(apiUrl)}`;
}
axios.get(apiUrl).then(res => console.log(Object.keys(res.data))).catch(e => console.log(e.response?.status || e.message));
