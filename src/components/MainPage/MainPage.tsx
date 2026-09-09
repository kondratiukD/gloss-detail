import styles from "./MainPage.module.scss";
import { asset } from "../../shared/asset";

export const MainPage: React.FC = () => {
  return (
    <section id="home" className={styles.hero} aria-label="Hero">
      <div className={styles.hero__content}>
        <h1 className={styles.hero__title}>
          Premium Mobile Car Detailing in NYC
        </h1>

        <p className={styles.hero__subtitle}>
          Professional interior &amp; exterior auto detailing delivered to your
          home or office across New York
        </p>

        <p className={styles.hero__location}>
          <img
            className={styles.hero__locationIcon}
            src={asset("img/icons/icon-map.svg")}
            alt=""
            aria-hidden="true"
          />
          <span>
            Brooklyn, Queens, Staten Island, Long Island
          </span>
        </p>

        <div className={styles.hero__actions}>
          <a href="#contact" className={styles.hero__book}>
            Request a Quote
          </a>
          <a href="#services" className={styles.hero__packages}>
            View Packages
          </a>
        </div>
      </div>
    </section>
  );
};
