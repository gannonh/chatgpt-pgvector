import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
import { supabaseClient } from "@/lib/embeddings-supabase";
import * as cheerio from "cheerio";

// embedding doc sizes
const docSize: number = 1000;

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openAi = new OpenAIApi(configuration);

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  if (method === "POST") {
    const { urls } = body;
    const documents = await getDocuments(urls);

    for (const { url, body } of documents) {
      const input = body.replace(/\n/g, " ");

      console.log("\nDocument length: \n", body.length);
      console.log("\nURL: \n", url);

      const embeddingResponse = await openAi.createEmbedding({
        model: "text-embedding-ada-002",
        input
      });

      console.log("\nembeddingResponse: \n", embeddingResponse);

      const [{ embedding }] = embeddingResponse.data.data;

      // In production we should handle possible errors
      await supabaseClient.from("documents").insert({
        content: input,
        embedding,
        url
      });
    }

    return res.status(200).json({ success: true });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}

async function getDocuments(urls: string[]) {
  const documents = [];
  for (const url of urls) {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    // tag based e.g. <main>
    const articleText = $("body").text();
    // class bsaed e.g. <div class="docs-content">
    // const articleText = $(".docs-content").text();

    let start = 0;
    while (start < articleText.length) {
      const end = start + docSize;
      const chunk = articleText.slice(start, end);
      documents.push({ url, body: chunk });
      start = end;
    }
  }
  return documents;
}
