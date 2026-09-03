import GalleryClient from "@/components/gallery/GalleryClient";
import type { GalleryItem } from "@/components/gallery/GalleryCard";

const AUDIO_EXT = ["webm", "mp3", "m4a", "wav", "ogg", "aac", "flac"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "avif", "heic", "svg"];

function extensionOf(url: string): string {
  return url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
}

/**
 * Fallback for rows saved before item_type was persisted. New rows carry the
 * type the uploader actually detected, so this only covers legacy data.
 */
function deriveItemType(url: string): GalleryItem["item_type"] {
  const ext = extensionOf(url);
  if (AUDIO_EXT.includes(ext)) return "voice";
  if (IMAGE_EXT.includes(ext)) return "photo";
  return "document";
}

function guessMimeType(url: string): string {
  const ext = extensionOf(url);
  if (AUDIO_EXT.includes(ext)) return `audio/${ext === "m4a" ? "mp4" : ext}`;
  if (IMAGE_EXT.includes(ext)) return `image/${ext === "jpg" ? "jpeg" : ext}`;
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
}

async function getData() {
  const empty = { items: [] as GalleryItem[], userId: "" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;
    
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
      
    const items: GalleryItem[] = [];
    if (data) {
      for (const entry of data) {
        // Prefer the stored column; fall back to the content marker for rows
        // written before response_file_url was persisted.
        const match = (entry.content || "").match(/\[Attached File: (.*?)\]/);
        const fileUrl: string | null = entry.response_file_url || (match ? match[1] : null);
        if (!fileUrl) continue;

        const caption = (entry.content || "")
          .replace(/\[Attached File: .*?\]/, "")
          .trim();

        items.push({
          id: entry.id,
          user_id: entry.user_id,
          file_url: fileUrl,
          file_type: guessMimeType(fileUrl),
          item_type: entry.item_type ?? deriveItemType(fileUrl),
          caption: caption || entry.title || undefined,
          created_at: entry.created_at,
          source: entry.source ?? (entry.is_forge_entry ? "forge" : "direct_upload"),
        });
      }
    }

    return { items, userId: user.id };
  } catch { return empty; }
}

export default async function GalleryPage() {
  const { items, userId } = await getData();
  return <GalleryClient items={items} userId={userId} />;
}
