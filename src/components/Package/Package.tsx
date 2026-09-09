import { useCallback, useState } from "react";
import { BookingModal, type BookingPackage } from "../BookingModal";
import styles from "./Package.module.scss";

type PackageCard = BookingPackage & {
  note?: string;
  priceSuffix?: string;
  features: readonly string[];
};

const PACKAGES: PackageCard[] = [
  {
    id: "maintenance detail",
    name: "MAINTENANCE DETAIL",
    price: 149,
    priceSuffix: "/suv + $30",
    note: "*For vehicles with light dirt",
    features: [
      "Hand wash and foam treatment",
      "Wheels and tires cleaned",
      "Glass & trim detail",
      "Full interior vacuum & wipedown",
      "Tire dressing",
    ],
  },
  {
    id: "deep clean",
    name: "Deep Clean",
    price: 249,
    priceSuffix: "/suv + $30",
    features: [
      "Everything in maintenance plus: ",
      "Interior Deep Clean",
      "Shampoo & Condition Leather Seats",
      "Clay-bar decontamination",
      "Iron decon & spray sealant",
    ],
  },
  {
    id: "exterior",
    name: "Exterior",
    price: 89,
    priceSuffix: "/suv + $30",
    features: [
     "Hand wash and foam treatment",
      "Wheels and tires cleaned",
      "Glass & trim detail",
      "Bug removal & spray sealant",
      "Tire dressing finish",
    ]
  },
  {
    id: "interior",
    name: "Interior",
    price: 179,
    priceSuffix: "/suv + $30",
    features: [
      "Shampoo & Condition Leather Seats",
      "Deep Vacuum Cabin & Trunk",
      "Clean Interior Glass",
      "Dash, console & door panels",
      "Seats, carpets & mats cleaned",
    ],
  },
];

export const Package: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<BookingPackage | null>(
    null,
  );

  const openModal = useCallback((item: BookingPackage) => {
    setSelectedPackage(item);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedPackage(null);
  }, []);

  return (
    <section
      id="services"
      className={styles.packages}
      aria-labelledby="packages-title"
    >
      <h2 id="packages-title" className={styles.packages__title}>
        Choose Your Detailing Package
      </h2>
      <p className={styles.packages__subtitle}>
        Mobile car detailing packages for NYC — interior, exterior, and deep
        clean options delivered to your location
      </p>

      <ul className={styles.packages__list}>
        {PACKAGES.map((item) => (
          <li key={item.id} className={styles.card}>
            <h3 className={styles.card__name}>{item.name}</h3>
            {item.note ? (
              <p className={styles.card__note}>{item.note}</p>
            ) : null}
            <p className={styles.card__price}>
              <span className={styles.card__priceValue}>${item.price}</span>
              {item.priceSuffix ? (
                <span className={styles.card__priceSuffix}>
                  {item.priceSuffix}
                </span>
              ) : null}
            </p>

            <ul className={styles.card__features}>
              {item.features.map((feature) => (
                <li key={feature} className={styles.card__feature}>
                  <img
                    className={styles.card__icon}
                    src="/img/icons/Arrow-right-dark.svg"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    width={16}
                    height={16}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.card__button}
              onClick={() =>
                openModal({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                })
              }
            >
              Book Now
            </button>
          </li>
        ))}
      </ul>

      <BookingModal
        selectedPackage={selectedPackage}
        onClose={closeModal}
      />
    </section>
  );
};
