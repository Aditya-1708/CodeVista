import OpenAI from "openai"
import { openAIapikey } from "../env.js";
async function askAI(error){
    const openai=new OpenAI({apiKey: openAIapikey});
    const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{"role": "user", "content": error}],
  });
  return(chatCompletion.choices[0].message);
}
export default askAI