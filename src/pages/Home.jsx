import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  PackageCheck,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { productService } from "../api/services";
import { useStore } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import {
  ButtonLink,
  ErrorState,
  Image,
  SectionHeader,
  Skeleton,
} from "../components/common/UI";
import ProductGrid from "../components/product/ProductGrid";
import Newsletter from "../components/common/Newsletter";

export default function Home() {
  const { categories, categoryState } = useStore();
  const newest = useResource("home-newest", (signal) =>
    productService.list({ ordering: "-created_at" }, signal),
  );
  const selected = useResource("home-featured", (signal) =>
    productService.list({ featured: true }, signal),
  );
  const best = useResource("home-bestsellers", (signal) =>
    productService.list(
      { best_sellers: true, ordering: "-sold_quantity" },
      signal,
    ),
  );
  const roots = categories
    .filter((category) => !category.parent)
    .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)));
  const suits = categories.find((c) => !c.parent && /suits/i.test(c.name));
  const suitLink = suits ? `/shop/${suits.slug}` : "/shop";
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-lime" />
            THE SUIT AND TIE FASHION SHOP EDIT
          </div>
          <h1>
            Style for
            <br />
            every
            <br />
            <span>occasion.</span>
          </h1>
          <p>
            For the everyday. For the extraordinary. <br />A considered
            wardrobe, made yours.
          </p>
          <div className="hero-buttons">
            <ButtonLink to="/shop">
              Shop the collection
              <ArrowUpRight size={17} />
            </ButtonLink>
            <ButtonLink to={suitLink} variant="text">
              Explore tailoring
              <ArrowRight size={16} />
            </ButtonLink>
          </div>
          <div className="hero-footnote">
            <span className="line-mark" />
            <span>GOOD CLOTHES. GREAT POSSIBILITIES.</span>
            <ArrowDown size={16} />
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="/images/editorial-hero.png"
            alt="Editorial menswear styling: an ivory linen suit in a sunlit architectural courtyard"
            eager
          />
          <div className="hero-caption">
            <span>
              THE ART OF
              <br />
              DRESSING WELL
            </span>
            <span className="hero-image-arrow">
              <ArrowUpRight size={26} />
            </span>
          </div>
          <div className="hero-image-top">A WARDROBE WITHOUT COMPROMISE</div>
        </div>
      </section>
      <div className="brand-strip container">
        <span>Thoughtfully selected.</span>
        <span>Effortlessly styled.</span>
        <span>Confidently you.</span>
        <span className="strip-note">
          THE DETAILS MAKE THE DIFFERENCE <ArrowUpRight size={16} />
        </span>
      </div>
      <section className="section container">
        <SectionHeader
          eyebrow="FIND YOUR EVERYDAY"
          title="A place for every piece."
          link="/shop"
          action="Explore all categories"
        />
        {categoryState.loading ? (
          <Skeleton />
        ) : categoryState.error ? (
          <ErrorState
            error={categoryState.error}
            retry={categoryState.reload}
          />
        ) : (
          <div className="category-grid">
            {roots.slice(0, 4).map((category, index) => (
              <Link
                to={`/shop/${category.slug}`}
                className={`category-card category-${index}`}
                key={category.id}
              >
                <div className="category-image">
                  <Image src={category.image} alt={category.name} />
                </div>
                <div>
                  <h3>{category.name}</h3>
                  <span className="round-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="section container">
        <SectionHeader
          eyebrow="FRESH PERSPECTIVES"
          title="New to your wardrobe."
          link="/shop?ordering=-created_at"
          action="Shop new arrivals"
        />
        <ProductGrid
          products={newest.data?.results?.slice(0, 4)}
          loading={newest.loading}
          error={newest.error}
          retry={newest.reload}
        />
      </section>
      <section className="editorial container">
        <div className="editorial-image">
          <Image
            src="/images/editorial-hero.png"
            alt="The texture and relaxed tailoring of an ivory linen suit"
          />
        </div>
        <div className="editorial-copy">
          <p className="eyebrow">LESS, BUT BETTER</p>
          <h2>
            The modern
            <br />
            gentleman.
          </h2>
          <p>
            Modern tailoring for work, celebrations, and everyday confidence.
            Find the pieces that feel like you — and wear them your way.
          </p>
          <ButtonLink to={suitLink} variant="dark">
            Explore the collection
            <ArrowUpRight size={18} />
          </ButtonLink>
          <span className="editorial-number">01 / THE TAILORING EDIT</span>
        </div>
      </section>
      <section className="section container">
        <SectionHeader
          eyebrow="CHOSEN WITH INTENTION"
          title="The considered edit."
          link="/shop?featured=true"
          action="Shop the edit"
        />
        <ProductGrid
          products={selected.data?.results?.slice(0, 4)}
          loading={selected.loading}
          error={selected.error}
          retry={selected.reload}
        />
      </section>
      {best.data?.count > 0 && (
        <section className="section container">
          <SectionHeader
            eyebrow="YOUR MOST-LOVED PIECES"
            title="The favorites, for a reason."
            link="/shop?best_sellers=true&ordering=-sold_quantity"
            action="Shop best sellers"
          />
          <ProductGrid
            products={best.data.results.slice(0, 4)}
            loading={best.loading}
            error={best.error}
            retry={best.reload}
          />
        </section>
      )}
      <section className="occasion-grid container">
        {[
          {
            title: "Make an impression.",
            label: "THE OCCASION EDIT",
            link: suitLink,
            image: "/images/editorial-hero.png",
          },
          {
            title: "Everyday, elevated.",
            label: "YOUR DAILY ROTATION",
            link: "/shop",
            image: "/images/shirt.png",
          },
        ].map((item) => (
          <Link className="occasion-card" to={item.link} key={item.title}>
            <Image src={item.image} alt="Editorial collection inspiration" />
            <div>
              <p className="eyebrow">{item.label}</p>
              <h2>{item.title}</h2>
              <span className="round-arrow">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </Link>
        ))}
      </section>
      <section className="benefits container">
        {[
          [
            ShieldCheck,
            "Considered menswear",
            "Good style starts with the details.",
          ],
          [Check, "Easy ordering", "Find your fit. Make it yours."],
          [Smartphone, "MTN MoMo payment", "Pay by phone. Upload your proof."],
          [PackageCheck, "Follow your order", "Stay up to date, every step."],
        ].map(([Icon, title, text]) => (
          <div key={title}>
            <Icon size={26} strokeWidth={1.25} />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>
      <Newsletter />
    </>
  );
}
