import {
  useEffect,
  useId,
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
  isValidZip,
  saveBooking,
} from "../../shared/formStorage";
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
  street: string;
  city: string;
  state: string;
  zip: string;
  carMake: string;
  modelYear: string;
};

type FormErrors = Partial<Record<keyof FormValues | "agreed", string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  carMake: "",
  modelYear: "",
};

const FIELDS: {
  name: keyof FormValues;
  placeholder: string;
  type: string;
  autoComplete: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}[] = [
  { name: "firstName", placeholder: "First Name", type: "text", autoComplete: "given-name" },
  { name: "lastName", placeholder: "Last Name", type: "text", autoComplete: "family-name" },
  { name: "phone", placeholder: "Phone Number", type: "tel", autoComplete: "tel", inputMode: "tel" },
  { name: "street", placeholder: "Street address", type: "text", autoComplete: "street-address" },
  { name: "city", placeholder: "City", type: "text", autoComplete: "address-level2" },
  { name: "state", placeholder: "State", type: "text", autoComplete: "address-level1" },
  { name: "zip", placeholder: "Zip code", type: "text", autoComplete: "postal-code", inputMode: "numeric" },
  { name: "carMake", placeholder: "Car Make", type: "text", autoComplete: "off" },
  { name: "modelYear", placeholder: "Model Year", type: "text", autoComplete: "off", inputMode: "numeric" },
];

function validate(values: FormValues, agreed: boolean): FormErrors {
  const errors: FormErrors = {};

  if (!isNonEmpty(values.firstName)) errors.firstName = "First name is required";
  if (!isNonEmpty(values.lastName)) errors.lastName = "Last name is required";
  if (!isValidPhone(values.phone)) errors.phone = "Enter a valid 10-digit phone";
  if (!isNonEmpty(values.street)) errors.street = "Street address is required";
  if (!isNonEmpty(values.city)) errors.city = "City is required";
  if (!isNonEmpty(values.state)) errors.state = "State is required";
  if (!isValidZip(values.zip)) errors.zip = "Enter a 5-digit zip code";
  if (!isNonEmpty(values.carMake)) errors.carMake = "Car make is required";
  if (!isValidModelYear(values.modelYear)) {
    errors.modelYear = "Enter a valid year (1980–next year)";
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
  const [agreed, setAgreed] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activePackage, setActivePackage] = useState<BookingPackage | null>(
    null,
  );

  useEffect(() => {
    if (selectedPackage) {
      setActivePackage(selectedPackage);
      setIsVisible(true);
      setIsClosing(false);
      setIsSuccess(false);
      setAgreed(false);
      setValues(INITIAL_VALUES);
      setErrors({});
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
  }, [selectedPackage, isVisible]);

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

  if (!isVisible || !activePackage) return null;

  const updateField = (name: keyof FormValues, raw: string) => {
    let next = raw;
    if (name === "phone") next = formatPhoneInput(raw);
    if (name === "zip") next = digitsOnly(raw, 5);
    if (name === "modelYear") next = digitsOnly(raw, 4);

    setValues((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, agreed);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    saveBooking({
      packageId: activePackage.id,
      packageName: activePackage.name,
      packagePrice: activePackage.price,
      ...values,
    });
    setIsSuccess(true);
  };

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
          <img src="/img/icons/Close.svg" alt="" />
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
              vehicle&apos;s condition
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

              <button type="submit" className={styles.form__submit}>
                Submit
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
