// const globalSetup = async (): Promise<void> => {
const globalSetup = (): void => {
  process.env.TZ = 'Asia/Tokyo';
  process.env.LANG = 'ja_JP.UTF-8';
};
export default globalSetup;
