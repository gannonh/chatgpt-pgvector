import { AnimatePresence, motion } from "framer-motion";
import type { NextPage } from "next";
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import LoadingDots from "@/components/LoadingDots";
import ResizablePanel from "@/components/ResizablePanel";
import MetaTags from "@/components/MetaTags";
import { ReactNode } from "react";
import { PageMeta } from "../types";

import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import scss from "react-syntax-highlighter/dist/cjs/languages/prism/scss";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import markdown from "react-syntax-highlighter/dist/cjs/languages/prism/markdown";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import python from "react-syntax-highlighter/dist/cjs/languages/prism/python";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx";
import rangeParser from "parse-numeric-range";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("scss", scss);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);

interface Props {
  children: ReactNode;
  meta?: PageMeta;
}

const DocsPage: NextPage<Props> = ({ children, meta: pageMeta }: Props) => {
  const [loading, setLoading] = useState(false);
  const [userQ, setUserQ] = useState("");
  const [answer, setAanswer] = useState<String>("");

  console.log("Streamed response: ", answer);

  const question = userQ;

  const generateAnswer = async (e: any) => {
    e.preventDefault();
    if (!userQ) {
      return toast.error("Please enter a question!");
    }

    setAanswer("");
    setLoading(true);
    const response = await fetch("/api/docs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question
      })
    });
    console.log("Edge function returned.");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setAanswer((prev) => prev + chunkValue);
    }

    setLoading(false);
  };

  const syntaxTheme = oneDark;

  const MarkdownComponents: object = {
    code({
      node,
      inline,
      className,
      ...props
    }: {
      node: { data: { meta: string } };
      inline: boolean;
      className: string;
    } & Record<string, unknown>): ReactNode {
      const match = /language-(\w+)/.exec(className || "");
      const hasMeta = node?.data?.meta;

      const applyHighlights: object = (applyHighlights: number) => {
        if (hasMeta) {
          const RE = /{([\d,-]+)}/;
          const metadata = node.data.meta?.replace(/\s/g, "");
          const strlineNumbers = RE?.test(metadata)
            ? RE?.exec(metadata)![1]
            : "0";
          const highlightLines = rangeParser(strlineNumbers);
          if (highlightLines.includes(applyHighlights)) {
            return { className: "highlight" };
          }
        }
        return {};
      };

      const children =
        typeof props.children === "string" || Array.isArray(props.children)
          ? props.children
          : "";

      return match ? (
        <SyntaxHighlighter
          style={syntaxTheme}
          language={match[1]}
          PreTag="div"
          className="codeStyle"
          showLineNumbers={true}
          wrapLines={hasMeta ? true : false}
          useInlineStyles={true}
          lineProps={applyHighlights}
          {...props}
        >
          {children}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props} />
      );
    }
  };

  return (
    <>
      <MetaTags
        title="Webdev Answerbot"
        description="Web Developer answer-bot trained on Supabase, Nextjs, React, TailwindCSS."
        cardImage="/bot/docs-og.png"
        url="https://twc.astro-labs.app/supa"
      />
      <div className="flex flex-col items-center justify-center min-h-screen py-2 mx-auto">
        <main className="flex flex-col items-center justify-center flex-1 w-full px-4 mt-12 text-center sm:mt-20">
          <h1 className="max-w-xl text-2xl font-bold sm:text-4xl">
            Ask me anything<sup>*</sup> about web development!
          </h1>
          <div className="w-full max-w-xl">
            <textarea
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              rows={4}
              className="w-full p-2 my-5 border rounded-md shadow-md bg-neutral border-neutral-focus "
              placeholder={"e.g. What are edge functions?"}
            />

            {!loading && (
              <button
                className="w-full px-4 py-2 mt-2 font-mediu btn btn-primary"
                onClick={(e) => generateAnswer(e)}
              >
                Ask your question &rarr;
              </button>
            )}
            {loading && (
              <button
                className="w-full px-4 py-2 mt-2 font-mediu btn btn-primary"
                disabled
              >
                <LoadingDots color="white" style="xl" />
              </button>
            )}
            <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{ duration: 2000 }}
            />
            <ResizablePanel>
              <AnimatePresence mode="wait">
                <motion.div className="my-10 space-y-10">
                  {answer && (
                    <>
                      <div>
                        <h2 className="mx-auto text-3xl font-bold sm:text-4xl">
                          Here is your answer:{" "}
                        </h2>
                      </div>
                      {answer.split("SOURCES:").map((splitanswer, index) => {
                        return (
                          <div
                            className={`p-4 transition bg-neutral border border-neutral-focus shadow-md rounded-xl overflow-x-auto max-w-xl ${
                              index === 0
                                ? "hover:border-accent-focus cursor-copy text-left"
                                : ""
                            }`}
                            onClick={() => {
                              if (index === 0) {
                                navigator.clipboard.writeText(splitanswer);
                                toast("Copied to clipboard!", {
                                  icon: "✂️"
                                });
                              }
                            }}
                            key={index}
                          >
                            {index === 0 ? (
                              <p>
                                <ReactMarkdown components={MarkdownComponents}>
                                  {splitanswer.trim()}
                                </ReactMarkdown>
                              </p>
                            ) : (
                              <>
                                <p>SOURCES:</p>
                                <ul>
                                  {splitanswer
                                    .trim()
                                    .split("\n")
                                    .filter((url) => url.trim().length > 0)
                                    .map((url) =>
                                      url.includes("http") ? (
                                        <li key={url}>
                                          <a
                                            className="underline text-accent"
                                            target="_blank"
                                            href={url}
                                          >
                                            {url}
                                          </a>
                                        </li>
                                      ) : (
                                        <li key={url}>{url}</li>
                                      )
                                    )}
                                </ul>
                              </>
                            )}
                            <style>
                              {`
                              p {
                                margin-bottom: 20px;
                              }
                            `}
                            </style>
                          </div>
                        );
                      })}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </ResizablePanel>

            <div className="max-w-xl text-xs">
              <p>
                <sup>*</sup>Actually, I'm currently only trained on the
                following documentation:
              </p>
              <ul>
                <li>
                  <a target="_blank" href="">
                    https://beta.reactjs.org/
                  </a>
                </li>
                <li>
                  <a target="_blank" href="">
                    https://supabase.com/docs
                  </a>
                </li>
                <li>
                  <a target="_blank" href="">
                    https://tailwindcss.com/docs
                  </a>
                </li>
                <li>
                  <a target="_blank" href="">
                    https://nextjs.org/docs
                  </a>
                </li>
                <li>
                  <a target="_blank" href="">
                    https://beta.nextjs.org/docs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DocsPage;
