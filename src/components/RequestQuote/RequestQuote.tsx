import { useState, type FormEvent } from "react";
import classNames from "classnames";
import {
  formatPhoneInput,
  isNonEmpty,
  isValidEmail,
  isValidPhone,
  saveQuote,
} from "../../shared/formStorage";
import styles from "./RequestQuote.module.scss";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues | "agreed", string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

function validate(values: FormValues, agreed: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!isNonEmpty(values.firstName)) errors.firstName = "First name is required";
  if (!isNonEmpty(values.lastName)) errors.lastName = "Last name is required";
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email";
  if (!isValidPhone(values.phone)) errors.phone = "Enter a valid 10-digit phone";
  if (!isNonEmpty(values.message)) errors.message = "Message is required";
  if (!agreed) errors.agreed = "Please agree to the Privacy Policy";
  return errors;
}

export const RequestQuote: React.FC = () => {
  const [agreed, setAgreed] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const clearError = (key: keyof FormErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateField = (name: keyof FormValues, raw: string) => {
    const next = name === "phone" ? formatPhoneInput(raw) : raw;
    setValues((prev) => ({ ...prev, [name]: next }));
    clearError(name);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, agreed);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    saveQuote(values);
    setIsSuccess(true);
    setValues(INITIAL_VALUES);
    setAgreed(false);
  };

  return (
    <section
      id="contact"
      className={styles.quote}
      aria-labelledby="quote-title"
    >
      <div className={styles.quote__inner}>
        <div className={styles.quote__content}>
          <h2 id="quote-title" className={styles.quote__title}>
            Request a Quote
          </h2>
          <p className={styles.quote__subtitle}>
            Have questions or need a custom service? Send us a message and
            we&apos;ll get back to you
          </p>

          {isSuccess ? (
            <div className={styles.success} role="status">
              <p className={styles.success__title}>Message sent</p>
              <p className={styles.success__text}>
                Thank you! We&apos;ll get back to you shortly.
              </p>
              <button
                type="button"
                className={styles.form__submit}
                onClick={() => setIsSuccess(false)}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <label className={styles.form__field}>
                <span className={styles.form__srOnly}>First Name</span>
                <input
                  className={classNames(styles.form__input, {
                    [styles["form__input--error"]]: Boolean(errors.firstName),
                  })}
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  autoComplete="given-name"
                  value={values.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required
                  aria-invalid={Boolean(errors.firstName)}
                />
                {errors.firstName ? (
                  <span className={styles.form__error}>{errors.firstName}</span>
                ) : null}
              </label>

              <label className={styles.form__field}>
                <span className={styles.form__srOnly}>Last Name</span>
                <input
                  className={classNames(styles.form__input, {
                    [styles["form__input--error"]]: Boolean(errors.lastName),
                  })}
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  autoComplete="family-name"
                  value={values.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required
                  aria-invalid={Boolean(errors.lastName)}
                />
                {errors.lastName ? (
                  <span className={styles.form__error}>{errors.lastName}</span>
                ) : null}
              </label>

              <label className={styles.form__field}>
                <span className={styles.form__srOnly}>E-mail</span>
                <input
                  className={classNames(styles.form__input, {
                    [styles["form__input--error"]]: Boolean(errors.email),
                  })}
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? (
                  <span className={styles.form__error}>{errors.email}</span>
                ) : null}
              </label>

              <label className={styles.form__field}>
                <span className={styles.form__srOnly}>Phone Number</span>
                <input
                  className={classNames(styles.form__input, {
                    [styles["form__input--error"]]: Boolean(errors.phone),
                  })}
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  autoComplete="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone ? (
                  <span className={styles.form__error}>{errors.phone}</span>
                ) : null}
              </label>

              <label className={styles.form__field}>
                <span className={styles.form__srOnly}>Message</span>
                <textarea
                  className={classNames(styles.form__textarea, {
                    [styles["form__textarea--error"]]: Boolean(errors.message),
                  })}
                  name="message"
                  placeholder="Message"
                  rows={5}
                  value={values.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  required
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message ? (
                  <span className={styles.form__error}>{errors.message}</span>
                ) : null}
              </label>

              <label className={styles.form__consent} id="privacy">
                <input
                  className={styles.form__checkbox}
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => {
                    setAgreed(event.target.checked);
                    clearError("agreed");
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
          )}
        </div>
      </div>
    </section>
  );
};
