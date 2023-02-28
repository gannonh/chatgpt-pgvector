import { supabaseClient } from "@/lib/embeddings-supabase";
import { OpenAIStream, OpenAIStreamPayload } from "@/utils/OpenAIStream";
import { oneLine, stripIndent } from "common-tags";
import GPT3Tokenizer from "gpt3-tokenizer";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("req.method ", req.method);
    return new Response("ok", { headers: corsHeaders });
  }

  const { question } = (await req.json()) as {
    question?: string;
  };

  if (!question) {
    return new Response("No prompt in the request", { status: 400 });
  }

  const query = question;

  // OpenAI recommends replacing newlines with spaces for best results
  const input = query.replace(/\n/g, " ");
  // console.log("input: ", input);

  const apiKey = process.env.OPENAI_API_KEY;

  const embeddingResponse = await fetch(
    "https://api.openai.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input,
        model: "text-embedding-ada-002"
      })
    }
  );

  const embeddingData = await embeddingResponse.json();
  const [{ embedding }] = embeddingData.data;
  // console.log("embedding: ", embedding);

  const { data: documents, error } = await supabaseClient.rpc(
    "match_documents",
    {
      query_embedding: embedding,
      similarity_threshold: 0.1, // Choose an appropriate threshold for your data btwn 0 and 1
      match_count: 10 // Choose the number of matches
    }
  );

  if (error) console.error(error);

  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  let tokenCount = 0;
  let contextText = "";

  // console.log("documents: ", documents);

  // Concat matched documents
  if (documents) {
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const content = document.content;
      const url = document.url;
      const encoded = tokenizer.encode(content);
      tokenCount += encoded.text.length;

      // Limit context to max 1500 tokens (configurable)
      if (tokenCount > 1500) {
        break;
      }

      contextText += `${content.trim()}\nSOURCE: ${url}\n---\n`;
    }
  }


  // console.log("contextText: ", contextText);

  const prompt = stripIndent`${oneLine`
  You are a very enthusiastic support representative who loves
  to help people! Given the following sections and their source URLs from the 
  documentation sources, answer the question using only that information,
  outputted in markdown format. Include code snippets if relevant. If you are unsure and the answer
  is not explicitly written in the documentation, say
  "Sorry, I don't know how to help with that."  If the context sections include 
  source URLs include them under the SOURCES heading at the end of your response. Always include all of the relevant source urls 
  from the context sections. Never list a URL more than once. Never include URLs that are not in the context sections.`}
  
  Context sections:
  Next.js is a React framework for creating production-ready web applications. It provides a variety of methods for fetching data, a built-in router, and a Next.js Compiler for transforming and minifying JavaScript code. It also includes a built-in Image Component and Automatic Image Optimization for resizing, optimizing, and serving images in modern formats.
  SOURCE: nextjs.org/docs/faq
  
  Question: 
  what is nextjs?    
  
  Answer as markdown, including related code snippets if available: 
  Next.js is a framework for building production-ready web applications using React. It offers various data fetching options, comes equipped with an integrated router, and features a Next.js compiler for transforming and minifying JavaScript. Additionally, it has an inbuilt Image Component and Automatic Image Optimization that helps resize, optimize, and deliver images in modern formats.
  
  \`\`\`js
  function HomePage() {
    return <div>Welcome to Next.js!</div>
  }
  
  export default HomePage
  \`\`\`
  
  SOURCES:
  https://nextjs.org/docs/faq
  
  
  Context sections:
  ${contextText}
  
  Question: """
  ${query}
  """
  
  Answer as markdown, including related code snippets if available:
  `;

  console.log("prompt: ", prompt);

  const payload: OpenAIStreamPayload = {
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 2000,
    stream: true,
    n: 1
  };

  const stream = await OpenAIStream(payload);
  return new Response(stream);
};

export default handler;
