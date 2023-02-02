import axios, { type AxiosResponse } from 'axios';
const url = 'http://checkip.amazonaws.com';

export const myIp: string = await (async (): Promise<string> => {
  try {
    const data: AxiosResponse<string> = await axios(url);
    return data.data.trim();
  } catch (err) {
    console.log(err);
    return 'failed to url from top-level-await';
  }
})();
