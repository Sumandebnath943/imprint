import { z } from "zod";
import { mentorAction } from "@/lib/mentors/server";

export async function POST(request: Request) {
  return mentorAction(request, z.object({ open: z.boolean() }), "set_mentor_availability", ({ open }) => ({ p_open: open }));
}
