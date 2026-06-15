const axios=require('axios'); axios.get('https://kick.com/api/v2/channels/xqc/clips').then(res => console.log(Object.keys(res.data))).catch(e=>console.log(e.message));
