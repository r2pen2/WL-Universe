import { notFound } from "next/navigation";
import { ComponentPage } from "@/components/ComponentPage";
import { allWebLegoSlugs, findWebLego } from "@/lib/loadDocs";

export function generateStaticParams() {
  return allWebLegoSlugs().map((slug) => ({ slug }));
}

export default function WebLegoComponentPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = findWebLego(params.slug);
  if (!item) notFound();
  return <ComponentPage item={item} />;
}
