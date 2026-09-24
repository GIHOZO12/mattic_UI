import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "./UI";
export default function Newsletter() {
  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <p className="eyebrow">LET’S KEEP IN TOUCH</p>
          <h2>
            A little style.
            <br />
            In your inbox.
          </h2>
        </div>
        <div>
          <p>
            Fresh pieces and considered edits. Email updates are coming soon.
          </p>
          <form
            className="newsletter-form"
            aria-label="Newsletter coming soon"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              aria-label="Email for collection updates"
              placeholder="Your email address"
              disabled
            />
            <button className="btn btn-dark" type="submit" disabled>
              Subscribe
              <ArrowUpRight size={17} />
            </button>
          </form>
          <span className="newsletter-note">
            Subscriptions are not open yet. No email addresses are collected
            here.
          </span>
          <ButtonLink to="/info/contact" variant="text">
            Contact the store
            <ArrowUpRight size={15} />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
