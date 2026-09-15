import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import {
  digitsOnly,
  formatPhoneInput,
  isNonEmpty,
  isValidModelYear,
  isValidPhone,
  saveBooking,
} from "../../shared/formStorage";
import { notifyBooking } from "../../shared/formNotify";
import { fetchBusyIntervals, insertBooking } from "../../shared/bookingApi";
import {
  addMonths,
  buildCandidateSlots,
  buildMonthGrid,
  formatBookingDateLabel,
  formatDateKey,
  formatSlotRangeLabel,
  getPackageDurationMinutes,
  isDateKeyBeforeToday,
  type BusyInterval,
  type SlotOption,
  wallTimeInZoneToUtc,
} from "../../shared/bookingSlots";
import { isSupabaseConfigured } from "../../shared/supabase";
import { asset } from "../../shared/asset";
import styles from "./BookingModal.module.scss";

export type BookingPackage = {
  id: string;
  name: string;
  price: number;
};

type BookingModalProps = {
  selectedPackage: BookingPackage | null;
  onClose: () => void;
};

type FormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  carMake: string;
  modelYear: string;
};

type FormErrors = Partial<
  Record<keyof FormValues | "agreed" | "schedule", string>
>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  carMake: "",
  modelYear: "",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const FIELDS: {
  name: keyof FormValues;
  placeholder: string;
  type: string;
  autoComplete: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}[] = [
  {
    name: "firstName",
    placeholder: "First Name",
    type: "text",
    autoComplete: "given-name",
  },
  {
    name: "lastName",
    placeholder: "Last Name",
    type: "text",
    autoComplete: "family-name",
  },
  {
    name: "phone",
    placeholder: "Phone Number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
  },
  {
    name: "address",
    placeholder: "Street address, City, Zip code",
    type: "text",
    autoComplete: "street-address",
  },
  { name: "carMake", placeholder: "Car Make", type: "text", autoComplete: "off" },
  {
    name: "modelYear",
    placeholder: "Model Year",
    type: "text",
    autoComplete: "off",
    inputMode: "numeric",
  },
];

function validate(
  values: FormValues,
  agreed: boolean,
  dateKey: string | null,
  slot: SlotOption | null,
): FormErrors {
  const errors: FormErrors = {};

  if (!isNonEmpty(values.firstName)) errors.firstName = "First name is required";
  if (!isNonEmpty(values.lastName)) errors.lastName = "Last name is required";
  if (!isValidPhone(values.phone)) errors.phone = "Enter a valid 10-digit phone";
  if (!isNonEmpty(values.address)) {
    errors.address = "Street address, city, and zip code are required";
  }
  if (!isNonEmpty(values.carMake)) errors.carMake = "Car make is required";
  if (!isValidModelYear(values.modelYear)) {
    errors.modelYear = "Enter a valid year (1980–next year)";
  }
  if (!dateKey || !slot) {
    errors.schedule = "Please select a date and time";
  }
  if (!agreed) errors.agreed = "Please agree to the Privacy Policy";

  return errors;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  selectedPackage,
  onClose,
}) => {
  const titleId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activePackage, setActivePackage] = useState<BookingPackage | null>(
    null,
  );

  const todayParts = useMemo(() => {
    const key = formatDateKey(new Date());
    const [year, month] = key.split("-").map(Number);
    return { year, month };
  }, []);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  useEffect(() => {
    if (selectedPackage) {
      setActivePackage(selectedPackage);
      setIsVisible(true);
      setIsClosing(false);
      setIsSuccess(false);
      setIsSubmitting(false);
      setSubmitError("");
      setAgreed(false);
      setValues(INITIAL_VALUES);
      setErrors({});
      setCalendarOpen(false);
      setSelectedDateKey(null);
      setSelectedSlot(null);
      setSlotsError("");
      setViewYear(todayParts.year);
      setViewMonth(todayParts.month);
      return;
    }

    if (!isVisible) return;
    setIsClosing(true);
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setActivePackage(null);
      setIsSuccess(false);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [selectedPackage, isVisible, todayParts.month, todayParts.year]);

  useEffect(() => {
    if (!isVisible || isClosing) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isVisible, isClosing, onClose]);

  useEffect(() => {
    if (!isVisible || !activePackage) return;

    if (!isSupabaseConfigured()) {
      setSlotsError(
        "Booking calendar requires Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
      );
      setBusy([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setSlotsLoading(true);
      setSlotsError("");
      try {
        const now = new Date();
        const from = now.toISOString();
        const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const intervals = await fetchBusyIntervals(from, horizon.toISOString());
        if (!cancelled) setBusy(intervals);
      } catch (error) {
        if (!cancelled) {
          setBusy([]);
          setSlotsError(
            error instanceof Error
              ? error.message
              : "Failed to load available times.",
          );
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isVisible, activePackage]);

  const availableSlots = useMemo(() => {
    if (!selectedDateKey || !activePackage) return [];
    try {
      return buildCandidateSlots(selectedDateKey, activePackage.id, busy);
    } catch {
      return [];
    }
  }, [selectedDateKey, activePackage, busy]);

  const durationHours = activePackage
    ? getPackageDurationMinutes(activePackage.id) / 60
    : 0;

  const monthLabel = useMemo(() => {
    const mid = wallTimeInZoneToUtc(viewYear, viewMonth, 15, 12, 0);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "America/New_York",
    }).format(mid);
  }, [viewYear, viewMonth]);

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  if (!isVisible || !activePackage) return null;

  const updateField = (name: keyof FormValues, raw: string) => {
    let next = raw;
    if (name === "phone") next = formatPhoneInput(raw);
    if (name === "modelYear") next = digitsOnly(raw, 4);

    setValues((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const selectDate = (dateKey: string) => {
    if (isDateKeyBeforeToday(dateKey)) return;
    setSelectedDateKey(dateKey);
    setSelectedSlot(null);
    setCalendarOpen(false);
    setErrors((prev) => {
      if (!prev.schedule) return prev;
      const copy = { ...prev };
      delete copy.schedule;
      return copy;
    });
  };

  const selectSlot = (slot: SlotOption) => {
    setSelectedSlot(slot);
    setErrors((prev) => {
      if (!prev.schedule) return prev;
      const copy = { ...prev };
      delete copy.schedule;
      return copy;
    });
  };

  const shiftMonth = (delta: number) => {
    const next = addMonths(viewYear, viewMonth, delta);
    const currentKey = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}`;
    const nextKey = `${next.year}-${String(next.month).padStart(2, "0")}`;
    if (nextKey < currentKey) return;
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, agreed, selectedDateKey, selectedSlot);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setSubmitError("");

    const entry = saveBooking({
      packageId: activePackage.id,
      packageName: activePackage.name,
      packagePrice: activePackage.price,
      ...values,
      startAt: selectedSlot.startAt.toISOString(),
      endAt: selectedSlot.endAt.toISOString(),
    });

    const dbResult = await insertBooking(entry);
    if (!dbResult.ok) {
      setIsSubmitting(false);
      setSubmitError(dbResult.message);
      if (dbResult.conflict) {
        try {
          const now = new Date();
          const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          const intervals = await fetchBusyIntervals(
            now.toISOString(),
            horizon.toISOString(),
          );
          setBusy(intervals);
          setSelectedSlot(null);
        } catch {
          /* keep previous busy list */
        }
      }
      return;
    }

    await notifyBooking({
      ...entry,
      id: dbResult.id || entry.id,
    });
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const scheduleSummary =
    selectedDateKey && selectedSlot
      ? `${formatBookingDateLabel(selectedDateKey)} · ${formatSlotRangeLabel(selectedSlot.startAt, selectedSlot.endAt)}`
      : selectedDateKey
        ? `${formatBookingDateLabel(selectedDateKey)} · pick a time`
        : "Select date & time";

  return createPortal(
    <div
      className={classNames(styles.overlay, {
        [styles["overlay--closing"]]: isClosing,
      })}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={classNames(styles.modal, {
          [styles["modal--closing"]]: isClosing,
          [styles["modal--success"]]: isSuccess,
        })}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modal__close}
          onClick={onClose}
          aria-label="Close"
        >
          <img src={asset("img/icons/Close.svg")} alt="" />
        </button>

        {isSuccess ? (
          <div className={styles.success}>
            <div className={styles.success__icon} aria-hidden="true">
              ✓
            </div>
            <h2 id={titleId} className={styles.success__title}>
              Your Booking Request Has Been Received
            </h2>
            <p className={styles.success__text}>
              Thank you for choosing us. Our manager will contact you shortly to
              confirm your appointment details.
            </p>
          </div>
        ) : (
          <>
            <h2 id={titleId} className={styles.modal__title}>
              Detailing Package {activePackage.name.toLowerCase()} - $
              {activePackage.price}
            </h2>
            <p className={styles.modal__note}>
              *Final price may vary from the listed price depending on the
              vehicle&apos;s condition. Service takes about {durationHours}{" "}
              hours.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {FIELDS.map((field) => (
                <label key={field.name} className={styles.form__field}>
                  <span className={styles.form__srOnly}>
                    {field.placeholder}
                  </span>
                  <input
                    className={classNames(styles.form__input, {
                      [styles["form__input--error"]]: Boolean(
                        errors[field.name],
                      ),
                    })}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    inputMode={field.inputMode}
                    value={values[field.name]}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                    required
                    aria-invalid={Boolean(errors[field.name])}
                  />
                  {errors[field.name] ? (
                    <span className={styles.form__error}>
                      {errors[field.name]}
                    </span>
                  ) : null}
                </label>
              ))}

              <div className={styles.schedule}>
                <button
                  type="button"
                  className={classNames(styles.schedule__dateBtn, {
                    [styles["schedule__dateBtn--error"]]: Boolean(
                      errors.schedule,
                    ),
                    [styles["schedule__dateBtn--filled"]]: Boolean(
                      selectedDateKey,
                    ),
                  })}
                  onClick={() => setCalendarOpen((open) => !open)}
                  aria-expanded={calendarOpen}
                >
                  {scheduleSummary}
                </button>

                {calendarOpen ? (
                  <div className={styles.calendar} role="dialog" aria-label="Choose date">
                    <div className={styles.calendar__nav}>
                      <button
                        type="button"
                        className={styles.calendar__navBtn}
                        onClick={() => shiftMonth(-1)}
                        aria-label="Previous month"
                      >
                        ‹
                      </button>
                      <p className={styles.calendar__month}>{monthLabel}</p>
                      <button
                        type="button"
                        className={styles.calendar__navBtn}
                        onClick={() => shiftMonth(1)}
                        aria-label="Next month"
                      >
                        ›
                      </button>
                    </div>
                    <div className={styles.calendar__weekdays}>
                      {WEEKDAYS.map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                    <div className={styles.calendar__grid}>
                      {monthCells.map((dateKey, index) => {
                        if (!dateKey) {
                          return (
                            <span
                              key={`empty-${index}`}
                              className={styles.calendar__empty}
                            />
                          );
                        }
                        const disabled = isDateKeyBeforeToday(dateKey);
                        const selected = dateKey === selectedDateKey;
                        const dayNum = Number(dateKey.slice(-2));
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            disabled={disabled}
                            className={classNames(styles.calendar__day, {
                              [styles["calendar__day--selected"]]: selected,
                            })}
                            onClick={() => selectDate(dateKey)}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {selectedDateKey ? (
                  <div className={styles.slots}>
                    <p className={styles.slots__label}>Available start times</p>
                    <p className={styles.slots__hint}>
                      Times inside another booking&apos;s estimated service
                      window are hidden automatically.
                    </p>
                    {slotsLoading ? (
                      <p className={styles.slots__hint}>Loading times…</p>
                    ) : slotsError ? (
                      <p className={styles.form__error} role="alert">
                        {slotsError}
                      </p>
                    ) : availableSlots.length === 0 ? (
                      <p className={styles.slots__hint}>
                        No available times this day. Pick another date.
                      </p>
                    ) : (
                      <div className={styles.slots__grid}>
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.minutes}
                            type="button"
                            className={classNames(styles.slots__btn, {
                              [styles["slots__btn--selected"]]:
                                selectedSlot?.minutes === slot.minutes,
                            })}
                            onClick={() => selectSlot(slot)}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSlot ? (
                      <p className={styles.slots__hint}>
                        Estimated service:{" "}
                        {formatSlotRangeLabel(
                          selectedSlot.startAt,
                          selectedSlot.endAt,
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {errors.schedule ? (
                  <span className={styles.form__error}>{errors.schedule}</span>
                ) : null}
              </div>

              <label className={styles.form__consent}>
                <input
                  className={styles.form__checkbox}
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => {
                    setAgreed(event.target.checked);
                    setErrors((prev) => {
                      if (!prev.agreed) return prev;
                      const copy = { ...prev };
                      delete copy.agreed;
                      return copy;
                    });
                  }}
                />
                <span>I agree to the Privacy Policy</span>
              </label>
              {errors.agreed ? (
                <span className={styles.form__error}>{errors.agreed}</span>
              ) : null}

              {submitError ? (
                <span className={styles.form__error} role="alert">
                  {submitError}
                </span>
              ) : null}

              <button
                type="submit"
                className={styles.form__submit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
