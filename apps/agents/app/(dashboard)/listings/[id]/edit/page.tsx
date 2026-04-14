import { redirect, notFound } from "next/navigation";
import { AgentShell } from "@/components/agent-shell";
import { ListingFormWizard } from "@/components/listing-form-wizard";
import { FormButton } from "@/components/form-button";
import { fetchListingById, updateListing, deleteListing } from "@/lib/api";
import Link from "next/link";

type EditListingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const listing = await fetchListingById(id);

  if (!listing) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
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

    const latRaw = formData.get("latitude") as string;
    const lngRaw = formData.get("longitude") as string;
    const latitude = latRaw ? Number(latRaw) : undefined;
    const longitude = lngRaw ? Number(lngRaw) : undefined;

    let floorPlans: string[] | undefined;
    const floorPlansRaw = formData.get("floorPlans") as string;
    if (floorPlansRaw) {
      try { floorPlans = JSON.parse(floorPlansRaw); } catch { floorPlans = undefined; }
    }

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

    const result = await updateListing(id, {
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
      amenities: amenities.length > 0 ? amenities : [],
      furnishing,
      parking,
      latitude: latitude && !Number.isNaN(latitude) ? latitude : undefined,
      longitude: longitude && !Number.isNaN(longitude) ? longitude : undefined,
      floorPlans,
    });

    if (result.ok) {
      redirect("/listings?updated=1");
    }
    redirect(`/listings/${id}/edit?error=` + encodeURIComponent(result.message));
  }

  async function handleDelete() {
    "use server";
    const result = await deleteListing(id);
    if (result.ok) {
      redirect("/listings?deleted=1");
    }
    redirect(`/listings/${id}/edit?error=` + encodeURIComponent(result.message));
  }

  return (
    <AgentShell
      eyebrow="Properties"
      title="Edit Listing"
      description={`Editing: ${listing.title}`}
      actions={
        <Link
          className="inline-flex items-center gap-1.5 bg-panel border border-border text-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-panel-alt hover:border-slate-300 transition-colors"
          href="/listings"
        >
          ← Back to Listings
        </Link>
      }
    >
      <ListingFormWizard
        action={handleUpdate}
        submitLabel="Save Changes"
        defaultValues={{
          title: listing.title,
          listingType: listing.listingType as "sale" | "rent" | "new",
          type: listing.type,
          price: String(listing.price),
          priceLabel: listing.priceLabel ?? "",
          region: listing.region,
          location: listing.location ?? "",
          beds: String(listing.beds),
          baths: String(listing.baths),
          area: String(listing.area),
          furnishing: listing.furnishing ?? "",
          parking: listing.parking ?? "",
          description: listing.description ?? "",
          amenities: listing.amenities?.join(", ") ?? "",
          gallery: listing.gallery?.length ? listing.gallery : (listing.image ? [listing.image] : []),
          latitude: listing.latitude != null ? String(listing.latitude) : "",
          longitude: listing.longitude != null ? String(listing.longitude) : "",
          floorPlans: listing.floorPlans ?? [],
        }}
      />

      {/* Delete section */}
      <section className="bg-panel border border-red-200 dark:border-red-900 rounded-xl shadow-sm p-6 mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-2">Danger Zone</h2>
        <p className="text-xs text-muted mb-4">
          Permanently delete this listing. This action cannot be undone.
        </p>
        <form action={handleDelete}>
          <FormButton
            type="submit"
            pendingText="Deleting…"
            className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Delete Listing
          </FormButton>
        </form>
      </section>
    </AgentShell>
  );
}
