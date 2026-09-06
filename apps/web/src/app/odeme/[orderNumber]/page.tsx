"use client";

import { useEffect, useRef, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { apiFetch } from "@/lib/api";
import { getGuestOrderAccessHeaders } from "@/lib/order-access";
import { useAuth } from "@/contexts/auth-context";
import { formatPrice } from "@/app/products/product-data";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

type Order = {
  orderNumber: string;
  paymentStatus: PaymentStatus;
  currency: string;
  totalKurus: number;
  items: { id: string }[];
};

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 200; // ~10 minutes

export default function OdemeSayfasiPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initCalledRef = useRef(false);
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function fetchOrder() {
    const firebaseToken = user ? await user.getIdToken() : undefined;
    const data = await apiFetch<Order>(
      `/orders/${orderNumber}`,
      firebaseToken,
      { headers: getGuestOrderAccessHeaders(orderNumber) },
    );
    setOrder(data);
    if (data.paymentStatus === "PAID") {
      router.push(`/siparis/${orderNumber}`);
    }
    return data;
  }

  async function startPayment() {
    try {
      const firebaseToken = user ? await user.getIdToken() : undefined;
      const result = await apiFetch<{ iframeToken: string }>(
        "/payments/paytr/init",
        firebaseToken,
        {
          method: "POST",
          headers: getGuestOrderAccessHeaders(orderNumber),
          body: JSON.stringify({ orderNumber }),
        },
      );
      setIframeToken(result.iframeToken);
      setPaymentError(null);
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Ödeme başlatılamadı.",
      );
    }
  }

  // Initial order fetch.
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        await fetchOrder();
      } catch {
        // order not found
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, authLoading]);

  // Auto-init payment once, the first time the order is seen as PENDING.
  useEffect(() => {
    if (!order) return;
    if (order.paymentStatus !== "PENDING") return;
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    (async () => {
      await startPayment();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.paymentStatus, orderNumber]);

  // Poll for the webhook-driven status update while payment is PENDING.
  useEffect(() => {
    if (order?.paymentStatus !== "PENDING") {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(() => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > POLL_MAX_ATTEMPTS) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setPollTimedOut(true);
        return;
      }
      void (async () => {
        try {
          await fetchOrder();
        } catch {
          // transient error — keep polling
        }
      })();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.paymentStatus, orderNumber]);

  useEffect(() => {
    if (!scriptLoaded || !iframeToken) return;
    const w = window as unknown as {
      iFrameResize?: (opts: object, selector: string) => void;
    };
    w.iFrameResize?.({}, "#paytriframe");
  }, [scriptLoaded, iframeToken]);

  async function handleRetryPayment() {
    if (retrying) return;
    setRetrying(true);
    setIframeToken(null);
    pollAttemptsRef.current = 0;
    setPollTimedOut(false);
    try {
      await startPayment();
    } finally {
      setRetrying(false);
    }
  }

  async function handleRefreshStatus() {
    if (refreshing) return;
    setRefreshing(true);
    pollAttemptsRef.current = 0;
    setPollTimedOut(false);
    try {
      await fetchOrder();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-32 text-center">
          <p className="text-lg font-semibold">Sipariş bulunamadı.</p>
          <Link href="/" className="text-sm text-brown-muted hover:text-ink">
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Header with a compact order summary — the iframe is the focus,
            not a full itemized receipt, which belongs on the confirmation
            page once payment actually succeeds. */}
        <div className="mb-6 flex items-center justify-between border-b border-brown-muted/15 pb-6">
          <div>
            <h1 className="font-serif text-xl text-ink sm:text-2xl">Ödemenizi Tamamlayın</h1>
            <p className="mt-1 text-sm text-brown-muted">
              Sipariş <span className="font-mono text-ink">{order.orderNumber}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-brown-muted">Toplam</p>
            <p className="font-serif text-lg font-semibold text-ink">
              {formatPrice(order.totalKurus, order.currency)}
            </p>
          </div>
        </div>

        {order.paymentStatus === "FAILED" && (
          <div className="mb-6 flex flex-col items-center gap-4 border border-red-100 bg-red-50 px-6 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-7 w-7 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-ink">Ödeme Başarısız</p>
              <p className="mt-1 text-sm text-brown-muted">
                Ödemeniz alınamadı. Lütfen tekrar deneyin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex h-11 items-center justify-center bg-rust px-6 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying ? "Deneniyor…" : "Tekrar Dene"}
            </button>
          </div>
        )}

        {paymentError && (
          <div className="mb-6 flex flex-col items-center gap-3 border border-red-100 bg-red-50 px-5 py-4 text-center">
            <p className="text-sm text-red-600">{paymentError}</p>
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex h-10 items-center justify-center bg-rust px-5 text-sm font-medium text-cream transition hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying ? "Deneniyor…" : "Tekrar Dene"}
            </button>
          </div>
        )}

        {iframeToken ? (
          <div className="border border-brown-muted/15 bg-cream-soft p-2">
            <iframe
              id="paytriframe"
              src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
              frameBorder={0}
              scrolling="no"
              style={{ width: "100%", minHeight: 600 }}
              title="Ödeme"
            />
          </div>
        ) : (
          !paymentError && (
            <div className="flex min-h-[400px] items-center justify-center border border-brown-muted/15 bg-cream-soft">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown-muted/20 border-t-rust" />
            </div>
          )
        )}

        {pollTimedOut && (
          <div className="mt-6 border border-brown-muted/15 bg-cream-soft px-4 py-3 text-center text-sm text-brown-muted">
            Ödeme durumu kontrol ediliyor. Ödemeyi tamamladıysanız durumu
            yenileyin.{" "}
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="font-medium text-ink underline hover:text-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Yenileniyor…" : "Durumu Yenile"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
