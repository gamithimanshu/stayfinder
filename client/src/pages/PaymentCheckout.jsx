import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Landmark, ShieldCheck, Smartphone, Wallet, XCircle } from "lucide-react";
import { FaCcMastercard, FaCcVisa, FaGooglePay } from "react-icons/fa6";
import { SiPaytm } from "react-icons/si";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { FormField, InfoBanner, PageSection, PageShell, SafeImage, SelectInput, SurfaceCard, TextInput } from "../components/ui.jsx";
import { toastError, toastSuccess, toastWarn } from "../utils/toast.js";

const paymentLabels = {
  upi: "UPI",
  card: "Card",
  net_banking: "Net Banking",
  pay_at_property: "Pay Later",
};

const paymentIcons = {
  upi: Smartphone,
  card: CreditCard,
  net_banking: Landmark,
  pay_at_property: Wallet,
};

const initialPayerDetails = {
  upiId: "",
  cardHolder: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  bankName: "",
};

export function PaymentCheckout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [bookingData, setBookingData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [payerDetails, setPayerDetails] = useState(initialPayerDetails);
  const [paymentResult, setPaymentResult] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate, token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadPayment = async () => {
      setLoading(true);
      setMessage("");

      try {
        const { data } = await API.get(`/booking/${bookingId}/payment`);

        if (!cancelled) {
          setBookingData(data);
          setSelectedMethod(data?.payment?.paymentMethod || "upi");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error?.response?.data?.message || "Unable to load payment details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPayment();

    return () => {
      cancelled = true;
    };
  }, [bookingId, token]);

  const booking = bookingData?.booking;
  const payment = bookingData?.payment;
  const pg = bookingData?.pg;
  const MethodIcon = paymentIcons[selectedMethod] || CreditCard;
  const pgImage = pg?.image || pg?.images?.[0] || "/fallback-pg.svg";
  const isPayLater = selectedMethod === "pay_at_property";

  const methodOptions = useMemo(
    () => [
      { id: "upi", title: "UPI", copy: "Simulate a UPI collect or QR payment later." },
      { id: "card", title: "Card", copy: "Use this to later plug in Stripe or Razorpay card flow." },
      { id: "net_banking", title: "Net Banking", copy: "Good placeholder for a bank redirect flow." },
      { id: "pay_at_property", title: "Pay Later", copy: "Reserve now and collect payment manually." },
    ],
    []
  );

  const renderBrandLogos = (methodId) => {
    if (methodId === "upi") {
      return (
        <div className="flex items-center gap-3 text-2xl text-[#1676d2]">
          <FaGooglePay />
          <SiPaytm className="text-[#00baf2]" />
        </div>
      );
    }

    if (methodId === "card") {
      return (
        <div className="flex items-center gap-3 text-2xl">
          <FaCcVisa className="text-[#1a1f71]" />
          <FaCcMastercard className="text-[#eb001b]" />
        </div>
      );
    }

    return null;
  };

  const handleInput = (event) => {
    const { name, value } = event.target;
    setPayerDetails((current) => ({ ...current, [name]: value }));
  };

  const validateBeforeSubmit = () => {
    if (selectedMethod === "upi" && !payerDetails.upiId.trim()) {
      return "Enter a UPI ID to continue.";
    }

    if (selectedMethod === "card") {
      if (!payerDetails.cardHolder.trim() || !payerDetails.cardNumber.trim() || !payerDetails.expiry.trim() || !payerDetails.cvv.trim()) {
        return "Fill all card details to continue.";
      }
    }

    if (selectedMethod === "net_banking" && !payerDetails.bankName.trim()) {
      return "Choose a bank to continue.";
    }

    return "";
  };

  const handlePayment = async (markAs) => {
    if (!booking) return;

    const validationError = markAs === "success" ? validateBeforeSubmit() : "";
    if (validationError) {
      setMessage(validationError);
      toastWarn(validationError);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const { data } = await API.post(`/booking/${booking._id}/payment/process`, {
        paymentMethod: selectedMethod,
        markAs: isPayLater && markAs === "success" ? "reserve" : markAs,
        payerDetails,
      });

      setBookingData((current) => ({
        ...current,
        booking: data.booking,
        payment: data.payment,
        pg: data.pg ? { ...(current?.pg ?? {}), ...data.pg } : current?.pg,
      }));
      setPaymentResult(isPayLater && markAs === "success" ? "reserve" : markAs);
      setMessage(
        markAs === "success"
          ? isPayLater
            ? data.message
            : `${data.message}. Transaction ID: ${data?.payment?.transactionId || "generated"}.`
          : data.message
      );
      if (markAs === "failed") {
        toastError(data.message || "Payment attempt recorded.");
      } else {
        toastSuccess(data.message || "Payment completed.");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to process payment.";
      setMessage(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return null;

  if (loading) {
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading payment page...</SurfaceCard></PageShell></PageSection>;
  }

  if (!booking || !payment || !pg) {
    return (
      <PageSection>
        <PageShell>
          <SurfaceCard className="space-y-4 p-10 text-center">
            <p>{message || "Payment details could not be loaded."}</p>
            <div>
              <Link to="/listings" className="btn-secondary">
                Back to listings
              </Link>
            </div>
          </SurfaceCard>
        </PageShell>
      </PageSection>
    );
  }

  return (
    <PageSection className="pt-12 sm:pt-16">
      <PageShell className="space-y-8">
        <Link to={`/listings/${pg._id || pg.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-700">
          Back to PG details
        </Link>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <SurfaceCard className="overflow-hidden">
            <SafeImage src={pgImage} alt={pg.title} className="h-56 w-full object-cover sm:h-72 lg:h-80" />
            <div className="space-y-5 p-6 sm:p-8">
              <span className="section-kicker">Payment checkout</span>
              <h1 className="text-4xl tracking-tight text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
                Complete your booking payment with a realistic checkout flow.
              </h1>
              <p className="text-sm leading-7 text-ink-500">
                This simulates a real payment experience for your project. Later, you can connect the same flow to a live provider.
              </p>

              <div className="rounded-xl border border-black/5 bg-sky-50/70 p-5">
                <h2 className="text-xl font-semibold text-ink-900">{pg.title}</h2>
                <p className="mt-2 text-sm text-ink-500">{pg.location || pg.address}</p>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-ink-500">Booking ID</span>
                    <strong className="max-w-full break-all text-ink-900">{booking._id}</strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-ink-500">Payment Status</span>
                    <strong className={payment.paymentStatus === "paid" ? "text-emerald-700" : payment.paymentStatus === "failed" ? "text-rose-700" : "text-brand-700"}>
                      {payment.paymentStatus}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-ink-500">Selected Method</span>
                    <strong className="text-ink-900">{paymentLabels[selectedMethod] || selectedMethod}</strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-ink-500">Booking Status</span>
                    <strong className={booking.bookingStatus === "cancelled" ? "text-rose-700" : booking.bookingStatus === "pending" ? "text-amber-700" : "text-emerald-700"}>
                      {booking.bookingStatus}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-ink-500">Amount</span>
                    <strong className="text-ink-900">Rs. {Number(payment.amount || booking.totalAmount || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/5 bg-white p-4 text-sm text-ink-600">
                  <div className="mb-2 text-sky-700">
                    <ShieldCheck size={18} />
                  </div>
                  Pending payment state is stored in the database.
                </div>
                <div className="rounded-xl border border-black/5 bg-white p-4 text-sm text-ink-600">
                  <div className="mb-2 text-sky-700">
                    <CheckCircle2 size={18} />
                  </div>
                  You can later replace this with a real gateway callback.
                </div>
              </div>
            </div>
          </SurfaceCard>

          <div className="xl:sticky xl:top-24 h-fit">
            <SurfaceCard className="p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-sky-50 p-3 text-sky-700">
                  <MethodIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
                    Choose payment method
                  </h2>
                  <p className="text-sm text-ink-500">Use this simulated checkout now and plug in a provider later.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {methodOptions.map((option) => {
                  const Icon = paymentIcons[option.id] || CreditCard;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`rounded-xl border p-4 text-left transition ${
                        selectedMethod === option.id
                          ? "border-brand-400 bg-sky-50"
                          : "border-black/5 bg-white hover:border-sky-200"
                      }`}
                      onClick={() => setSelectedMethod(option.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-white p-2 text-sky-700 shadow-sm">
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink-900">{option.title}</p>
                          <p className="mt-1 text-xs leading-5 text-ink-500">{option.copy}</p>
                          <div className="mt-3">{renderBrandLogos(option.id)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-5">
                {selectedMethod === "upi" ? (
                  <div className="rounded-xl border border-black/5 bg-sky-50/60 p-4">
                    <p className="text-sm font-semibold text-ink-900">Accepted UPI-style wallets</p>
                    <div className="mt-3 flex items-center gap-4 text-3xl text-[#1676d2]">
                      <FaGooglePay />
                      <SiPaytm className="text-[#00baf2]" />
                    </div>
                  </div>
                ) : null}

                {selectedMethod === "card" ? (
                  <div className="rounded-xl border border-black/5 bg-sky-50/60 p-4">
                    <p className="text-sm font-semibold text-ink-900">Supported card networks</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-4xl">
                      <FaCcVisa className="text-[#1a1f71]" />
                      <FaCcMastercard className="text-[#eb001b]" />
                    </div>
                  </div>
                ) : null}

                {selectedMethod === "upi" ? (
                  <FormField label="UPI ID" hint="Example: name@upi">
                    <TextInput
                      name="upiId"
                      value={payerDetails.upiId}
                      onChange={handleInput}
                      placeholder="Enter UPI ID"
                    />
                  </FormField>
                ) : null}

                {selectedMethod === "card" ? (
                  <>
                    <FormField label="Card Holder Name">
                      <TextInput
                        name="cardHolder"
                        value={payerDetails.cardHolder}
                        onChange={handleInput}
                        placeholder="Enter card holder name"
                      />
                    </FormField>
                    <FormField label="Card Number">
                      <TextInput
                        name="cardNumber"
                        value={payerDetails.cardNumber}
                        onChange={handleInput}
                        placeholder="4111 1111 1111 1111"
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Expiry">
                        <TextInput name="expiry" value={payerDetails.expiry} onChange={handleInput} placeholder="MM/YY" />
                      </FormField>
                      <FormField label="CVV">
                        <TextInput name="cvv" value={payerDetails.cvv} onChange={handleInput} placeholder="123" />
                      </FormField>
                    </div>
                  </>
                ) : null}

                {selectedMethod === "net_banking" ? (
                  <FormField label="Select Bank">
                    <SelectInput name="bankName" value={payerDetails.bankName} onChange={handleInput}>
                      <option value="">Choose bank</option>
                      <option value="State Bank of India">State Bank of India</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                    </SelectInput>
                  </FormField>
                ) : null}

                {selectedMethod === "pay_at_property" ? (
                  <InfoBanner tone="info">
                    This option keeps the booking active and stores the payment as pending so you can collect it offline.
                  </InfoBanner>
                ) : null}
              </div>

              <div className="mt-6 rounded-xl border border-black/5 bg-ink-50/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink-500">Booking amount</span>
                  <strong className="text-ink-900">
                    Rs. {Number(payment.amount || booking.totalAmount || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink-500">Simulation mode</span>
                  <strong className="text-ink-900">No real gateway connected</strong>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={() => handlePayment("success")}
                  disabled={submitting || payment.paymentStatus === "paid" || booking.bookingStatus === "cancelled"}
                >
                  <CheckCircle2 size={18} />
                  {payment.paymentStatus === "paid"
                    ? "Payment Completed"
                    : submitting
                      ? "Processing..."
                      : isPayLater
                        ? "Confirm Pay Later"
                        : "Simulate Success"}
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => handlePayment("failed")}
                  disabled={submitting || isPayLater || booking.bookingStatus === "cancelled"}
                >
                  <XCircle size={18} />
                  Simulate Failure
                </button>
              </div>

              {paymentResult === "success" || paymentResult === "reserve" ? (
                <div className="mt-4">
                  <Link to="/profile" className="btn-secondary w-full">
                    Go to Profile
                  </Link>
                </div>
              ) : null}

              {message ? (
                <InfoBanner
                  tone={
                    paymentResult === "success" || paymentResult === "reserve"
                      ? "success"
                      : paymentResult === "failed"
                        ? "error"
                        : "info"
                  }
                  className="mt-6"
                >
                  {message}
                </InfoBanner>
              ) : null}

              {location.state?.bookingTitle ? (
                <p className="mt-4 text-sm text-ink-500">
                  Booking created for{" "}
                  <span className="font-semibold text-ink-900">{location.state.bookingTitle}</span>. Complete or
                  simulate payment from here.
                </p>
              ) : null}

              {booking.bookingStatus === "cancelled" ? (
                <InfoBanner tone="error" className="mt-4">
                  This booking was cancelled after payment failure. The room has been released back to inventory.
                </InfoBanner>
              ) : null}
            </SurfaceCard>
          </div>
        </div>
      </PageShell>
    </PageSection>
  );
}


