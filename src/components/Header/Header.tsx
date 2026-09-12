import { useCallback, useState } from "react";
import styles from "./Header.module.scss";
import classNames from "classnames";
import { asset } from "../../shared/asset";
import { BUSINESS_PHONE } from "../../shared/phone";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Contact US", href: "#contact" },
] as const;

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles["header--desktop"]}>
        <a className={styles.logoFull} href="#home" aria-label="Gloss & Detail">
          <img src={asset("img/icons/fullLogo.svg")} alt="Gloss & Detail" />
        </a>

        <nav className={styles.desktopNav}>
          <ul className={styles.desktopNav__list}>
            {NAV_LINKS.map((link) => (
              <li key={link.href} className={styles.desktopNav__item}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.headerActions}>
          <a className={styles.phone} href={BUSINESS_PHONE.href}>
            {BUSINESS_PHONE.label}
          </a>
          <a href="#services" className={styles.button}>
            Book Now
          </a>
        </div>
      </div>

      <div className={styles["header--mobile"]}>
        <a className={styles.logoMobile} href="#home" aria-label="Gloss & Detail">
          <img src={asset("img/icons/logo.svg")} alt="Gloss & Detail" />
        </a>

        <div className={styles.burgerSide}>
          <a href="#services" className={styles.button}>
            Book Now
          </a>

          <button
            type="button"
            className={styles.toggleMenu}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <img src={asset("img/icons/Burger.svg")} alt="" />
          </button>
        </div>
      </div>

      <aside
        className={classNames(styles.menu, { [styles.active]: isMenuOpen })}
        aria-hidden={!isMenuOpen}
      >
        <div className={styles.menu__top}>
          <a
            className={styles.logoFull}
            href="#home"
            aria-label="Gloss & Detail"
            onClick={closeMenu}
          >
            <img src={asset("img/icons/fullLogo.svg")} alt="Gloss & Detail" />
          </a>

          <button
            type="button"
            onClick={toggleMenu}
            className={styles.toggleMenu}
            aria-label="Close menu"
          >
            <img src={asset("img/icons/Close.svg")} alt="" />
          </button>
        </div>

        <nav className={styles.mobileNav}>
          <ul className={styles.mobileNav__list}>
            {NAV_LINKS.map((link) => (
              <li key={link.href} className={styles.mobileNav__item}>
                <a href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className={styles.mobileNav__item}>
              <a href={BUSINESS_PHONE.href} onClick={closeMenu}>
                {BUSINESS_PHONE.label}
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </header>
  );
};
