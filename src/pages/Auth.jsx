import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../api/services";
import { useAuth } from "../context/AppContext";
import { useAction } from "../hooks/useResource";
import { safeRedirect } from "../utils/format";
import { Button, ErrorState, Field, Image } from "../components/common/UI";

export default function Auth({ register: isRegister = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login } = useAuth();
  const action = useAction();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeRedirect(params.get("next"));
  const submit = (values) =>
    action.run(async () => {
      if (isRegister) await authService.register(values);
      const user = await login({
        email: values.email,
        password: values.password,
      });
      navigate(
        user.can_access_dashboard && !params.get("next") ? "/dashboard" : next,
        { replace: true },
      );
    });
  return (
    <div className="auth-page container">
      <div className="auth-visual">
        <Image
          src="/images/editorial-hero.png"
          alt="Editorial tailoring inspiration"
          eager
        />
        <div>
          <p className="eyebrow">THE NEXT CHAPTER</p>
          <h2>
            Good style.
            <br />
            Starts with you.
          </h2>
        </div>
      </div>
      <div className="auth-form">
        <p className="eyebrow">YOUR SUIT AND TIE FASHION SHOP</p>
        <h1>{isRegister ? "Make yourself at home." : "Welcome back."}</h1>
        <p>
          {isRegister
            ? "A place for your favorites, your orders, and your next occasion."
            : "Your wardrobe is waiting. Let’s pick up where you left off."}
        </p>
        <form onSubmit={handleSubmit(submit)} noValidate>
          {isRegister && (
            <div className="field-grid">
              <Field label="First name" error={errors.first_name}>
                <input
                  autoComplete="given-name"
                  {...register("first_name", {
                    required: "Enter your first name.",
                  })}
                />
              </Field>
              <Field label="Last name" error={errors.last_name}>
                <input
                  autoComplete="family-name"
                  {...register("last_name", {
                    required: "Enter your last name.",
                  })}
                />
              </Field>
            </div>
          )}
          <Field label="Email address" error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              {...register("email", {
                required: "Enter your email.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address.",
                },
              })}
            />
          </Field>
          {isRegister && (
            <Field label="Phone number" error={errors.phone_number}>
              <input
                type="tel"
                autoComplete="tel"
                {...register("phone_number")}
              />
            </Field>
          )}
          <Field
            label="Password"
            error={errors.password}
            hint={
              isRegister
                ? "Use at least 8 characters. Avoid common words or personal details."
                : undefined
            }
          >
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              {...register("password", {
                required: "Enter your password.",
                ...(isRegister
                  ? {
                      minLength: {
                        value: 8,
                        message: "Use at least 8 characters.",
                      },
                    }
                  : {}),
              })}
            />
          </Field>
          <ErrorState error={action.error} compact />
          <Button className="w-full" type="submit" busy={action.busy}>
            {isRegister ? "Create an account" : "Sign in"}
            <ArrowRight size={17} />
          </Button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already part of the collection?" : "New around here?"}{" "}
          <Link
            to={`${isRegister ? "/login" : "/register"}${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`}
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
        {isRegister && (
          <small className="muted">
            Your account and orders are handled according to our{" "}
            <Link to="/info/privacy">privacy information</Link>.
          </small>
        )}
      </div>
    </div>
  );
}
