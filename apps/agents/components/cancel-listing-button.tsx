"use client";

import { useRouter } from "next/navigation";
import { ListingFormWizard, type ListingFormData } from "./listing-form-wizard";

type Props = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<ListingFormData>;
  submitLabel?: string;
};

export function ListingFormWithCancel({ action, defaultValues, submitLabel }: Props) {
  const router = useRouter();
  return (
    <ListingFormWizard
      action={action}
      defaultValues={defaultValues}
      submitLabel={submitLabel}
      onCancel={() => router.push("/listings")}
    />
  );
}
