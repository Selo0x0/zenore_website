"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "../cart/cart-context";
import { formatPrice } from "../products/product-data";

type CheckoutForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingName: string;
  shippingPhone: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingAddress: string;
};

type CreatedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotalKurus: number;
  shippingKurus: number;
  totalKurus: number;
};

const initialForm: CheckoutForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingName: "",
  shippingPhone: "",
  shippingCity: "",
  shippingDistrict: "",
  shippingAddress: "",
};

const inputClass =
  "h-11 border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-950";

const phoneInputPattern = "\\+?[0-9 ()-]{10,19}";

export default function CheckoutPage() {
  const { items, subtotalKurus, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currency = items[0]?.currency ?? createdOrder?.currency ?? "TRY";

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    const checkoutForm = {
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim(),
      shippingName: form.shippingName.trim(),
      shippingPhone: form.shippingPhone.trim(),
      shippingCity: form.shippingCity.trim(),
      shippingDistrict: form.shippingDistrict.trim(),
      shippingAddress: form.shippingAddress.trim(),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...checkoutForm,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          message?: unknown;
        } | null;

        setError(
          typeof errorData?.message === "string"
            ? errorData.message
            : "Unable to create order.",
        );
        return;
      }

      const order = (await response.json()) as CreatedOrder;

      setCreatedOrder(order);
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdOrder) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-950">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10">
          <div className="border border-neutral-200 bg-white p-6 sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
              Order received
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Thank you.
            </h1>
            <p className="mt-4 text-neutral-600">
              Your order was created successfully. Payment will be added in a
              later step.
            </p>

            <div className="mt-8 grid gap-4 border-t border-neutral-100 pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Order number</span>
                <span className="font-semibold">{createdOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total</span>
                <span className="font-semibold">
                  {formatPrice(createdOrder.totalKurus, createdOrder.currency)}
                </span>
              </div>
            </div>

            <Link
              href="/"
              className="mt-8 flex h-12 items-center justify-center bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-8 border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <header>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
              Checkout
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Contact and shipping.
            </h1>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Name
              <input
                required
                className={inputClass}
                value={form.customerName}
                onChange={(event) =>
                  updateField("customerName", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Email
              <input
                required
                type="email"
                className={inputClass}
                value={form.customerEmail}
                onChange={(event) =>
                  updateField("customerEmail", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Phone
              <input
                type="tel"
                inputMode="tel"
                pattern={phoneInputPattern}
                minLength={10}
                maxLength={20}
                title="Use a valid phone number."
                required
                className={inputClass}
                value={form.customerPhone}
                onChange={(event) =>
                  updateField("customerPhone", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Shipping name
              <input
                required
                className={inputClass}
                value={form.shippingName}
                onChange={(event) =>
                  updateField("shippingName", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Shipping phone
              <input
                type="tel"
                inputMode="tel"
                pattern={phoneInputPattern}
                minLength={10}
                maxLength={20}
                title="Use a valid phone number."
                required
                className={inputClass}
                value={form.shippingPhone}
                onChange={(event) =>
                  updateField("shippingPhone", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              City
              <input
                required
                className={inputClass}
                value={form.shippingCity}
                onChange={(event) =>
                  updateField("shippingCity", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              District
              <input
                required
                className={inputClass}
                value={form.shippingDistrict}
                onChange={(event) =>
                  updateField("shippingDistrict", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
              Address
              <textarea
                required
                className="min-h-28 border border-neutral-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-neutral-950"
                value={form.shippingAddress}
                onChange={(event) =>
                  updateField("shippingAddress", event.target.value)
                }
              />
            </label>
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="h-12 bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isSubmitting ? "Creating order..." : "Place order"}
          </button>
        </form>

        <aside className="flex h-fit flex-col gap-5 border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Order summary</h2>

          {items.length === 0 ? (
            <p className="border-t border-neutral-100 pt-5 text-sm text-neutral-500">
              Your cart is empty.
            </p>
          ) : (
            <div className="flex flex-col gap-4 border-t border-neutral-100 pt-5">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-neutral-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.priceKurus * item.quantity, item.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between border-t border-neutral-100 pt-5 text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-semibold">
              {formatPrice(subtotalKurus, currency)}
            </span>
          </div>

          <p className="text-sm leading-6 text-neutral-500">
            This creates a pending order. Payment will be added later.
          </p>
        </aside>
      </section>
    </main>
  );
}
