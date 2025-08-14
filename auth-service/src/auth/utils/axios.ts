import axios from "axios";

export async function checkUserExist(endpoint: string){
  try {
    const res = await axios.get(endpoint);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return {data :{ success : false}};
    throw err;
  }
}

export async function userServicePost(endpoint: string, body : any){
  try {
    const res = await axios.post(endpoint, body);
    return res.data;
  } catch (err: any) {
	throw err
  }
}