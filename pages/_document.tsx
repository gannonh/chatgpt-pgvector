import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="bg-[url('/images/background.png')] bg-no-repeat bg-cover">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
