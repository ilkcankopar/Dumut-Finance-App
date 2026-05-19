import { sesliAsistanService } from './src/modules/sesli-asistan/sesli-asistan.service';

async function main() {
  try {
    const result = await sesliAsistanService.metinKomutIsle("50 lira kahve aldım", "dbfb5a5f-3e36-4c80-a84b-27be596709d2");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
