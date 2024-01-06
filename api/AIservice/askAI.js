import OpenAI from "openai"
async function askAI(APIKEY,error){
    const openai=new OpenAI({apiKey: APIKEY});
    const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{"role": "user", "content": error}],
  });
  return(chatCompletion.choices[0].message);
}
export default askAI