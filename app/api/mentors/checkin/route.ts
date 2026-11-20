import { z } from "zod";
import { mentorAction } from "@/lib/mentors/server";

const input = z.object({ mentorship_id: z.uuid() });

export async function POST(request: Request) {
  return mentorAction(request, input, "check_in_with_mentor", ({ mentorship_id }) => ({ p_pair: mentorship_id }));
}
