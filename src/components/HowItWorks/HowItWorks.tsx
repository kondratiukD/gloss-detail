import styles from "./HowItWorks.module.scss";

const steps = [
  {
    number: "01",
    title: "View Packages",
    description: "Select the service that fits your car",
  },
  {
    number: "02",
    title: "Click Book to schedule",
    description: "Share your car, location and contact details",
  },
  {
    number: "03",
    title: "Pay After Service",
    description: "Pay only after your car detailing is complete",
  },
] as const;

export const HowItWorks: React.FC = () => {
  return (
    <section className={styles.howItWorks} aria-labelledby="how-it-works-title">
      <h2 id="how-it-works-title" className={styles.howItWorks__title}>
        How It Works:
      </h2>

      <p className={styles.howItWorks__subtitle}>
        Book mobile car detailing in NYC — we come to you
      </p>

      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.number} className={styles.step}>
            <span className={styles.step__number} aria-hidden="true">
              {step.number}
            </span>
            <h3 className={styles.step__title}>{step.title}</h3>
            <p className={styles.step__description}>{step.description}</p>
          </li>
        ))}
      </ol>

      <a href="#services" className={styles.howItWorks__button}>
        View Packages
      </a>
    </section>
  );
};
