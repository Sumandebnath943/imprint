import GalleryClient from "@/components/gallery/GalleryClient";
import type { GalleryItem } from "@/components/gallery/GalleryCard";

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
        const match = (entry.content || "").match(/\[Attached File: (.*?)\]/);
        if (match) {
          const fileUrl = match[1];
          const caption = entry.content.replace(/\[Attached File: .*?\]/, '').trim();
          
          let item_type = "photo";
          if (fileUrl.endsWith(".webm") || fileUrl.endsWith(".mp3")) item_type = "voice";
          else if (fileUrl.endsWith(".txt") || fileUrl.endsWith(".pdf")) item_type = "document";

          items.push({
            id: entry.id,
            user_id: entry.user_id,
            file_url: fileUrl,
            file_type: "image/png", 
            item_type: item_type as "photo" | "voice" | "document", 
            caption: caption || entry.title || undefined,
            created_at: entry.created_at,
            source: entry.is_forge_entry ? "forge" : "direct_upload" as "forge" | "direct_upload"
          });
        }
      }
    }
      
    return { items, userId: user.id };
  } catch { return empty; }
}

export default async function GalleryPage() {
  const { items, userId } = await getData();
  return <GalleryClient items={items} userId={userId} />;
}
