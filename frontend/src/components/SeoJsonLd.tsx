interface OrganizationJsonLdProps {
  siteName: string;
  siteUrl: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

export function OrganizationJsonLd({
  siteName,
  siteUrl,
  logoUrl,
  phone,
  email,
}: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    ...(logoUrl && { logo: logoUrl }),
    ...(phone &&
      email && {
        contactPoint: {
          "@type": "ContactPoint",
          telephone: phone,
          contactType: "customer service",
          email: email,
          availableLanguage: ["English"],
        },
      }),
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebSiteJsonLdProps {
  siteName: string;
  siteUrl: string;
}

export function WebSiteJsonLd({ siteName, siteUrl }: WebSiteJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/home?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqPageJsonLdProps {
  faqs: FaqItem[];
}

export function FaqPageJsonLd({ faqs }: FaqPageJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
