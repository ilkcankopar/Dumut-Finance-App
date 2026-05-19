import { GoogleGenerativeAI } from "@google/generative-ai";
import {config} from './app.config';
import {logger} from './logger.config';


if(!config.ai.geminiKey){
    logger.warn('Gemini Api Key tanımlanmamış');
} else {
    logger.info('Gemini Api Key yapılandırıldı');
}


const genAI = new GoogleGenerativeAI(config.ai.geminiKey ??  "");

export const geminiFlash = genAI.getGenerativeModel({
model : 'gemini-3.1-flash-lite',
generationConfig : {
temperature : 0.1,
topP : 0.95,
maxOutputTokens : 512
}
});

export const geminiPro = genAI.getGenerativeModel({
model : "gemini-3.1-flash-lite",
generationConfig : {
temperature : 0.7,
topP : 0.95,
maxOutputTokens : 1024
}
})