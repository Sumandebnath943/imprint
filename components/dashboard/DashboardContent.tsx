"use client";

import type { DashboardData } from "@/lib/dashboard/types";
import GreetingRow from "@/components/dashboard/GreetingRow";
import HeroRow from "@/components/dashboard/HeroRow";
import SkillsRow from "@/components/dashboard/SkillsRow";
import ActivityRow from "@/components/dashboard/ActivityRow";
import BottomRow from "@/components/dashboard/BottomRow";

interface DashboardContentProps {
  data: DashboardData;
}

export default function DashboardContent({ data }: DashboardContentProps) {
  const { profile, driftScore, skills, nextChallenge, journalCountThisWeek, calibration, activityByDay, streak } = data;

  return (
    <div style={{ fontFamily: "Space Grotesk, sans-serif" }}>
      {/* `streak` is computed in the page from journal entries. GreetingRow and
          BottomRow used to read profile.streak_days, which is not a column on
          profiles, so both always rendered 0 while ActivityRow on the same
          screen showed the real number. */}
      <GreetingRow profile={profile} streak={streak} />
      <HeroRow
        driftScore={driftScore}
        nextChallenge={nextChallenge}
        calibration={calibration}
      />
      <SkillsRow skills={skills} />
      <ActivityRow journalCount={journalCountThisWeek} activityData={activityByDay} streak={streak} />
      <BottomRow
        profile={profile}
        calibration={calibration}
        nextChallenge={nextChallenge}
        streak={streak}
      />
    </div>
  );
}
