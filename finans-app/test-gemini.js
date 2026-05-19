const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAfbO3ioVesgQr8PLvsrh_5f7pt6ffeRAk");
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  try {
    const result = await model.generateContent("Test prompt");
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}
run();
