import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ChevronRight,
  ScanFace,
  Eye,
  EyeOff,
} from "lucide-react";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../utils/apiClient";
import { toast } from "../utils/toast";
import { LoadingSpinner } from "@repo/ui/components/loading-spinner";

type RegisterResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      username: string;
      email: string;
      fullName: string;
      avatar?: string;
      profilePhoto?: string;
      isVerified: boolean;
      role: "admin" | "user";
    };
    requiresOtp: boolean;
  };
};

type VerifyResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      username: string;
      email: string;
      fullName: string;
      avatar?: string;
      profilePhoto?: string;
      isVerified: boolean;
      role: "admin" | "user";
    };
    accessToken?: string;
  };
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { setSessionUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingUsername, setPendingUsername] = useState("");
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [submitting, setSubmitting] = useState(false);

  const completeLogin = useCallback(
    (response: VerifyResponse) => {
      setSessionUser(response.data.user);
      navigate("/avatar");
    },
    [navigate, setSessionUser],
  );

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      toast.info("Complete all signup fields before continuing.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiPost<RegisterResponse>("/users/register", {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      setPendingUsername(response.data.user.username);
      setStep("verify");
      toast.success(
        "Account created.",
        "Enter the OTP from your email to continue.",
      );
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!otp.trim()) {
      toast.info("Enter the OTP code from your email.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiPost<VerifyResponse>("/users/verifyotp", {
        username: pendingUsername,
        otpReceived: otp.trim(),
      });
      toast.success("Account verified.");
      completeLogin(response);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "OTP verification failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingUsername) {
      toast.info("Finish signup first so we know where to send the OTP.");
      return;
    }

    setSubmitting(true);

    try {
      await apiPost("/users/requestotp", {
        emailOrUsername: pendingUsername,
      });
      toast.success("A fresh OTP was sent.");
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setSubmitting(true);

    try {
      const response = await apiPost<VerifyResponse>("/users/google", {
        credential,
      });
      completeLogin(response);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google signup failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen w-full bg-background flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans antialiased selection:bg-primary/30">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2072&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-20 blur-xl scale-125"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="relative z-10 w-full max-w-6xl grid md:grid-cols-5 bg-card/10 backdrop-blur-3xl border border-border/40 rounded-[var(--radius)] overflow-hidden shadow-2xl"
      >
        <div className="hidden md:flex md:col-span-2 bg-background/60 relative items-center justify-center p-12 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute w-[400px] h-[400px] border-[1px] border-dashed border-primary/30 rounded-full"
          />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-primary/20 p-8 rounded-full border-2 border-primary/50 shadow-sm"
            >
              <ScanFace className="w-16 h-16 text-primary" />
            </motion.div>
            <h3 className="text-foreground font-black uppercase tracking-widest mt-8 text-lg">
              Identity Grid
            </h3>
            <span className="text-primary font-mono text-[9px] uppercase tracking-widest mt-2 animate-pulse">
              Scanning Core...
            </span>
          </div>
        </div>

        <div className="md:col-span-3 p-6 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-center min-h-[80vh] md:min-h-0">
          <div className="flex flex-col gap-3 sm:gap-4 mb-8 sm:mb-12 md:mb-14">
            <motion.span
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-primary font-black uppercase text-[9px] sm:text-[11px] tracking-wider flex items-center gap-3"
            >
              <div className="h-[2px] w-4 sm:w-6 bg-primary shadow-xs" />
              {step === "signup"
                ? "Security Protocol"
                : "Verification Protocol"}
            </motion.span>

            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tighter uppercase leading-[0.9] italic">
              {step === "signup" ? (
                <>
                  Create <br className="hidden sm:block" /> Account
                </>
              ) : (
                <>
                  Verify <br className="hidden sm:block" /> Access
                </>
              )}
            </h2>
          </div>

          {step === "signup" ? (
            <form
              className="flex flex-col gap-4 sm:gap-6"
              onSubmit={handleSignup}
            >
              <div className="relative group">
                <User className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="FULL_NAME"
                  className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-4 sm:pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>

              <div className="relative group">
                <User className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="USERNAME"
                  className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-4 sm:pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="IDENT_EMAIL"
                  className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-4 sm:pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="ACCESS_KEY"
                  className="w-full rounded-xl border border-border/20 bg-background/60 py-4 pl-12 pr-12 text-sm font-semibold text-foreground normal-case tracking-normal placeholder:text-[10px] placeholder:font-bold placeholder:uppercase placeholder:tracking-widest placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-all sm:py-5 sm:pl-16 sm:pr-14 sm:placeholder:text-xs md:py-6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: "var(--shadow-md)",
                }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 sm:mt-6 md:mt-10 w-full bg-foreground text-background py-4 sm:py-5 md:py-6 rounded-xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5" />
                    Creating Account
                  </>
                ) : (
                  <>
                    Sign Up
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4 sm:gap-6"
              onSubmit={handleVerify}
            >
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
                We sent an OTP to your email. Verify the code to continue to
                character selection.
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="ENTER_OTP"
                  className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-4 sm:pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-[0.45em] text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: "var(--shadow-md)",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-foreground text-background py-4 sm:py-5 md:py-6 rounded-xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="h-3.5 w-3.5" />
                    Verifying
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </motion.button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting}
                className="inline-flex items-center gap-2 text-sm text-primary text-left disabled:opacity-60"
              >
                {submitting && <LoadingSpinner className="h-3.5 w-3.5" />}
                Resend OTP
              </button>
            </form>
          )}

          {step === "signup" && (
            <div className="mt-8">
              <GoogleSignInButton
                disabled={submitting}
                onCredential={handleGoogleLogin}
              />
            </div>
          )}
          <p className="mt-8 sm:mt-12 text-center text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
            System Access?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-foreground cursor-pointer hover:text-primary transition-colors underline underline-offset-4 decoration-border"
            >
              Login Core
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
