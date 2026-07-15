import { NextResponse } from "next/server";
import { internalApiUrl } from "../../products/product-data";

export async function POST(request: Request) {
  const payload = await request.json();

  const response = await fetch(`${internalApiUrl}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({
    message: "Unable to create order.",
  }))) as unknown;

  return NextResponse.json(data, {
    status: response.status,
  });
}
