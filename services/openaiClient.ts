import * as dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
	try {
		const chatCompletion = await client.chat.completions.create({
			messages: [{ role: "user", content: "testing openai api" }],
			model: "gpt-3.5-turbo",
		});
		console.log(chatCompletion.choices[0].message.content);
	} catch (error) {
		console.error("Error testing OpenAI:", error);
	}
}

main();
