import { z } from "zod";
import { mentorAction } from "@/lib/mentors/server";

const input = z.object({ mentor_bio: z.string().trim().min(12).max(1000), mentoring_style: z.array(z.string().max(40)).max(6).default([]), max_mentees: z.number().int().min(1).max(10) });

export async function POST(request: Request) {
  return mentorAction(request, input, "apply_to_mentor", ({ mentor_bio, mentoring_style, max_mentees }) => ({ p_bio: mentor_bio, p_style: mentoring_style, p_capacity: max_mentees }));
}
