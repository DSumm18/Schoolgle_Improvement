import type { ExtractedProduct } from "../extractors/base";

type ProductPatch = Partial<
  Pick<
    ExtractedProduct,
    "name" | "description" | "pack_quantity" | "pack_unit" | "category"
  >
>;

const KNOWN_PRODUCT_PATCHES: Array<{
  matches: RegExp;
  patch: ProductPatch;
}> = [
  {
    matches: /ypo\.co\.uk\/product\/detail\/.*\/110787(?:\?|$)/i,
    patch: {
      name: "A4 Rey Copy Paper 80gsm - 5 Reams (2500 sheets)",
      description:
        "Rey Copy A4 white 80gsm case of 5 reams. FSC certified, suitable for daily printing and copying in school offices and classrooms.",
      pack_quantity: 5,
      pack_unit: "ream",
      category: "copy-paper",
    },
  },
  {
    matches: /espo\.org\/multi-purpose-paper-96520\.html(?:\?|$)/i,
    patch: {
      name: "Shires A4 Multi-Purpose Paper 80gsm - Box of 5 Reams",
      description:
        "Shires A4 multi-purpose paper, 80gsm. Box of 5 reams of 500 sheets, suitable for printing, copying and faxing.",
      pack_quantity: 5,
      pack_unit: "ream",
      category: "copy-paper",
    },
  },
];

export function normaliseSupplierProduct(
  product: ExtractedProduct,
  requestedUrl: string = product.source_url,
): ExtractedProduct {
  const url = requestedUrl || product.source_url;
  const patch = KNOWN_PRODUCT_PATCHES.find((entry) => entry.matches.test(url));

  if (!patch) return product;

  return {
    ...product,
    ...patch.patch,
    source_url: product.source_url || requestedUrl,
  };
}
