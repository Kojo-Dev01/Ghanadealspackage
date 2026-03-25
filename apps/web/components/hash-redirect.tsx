import { redirect } from "next/navigation";

type HashRedirectProps = {
  hashPath: string;
};

export function HashRedirect({ hashPath }: HashRedirectProps) {
  redirect(`/#${hashPath}`);
  return null;
}
