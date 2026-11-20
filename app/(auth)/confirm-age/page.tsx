import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import AgeAccountActions from "@/components/auth/AgeAccountActions";
import { hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { AUTH_RESUME_PATH } from "@/lib/auth/resume";
import { createClient } from "@/lib/supabase/server";

export default async function ConfirmAgePage({ searchParams }: { searchParams: { error?: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/signin");
  if (hasConfirmedAdultAge(user)) redirect(AUTH_RESUME_PATH);

  return (
    <AuthShell topRightSlot={null}>
      <main className="mx-auto max-w-[460px] space-y-5 rounded-[28px] bg-white p-8 text-[#1A1A1A] sm:p-11">
        <h1 className="text-3xl font-bold">Confirm your age</h1>
        <p>Imprint is available to people aged 18 and older.</p>
        <form action="/auth/confirm-age" method="post" className="space-y-4">
          <label className="flex items-start gap-2">
            <input name="adult" value="yes" type="checkbox" required className="mt-1 accent-[#FF5500]" />
            I confirm that I’m 18 or older.
          </label>
          <button type="submit" className="w-full rounded-full bg-[#FF5500] px-5 py-3 font-medium text-black">Continue to Imprint</button>
          {searchParams.error === "save" && <p role="alert" className="text-sm text-red-700">We couldn’t save your confirmation. Please try again.</p>}
        </form>
        <AgeAccountActions />
        <Link href="/privacy" className="text-sm underline">Privacy policy</Link>
      </main>
    </AuthShell>
  );
}
