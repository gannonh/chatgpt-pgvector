// components/PageMeta.tsx
import Head from "next/head";

interface Props {
  title: string;
  description: string;
  cardImage: string;
  url: string;
}

const MetaTags = ({ title, description, cardImage, url }: Props) => (
<Head>
        <title>{title}</title>
        <meta name="robots" content="follow, index" />
        <meta content={description} name="description" />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={cardImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@gannonh" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={cardImage} />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="57x57"
          href="/bot/apple-touch-icon-57x57.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="114x114"
          href="/bot/apple-touch-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="72x72"
          href="/bot/apple-touch-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="144x144"
          href="/bot/apple-touch-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="60x60"
          href="/bot/apple-touch-icon-60x60.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="120x120"
          href="/bot/apple-touch-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="76x76"
          href="/bot/apple-touch-icon-76x76.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="152x152"
          href="/bot/apple-touch-icon-152x152.png"
        />
        <link
          rel="icon"
          type="image/png"
          href="/bot/favicon-196x196.png"
          sizes="196x196"
        />
        <link
          rel="icon"
          type="image/png"
          href="/bot/favicon-96x96.png"
          sizes="96x96"
        />
        <link
          rel="icon"
          type="image/png"
          href="/bot/favicon-32x32.png"
          sizes="32x32"
        />
        <link
          rel="icon"
          type="image/png"
          href="/bot/favicon-16x16.png"
          sizes="16x16"
        />
        <link
          rel="icon"
          type="image/png"
          href="/bot/favicon-128.png"
          sizes="128x128"
        />
        <meta name="application-name" content="&nbsp;" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta
          name="msapplication-TileImage"
          content="/bot/mstile-144x144.png"
        />
        <meta
          name="msapplication-square70x70logo"
          content="/bot/mstile-70x70.png"
        />
        <meta
          name="msapplication-square150x150logo"
          content="/bot/mstile-150x150.png"
        />
        <meta
          name="msapplication-wide310x150logo"
          content="/bot/mstile-310x150.png"
        />
        <meta
          name="msapplication-square310x310logo"
          content="/bot/mstile-310x310.png"
        />
      </Head>
)

export default MetaTags;