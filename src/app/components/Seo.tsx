import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://bluefin-immo.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.jpg`;

export function Seo({
  title,
  description,
  path,
  image,
  jsonLd,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  jsonLd?: Record<string, any>;
}) {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
