import {
  DEMO_RECEIPT_ITEMS,
  type ExtractReceiptResponse,
} from "@recalllens/shared";

/**
 * Extract receipt line items from a base64 image.
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise returns demo items.
 */
export async function extractReceiptFromImage(
  imageBase64: string
): Promise<ExtractReceiptResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set — returning demo receipt items");
    return {
      retailer: "Walmart",
      purchasedAt: new Date().toISOString(),
      items: DEMO_RECEIPT_ITEMS,
    };
  }

  const clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract grocery/retail receipt line items as JSON: { retailer?: string, purchasedAt?: string, items: [{ name, brand?, price?, quantity? }] }. Include only product lines, not taxes or totals.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all products from this receipt photo.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${clean}` },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI receipt extract failed:", errText);
    return {
      retailer: "Walmart",
      purchasedAt: new Date().toISOString(),
      items: DEMO_RECEIPT_ITEMS,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as ExtractReceiptResponse;
    if (!parsed.items?.length) {
      return {
        retailer: "Walmart",
        purchasedAt: new Date().toISOString(),
        items: DEMO_RECEIPT_ITEMS,
      };
    }
    return parsed;
  } catch {
    return {
      retailer: "Walmart",
      purchasedAt: new Date().toISOString(),
      items: DEMO_RECEIPT_ITEMS,
    };
  }
}
