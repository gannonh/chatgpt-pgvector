# Domain-specific ChatGTP Starter App

ChatGPT is great for casual, general-purpose question-answers but falls short when domain-specific knowledge is needed. Further, it makes up answers to fill its knowledge gaps and never cites its sources, so it can't really be trusted. This starter app uses embeddings coupled with vector search to solve this, or more specifically, to show how OpenAI's chat completions API can be used to create conversational interfaces to domain-specific knowledge.

Embeddings, as represented by vectors of floating-point numbers, measure the "relatedness" of text strings. These are super useful for ranking search results, clustering, classification, etc. Relatedness is measured by cosine similarity. If the cosine similarity between two vectors is close to 1, the vectors are highly similar and point in the same direction. In the case of text embeddings, a high cosine similarity between two embedding vectors indicates that the corresponding text strings are highly related.

This starter app uses embeddings to generate a vector representation of a document, and then uses vector search to find the most similar documents to the query. The results of the vector search are then used to construct a prompt. The response is then streamed to the user. Check out the Supabase blog posts on [pgvector and OpenAI embeddings](https://supabase.com/blog/openai-embeddings-postgres-vector) for more background.

Technologies used:

- Nextjs (React framework) + Vercel hosting
- Supabase (using their pgvector implementation as the vector database)
- OpenAI API (for generating embeddings and chat completions)
- TailwindCSS (for styling)

## Functional Overview

Creating and storing the embeddings:

- Web pages are scraped, stripped to plain text and split into 1000-character documents
- OpenAI's embedding API is used to generate embeddings for each document using the "text-embedding-ada-002" model
- The embeddings are then stored in a Supabase postgres table using pgvector; the table has three columns: the document text, the source URL, and the embedding vectors returned from the OpenAI API.

Responding to queries:

- A single embedding is generated from the user prompt
- That embedding is used to perform a similarity search against the vector database
- The results of the similarity search are used to construct a prompt for GPT-3.5/GPT-4
- The GPT response is then streamed to the user.

## Getting Started

The following set-up guide assumes at least basic familiarity developing web apps with React and Nextjs. Experience with OpenAI APIs and Supabase is helpful but not required to get things working.

### Set-up Supabase

- Create a Supabase account and project at https://app.supabase.com/sign-in. NOTE: Supabase support for pgvector is relatively new (02/2023), so it's important to create a new project if your project was created before then.
- First we'll enable the Vector extension. In Supabase, this can be done from the web portal through `Database` → `Extensions`. You can also do this in SQL by running:

```
create extension vector;
```

- Next let's create a table to store our documents and their embeddings. Head over to the SQL Editor and run the following query:

```sql
create table documents (
  id bigserial primary key,
  content text,
  url text,
  embedding vector (1536)
);
```

- Finally, we'll create a function that will be used to perform similarity searches. Head over to the SQL Editor and run the following query:

```sql
create or replace function match_documents (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.url,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

### Set-up local environment

- clone the repo: `gh repo clone gannonh/chatgpt-pgvector`
- open in your favorite editor (the following assumes VS Code on a Mac)

```bash
cd chatgpt-pgvector
code .
```

- install dependencies

```bash
npm install
```

- create a .env.local file in the root directory to store environment variables:

```bash
cp .env.local.example .env.local
```

- open the .env.local file and add your Supabase project URL and API key. You can find these in the Supabase web portal under `Project` → `API`. The API key should be stored in the `SUPABASE_ANON_KEY` variable and project URL should be stored under `NEXT_PUBLIC_SUPABASE_URL`.
- Add your OPENAI API key to .env.local. You can find this in the OpenAI web portal under `API Keys`. The API key should be stored in the `OPENAI_API_KEY` variable.
- [optional] environment variable `OPEAI_PROXY` be provide to enable your custom proxy of OPENAI api. Left it `""` to call official API directly.
- [optional] environment variable `SPLASH_URL` be provide to enable your [splash](https://splash.readthedocs.io/en/stable/index.html) (Splash is a javascript rendering service. It’s a lightweight web browser with an HTTP API, implemented in Python 3 using Twisted and QT5) api. Left it `""` to fetch url direct.
- Start the app

```bash
npm run dev
```

- Open http://localhost:3000 in your browser to view the app.
