// صفحات السياسات: /privacy و /terms و /refund (ملف واحد). النصوص بـ lib/policies.js.
import { PolicyPage } from '../components/SiteLayout';
import { PRIVACY, TERMS, REFUND } from '../lib/policies';

const DOCS = {
  privacy: {
    doc: PRIVACY,
    description: 'How GH Couture AI collects, uses and protects your information. / كيف يجمع GH Couture AI معلوماتك ويستخدمها ويحميها.',
  },
  terms: {
    doc: TERMS,
    description: 'Terms of Service for GH Couture AI tools and digital products. / شروط استخدام أدوات ومنتجات GH Couture AI الرقمية.',
  },
  refund: {
    doc: REFUND,
    description: 'Refund Policy for GH Couture AI plans and digital products. / سياسة الاسترجاع لخطط ومنتجات GH Couture AI الرقمية.',
  },
};

export async function getStaticPaths() {
  return { paths: Object.keys(DOCS).map((doc) => ({ params: { doc } })), fallback: false };
}

export async function getStaticProps({ params }) {
  return { props: { docKey: params.doc } };
}

export default function Doc({ docKey }) {
  const d = DOCS[docKey];
  if (!d) return null;
  return <PolicyPage doc={d.doc} description={d.description} />;
}
