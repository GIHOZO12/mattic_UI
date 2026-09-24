import { useParams } from "react-router-dom";
import { useStore } from "../context/AppContext";
import { ButtonLink, PageHeading } from "../components/common/UI";

const pages = {
  about: {
    title: "A wardrobe with intention.",
    eyebrow: "ABOUT SUIT AND TIE FASHION SHOP",
    text: "We believe getting dressed should feel considered, comfortable and entirely your own. Explore modern tailoring, daily essentials and the small details that bring a look together.",
  },
  delivery: {
    title: "From our store to your door.",
    eyebrow: "DELIVERY",
    text: "Enter your address at checkout to see your final delivery charge. Your order is prepared after the store manually verifies your MTN Mobile Money payment. You can follow confirmed, processing, shipped and delivered updates in My orders. Guest orders are available in the browser used at checkout. Contact the store for delivery availability and timing before placing an urgent order.",
  },
  "size-guide": {
    title: "Good style. The right fit.",
    eyebrow: "FINDING YOUR SIZE",
    text: "Available sizes are shown on each product, together with the colors and combinations currently in stock. Sizing can vary by garment and brand. Check the product description and contact the store for specific chest, waist, inseam or shoe measurements before ordering. We do not publish generic measurements as garment-specific advice.",
  },
  returns: {
    title: "Let’s make it right.",
    eyebrow: "RETURNS & ORDER HELP",
    text: "Contact the store with your order number and the issue you need help with. A store-specific return period and eligibility policy has not yet been published here; confirm the conditions before ordering. Returns and refunds are handled directly by the store, and cannot be requested or completed automatically on this website.",
  },
  terms: {
    title: "A clear understanding.",
    eyebrow: "ORDERING INFORMATION",
    text: "Prices, stock, discounts and final delivery costs are confirmed by the store at checkout. Orders await manual payment verification before fulfillment. Your submitted screenshot is proof for review, not automatic payment confirmation. Store-specific legal terms have not yet been published; contact the store if you need additional conditions before ordering.",
  },
  privacy: {
    title: "Your details, considered.",
    eyebrow: "PRIVACY INFORMATION",
    text: "Your account, delivery details, orders and payment screenshots are used to handle purchases and customer service. Payment screenshots are accessible only through your account or private guest browser session and to authorized store administrators. Sign-in sessions are kept in your browser tab and cleared when you sign out. Guest order access is saved in this browser until its site data is cleared. Contact the store for privacy requests. A complete store-specific privacy policy, including retention periods, must be published before launch.",
  },
  contact: {
    title: "A good conversation starts here.",
    eyebrow: "HERE TO HELP",
    text: "Questions about a piece, your fit or an existing order? Contact the store using the details below. Include your order number when asking about a purchase.",
  },
};
export default function Info() {
  const { page } = useParams();
  const { settings } = useStore();
  const content = pages[page];
  return (
    <div className="container page-space info-page">
      <PageHeading
        eyebrow={content?.eyebrow || "SUIT AND TIE FASHION SHOP"}
        title={content?.title || "This page is not here."}
      />
      <div className="info-copy">
        <p>{content?.text || "The page you’re looking for may have moved."}</p>
        {settings?.support_email && (
          <a href={`mailto:${settings.support_email}`}>
            {settings.support_email}
          </a>
        )}
        {settings?.support_phone && (
          <a href={`tel:${settings.support_phone}`}>{settings.support_phone}</a>
        )}
        {page === "contact" &&
          !settings?.support_email &&
          !settings?.support_phone && (
            <p className="muted">
              Contact details have not yet been published by the store.
            </p>
          )}
        <ButtonLink variant="outline" to="/shop">
          Explore the collection
        </ButtonLink>
      </div>
    </div>
  );
}
