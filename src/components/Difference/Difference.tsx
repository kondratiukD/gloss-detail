import { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { asset } from "../../shared/asset";
import styles from "./Difference.module.scss";

const SLIDES = [
  {
    id: 1,
    src: asset("img/Group-1.jpg"),
    alt: "Rear seats before and after detailing",
  },
  {
    id: 2,
    src: asset("img/Group-2.jpg"),
    alt: "Interior before and after detailing",
  },
  {
    id: 3,
    src: asset("img/Group-3.jpg"),
    alt: "Door sill before and after detailing",
  },
  {
    id: 4,
    src: asset("img/Group-4.jpg"),
    alt: "Engine bay before and after detailing",
  }
] as const;

const GAP = 16;

export const Difference: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const maxIndex = SLIDES.length - 1;
  const cardWidth = viewportWidth;

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(maxIndex, current + 1));
  }, [maxIndex]);

  const goTo = useCallback(
    (slideIndex: number) => {
      setIndex(Math.min(Math.max(slideIndex, 0), maxIndex));
    },
    [maxIndex],
  );

  return (
    <section className={styles.difference} aria-labelledby="difference-title">
      <h2 id="difference-title" className={styles.difference__title}>
        See the Difference
      </h2>
      <p className={styles.difference__subtitle}>
        Explore real results from our mobile detailing services
      </p>

      <div className={styles.carousel}>
        <button
          type="button"
          className={styles.carousel__arrow}
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous results"
        >
          <img src={asset("img/icons/Arrow-left.svg")} alt="" />
        </button>

        <div className={styles.carousel__viewport} ref={viewportRef}>
          <ul
            className={styles.carousel__track}
            style={{
              transform: `translateX(-${index * (cardWidth + GAP)}px)`,
            }}
          >
            {SLIDES.map((slide) => (
              <li
                key={slide.id}
                className={styles.card}
                style={{
                  width: cardWidth || undefined,
                  flex: `0 0 ${cardWidth}px`,
                }}
              >
                <div className={styles.card__media}>
                  <img
                    className={styles.card__image}
                    src={slide.src}
                    alt={slide.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.card__labelBefore}>Before</span>
                  <span className={styles.card__labelAfter}>After</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className={styles.carousel__arrow}
          onClick={goNext}
          disabled={index === maxIndex}
          aria-label="Next results"
        >
          <img src={asset("img/icons/Arrow-right.svg")} alt="" />
        </button>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Gallery pages">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Go to result ${slideIndex + 1}`}
            className={classNames(styles.dots__item, {
              [styles["dots__item--active"]]: slideIndex === index,
            })}
            onClick={() => goTo(slideIndex)}
          />
        ))}
      </div>
    </section>
  );
};
