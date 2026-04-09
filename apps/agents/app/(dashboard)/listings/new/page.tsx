import { redirect } from "next/navigation";
import { AgentShell } from "@/components/agent-shell";
import { ListingFormWizard } from "@/components/listing-form-wizard";
import { createListing } from "@/lib/api";
import Link from "next/link";

export default function NewListingPage() {
  async function handleCreate(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const listingType = formData.get("listingType") as "sale" | "rent" | "new";
    const price = Number(formData.get("price")) || 0;
    const priceLabel = (formData.get("priceLabel") as string) || undefined;
    const region = formData.get("region") as string;
    const location = (formData.get("location") as string) || undefined;
    const type = formData.get("type") as string;
    const beds = Number(formData.get("beds")) || 0;
    const baths = Number(formData.get("baths")) || 0;
    const area = Number(formData.get("area")) || 0;
    const description = (formData.get("description") as string) || undefined;
    const image = (formData.get("image") as string) || undefined;
    const furnishing = (formData.get("furnishing") as string) || undefined;
    const parking = (formData.get("parking") as string) || undefined;

    let gallery: string[] | undefined;
    const galleryRaw = formData.get("gallery") as string;
    if (galleryRaw) {
      try { gallery = JSON.parse(galleryRaw); } catch { gallery = undefined; }
    }

    const amenitiesRaw = (formData.get("amenities") as string) || "";
    const amenities = amenitiesRaw
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const result = await createListing({
      title,
      listingType,
      price,
      priceLabel,
      region,
      location,
      type,
      beds,
      baths,
      area,
      description,
      image: gallery?.[0] ?? image,
      gallery,
      amenities: amenities.length > 0 ? amenities : undefined,
      furnishing,
      parking,
    });

    if (result.ok) {
      redirect("/listings?created=1");
    }
    redirect("/listings/new?error=" + encodeURIComponent(result.message));
  }

  return (
    <AgentShell
      eyebrow="Properties"
      title="Add New Listing"
      description="Submit a new property for review and approval."
      actions={
        <Link
          className="inline-flex items-center gap-1.5 bg-panel border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt hover:border-slate-300 transition-colors"
          href="/listings"
        >
          ← Back to Listings
        </Link>
      }
    >
      <ListingFormWizard action={handleCreate} />
    </AgentShell>
  );
}
