import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
const headers = {
  headers: {
    "X-Internal-Secret": process.env.INTERNAL_API_KEY,
  },
};

export async function checkUserExist(endpoint: string) {
  try {
    const res = await axios.get(endpoint);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return { data: { success: false } };
    throw err;
  }
}

export async function userServicePost(endpoint: string, body: any) {
  try {
    const res = await axios.post(endpoint, body, headers);
    return res.data;
  } catch (err: any) {
    throw err;
  }
}
