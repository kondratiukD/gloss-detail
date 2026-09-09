import styles from "./Footer.module.scss";
import { asset } from "../../shared/asset";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Contact US", href: "#contact" },
] as const;

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footer__inner}>
        <a
          className={styles.footer__logo}
          href="#home"
          aria-label="Gloss & Detail"
        >
          <img src={asset("img/icons/fullLogo.svg")} alt="Gloss & Detail mobile car detailing NYC" />
        </a>

        <nav className={styles.footer__nav} aria-label="Footer">
          <ul className={styles.footer__list}>
            {LINKS.map((link) => (
              <li key={link.label}>
                <a className={styles.footer__link} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className={styles.footer__seo}>
        Gloss &amp; Detail provides mobile car detailing across New York City —
        Brooklyn, Queens, Staten Island, Long Island, and Manhattan. Book
        at-home auto detailing for interior, exterior, and full deep clean
        packages.
      </p>
    </footer>
  );
};
