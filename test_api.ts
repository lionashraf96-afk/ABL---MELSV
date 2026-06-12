import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/tiktok-hashtag');
    console.log("Success:", res.data);
  } catch (err: any) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

test();
