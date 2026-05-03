"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, User, Brain, Shield, ChevronDown, CheckCircle, Download, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface SettingsClientProps {
  profile: any;
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const [activeSection, setActiveSection] = useState("profile");
  
  const supabase = createClient();

  // Local state for Protocol
  const [protocolActive, setProtocolActive] = useState(profile?.ai_reduction_protocol_active || false);
  const [protocolLevel, setProtocolLevel] = useState(profile?.protocol_level || "Mindful Use");
  const [protocolDuration, setProtocolDuration] = useState(7);
  const [startingProtocol, setStartingProtocol] = useState(false);
  const [protocolEndDate, setProtocolEndDate] = useState<string | null>(profile?.protocol_end_date || null);

  let daysRemaining = protocolDuration;
  if (protocolActive && protocolEndDate) {
    const diff = new Date(protocolEndDate).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Connection state
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [checkingProviders, setCheckingProviders] = useState(true);

  // Notification state
  const [notificationPrefs, setNotificationPrefs] = useState<any>({
    vault_challenges: true,
    calibration_reminders: true,
    streak_reminders: true,
    circle_activity: true,
    time_capsule_unlocks: true,
    milestones: true,
    weekly_summary: false,
    course_launches: true,
    ...profile?.notification_preferences
  });

  // Calibration state
  const [calibrationFrequency, setCalibrationFrequency] = useState(profile?.calibration_frequency || "Bi-weekly");
  const [calibrationReminderDays, setCalibrationReminderDays] = useState(profile?.notification_preferences?.calibration_reminder_days || 2);
  const [nextCalibration, setNextCalibration] = useState<string | null>(null);

  // Data fetching on mount
  useEffect(() => {
    async function loadData() {
      // Get providers
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setConnectedProviders(data.user.app_metadata?.providers || []);
      }
      setCheckingProviders(false);

      if (profile?.id) {
        const { data: calData } = await supabase
          .from('calibration_sessions')
          .select('next_session_due')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (calData?.next_session_due) {
          setNextCalibration(new Date(calData.next_session_due).toLocaleDateString());
        } else {
          setNextCalibration("Available now");
        }
      }
    }
    loadData();
  }, [profile?.id, supabase]);

  const startProtocol = async () => {
    setStartingProtocol(true);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + protocolDuration);

    const { error } = await supabase.from('profiles').update({
      ai_reduction_protocol_active: true,
      protocol_level: protocolLevel,
      protocol_start_date: startDate.toISOString(),
      protocol_end_date: endDate.toISOString()
    }).eq('id', profile?.id);

    setStartingProtocol(false);
    if (error) {
      toast.error("Failed to start protocol.");
    } else {
      setProtocolEndDate(endDate.toISOString());
      setProtocolActive(true);
      toast.success(`Protocol started. ${protocolDuration} days. You've got this.`);
    }
  };

  const endProtocol = async () => {
    const { error } = await supabase.from('profiles').update({
      ai_reduction_protocol_active: false,
      protocol_level: null,
      protocol_start_date: null,
      protocol_end_date: null
    }).eq('id', profile?.id);

    if (error) {
      toast.error("Failed to end protocol.");
    } else {
      setProtocolActive(false);
      setProtocolEndDate(null);
      toast.success("Protocol ended early.");
    }
  };

  const exportData = () => {
    toast.success("Export ready. Downloading...");
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let strength = 0;
    if (pw.length >= 8) strength++;
    if (/[A-Z]/.test(pw)) strength++;
    if (/[0-9]/.test(pw)) strength++;
    if (/[^A-Za-z0-9]/.test(pw)) strength++;
    return strength; 
  };
  const strength = getPasswordStrength(newPassword);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleConnectGoogle = async () => {
    await supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: window.location.href } });
  };
  
  const handleDisconnectGoogle = async () => {
    const { data } = await supabase.auth.getUserIdentities();
    const googleIdentity = data?.identities?.find(i => i.provider === 'google');
    if (googleIdentity) {
      await supabase.auth.unlinkIdentity(googleIdentity);
      setConnectedProviders(prev => prev.filter(p => p !== 'google'));
      toast.success("Google account disconnected.");
    }
  };

  const handleToggleNotification = async (key: string, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    toast.success("Saved ✓", { duration: 1000, position: 'top-right' });
    await supabase.from('profiles').update({ notification_preferences: newPrefs }).eq('id', profile.id);
  };

  const handleCalibrationChange = async (freq: string) => {
    setCalibrationFrequency(freq);
    await supabase.from('profiles').update({ calibration_frequency: freq }).eq('id', profile.id);
    toast.success("Schedule updated.");
  };

  const handleReminderChange = async (days: number) => {
    setCalibrationReminderDays(days);
    const newPrefs = { ...notificationPrefs, calibration_reminder_days: days };
    setNotificationPrefs(newPrefs);
    await supabase.from('profiles').update({ notification_preferences: newPrefs }).eq('id', profile.id);
    toast.success("Reminder updated.");
  };

  const navItems = [
    { id: "profile", label: "Profile", section: "ACCOUNT" },
    { id: "security", label: "Password & Security", section: "ACCOUNT" },
    { id: "connections", label: "Connected Accounts", section: "ACCOUNT" },
    { id: "notifications", label: "Notifications", section: "PREFERENCES" },
    { id: "calibration", label: "Calibration Schedule", section: "PREFERENCES" },
    { id: "protocol", label: "AI Reduction Protocol", section: "IMPRINT ENGINE" },
    { id: "privacy", label: "Data & Privacy", section: "IMPRINT ENGINE" },
    { id: "delete", label: "Delete Account", section: "DANGER ZONE" },
  ];

  const sections = Array.from(new Set(navItems.map(i => i.section)));

  return (
    <div className="relative pt-12 pb-32 max-w-[1200px] mx-auto px-6 md:px-0">
      <div className="absolute top-0 right-[-10%] pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
        <span style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>CONTROL</span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start pt-10">
        
        {/* LEFT NAV */}
        <div className="w-full md:w-[240px] shrink-0 sticky top-[100px] rounded-[16px] overflow-hidden" style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="p-4 flex flex-col gap-6">
            {sections.map(sec => (
              <div key={sec}>
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-3 mb-2 block">{sec}</span>
                <ul className="flex flex-col gap-1">
                  {navItems.filter(i => i.section === sec).map(item => (
                    <li key={item.id}>
                      <button 
                        onClick={() => setActiveSection(item.id)}
                        className="w-full text-left px-3 py-2 text-[14px] rounded-[8px] transition-all"
                        style={activeSection === item.id 
                          ? { background: "rgba(255,85,0,0.10)", color: "white", borderLeft: "2px solid #FF5500" } 
                          : { color: "rgba(255,255,255,0.50)", borderLeft: "2px solid transparent" }}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANELS */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* PROFILE PANEL */}
          {activeSection === "profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-[18px] font-semibold text-white mb-1">Profile Overview</h2>
              <p className="text-[13px] text-white/40 mb-6">Your public identity on IMPRINT.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-[#FF5500]" style={{ background: "rgba(255,85,0,0.20)", border: "2px solid rgba(255,85,0,0.40)" }}>
                    {(profile?.full_name || "U")[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-[15px]">{profile?.full_name}</p>
                    <p className="text-[13px] text-white/50">@{profile?.username}</p>
                  </div>
                </div>
                <Link href="/dashboard/profile" className="text-[13px] text-[#FF5500] hover:underline">
                  Edit on Profile page →
                </Link>
              </div>
            </motion.div>
          )}

          {/* PASSWORD & SECURITY PANEL */}
          {activeSection === "security" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-[18px] font-semibold text-white mb-1">Password & Security</h2>
              <p className="text-[13px] text-white/40 mb-6">Manage your password.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />

              <div className="flex flex-col gap-4 max-w-sm">
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-full text-[14px] text-white outline-none" style={{ background: "#1A1A1A" }} />
                  <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-3 text-white/40 hover:text-white/80">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <input type={showNew ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-full text-[14px] text-white outline-none" style={{ background: "#1A1A1A" }} />
                  <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-3 text-white/40 hover:text-white/80">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {newPassword && (
                  <div className="flex gap-1 mb-2 px-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" 
                           style={{ background: i <= strength ? (strength < 2 ? "#EF4444" : strength < 3 ? "#EAB308" : strength < 4 ? "#3B82F6" : "#22C55E") : "#333" }} />
                    ))}
                  </div>
                )}

                <div className="relative mb-4">
                  <input type={showConfirm ? "text" : "password"} placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-full text-[14px] text-white outline-none" style={{ background: "#1A1A1A" }} />
                  <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-3 text-white/40 hover:text-white/80">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleUpdatePassword} disabled={updatingPassword} className="px-6 py-2 rounded-full text-[14px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "#FF5500" }}>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONNECTED ACCOUNTS PANEL */}
          {activeSection === "connections" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-[18px] font-semibold text-white mb-1">Connected Accounts</h2>
              <p className="text-[13px] text-white/40 mb-6">Connect social accounts for quick login.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />

              {!checkingProviders && (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-[12px] gap-4" style={{ background: "#1A1A1A" }}>
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[15px] font-medium text-white">Google</span>
                  </div>
                  
                  {connectedProviders.includes('google') ? (
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-white/40">{profile?.email}</span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-medium text-[#00D97E]" style={{ background: "rgba(0,217,126,0.15)" }}>Connected</span>
                      <button onClick={handleDisconnectGoogle} className="px-4 py-1.5 rounded-full text-[13px] text-white/70 bg-white/5 hover:bg-white/10 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-white/40">Not connected</span>
                      <button onClick={handleConnectGoogle} className="px-4 py-1.5 rounded-full text-[13px] text-white bg-white/5 hover:bg-white/10 transition-colors">
                        Connect Google
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* NOTIFICATIONS PANEL */}
          {activeSection === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[18px] font-semibold text-white">Notifications</h2>
              </div>
              <p className="text-[13px] text-white/40 mb-6">Choose what IMPRINT alerts you about.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />

              <div className="flex flex-col gap-6">
                {[
                  { key: 'vault_challenges', label: 'Vault Challenge Reminders', desc: 'Notify when a skill is decaying and a challenge is due.' },
                  { key: 'calibration_reminders', label: 'Calibration Session Reminders', desc: 'Remind me when my bi-weekly calibration is due.' },
                  { key: 'streak_reminders', label: 'Streak Reminders', desc: "Remind me to journal if I haven't written today." },
                  { key: 'circle_activity', label: 'Circle Activity', desc: 'Notify when someone posts a check-in in my circles.' },
                  { key: 'time_capsule_unlocks', label: 'Time Capsule Unlocks', desc: 'Notify when a time capsule is ready to be opened.' },
                  { key: 'milestones', label: 'Milestone Achievements', desc: 'Celebrate streak milestones and IMPRINT Score improvements.' },
                  { key: 'weekly_summary', label: 'Weekly Summary', desc: 'A weekly digest of your IMPRINT activity.' },
                  { key: 'course_launches', label: 'Course Launch Notifications', desc: 'Alert when new courses are available in my cluster.' }
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between">
                    <div>
                      <p className="text-[15px] font-medium text-white mb-0.5">{item.label}</p>
                      <p className="text-[13px] text-white/40 max-w-[300px]" style={{ lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleNotification(item.key, !notificationPrefs[item.key])}
                      className="w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0"
                      style={{ background: notificationPrefs[item.key] ? "#FF5500" : "#1A1A1A" }}
                    >
                      <motion.div 
                        className="absolute top-1 bottom-1 w-4 rounded-full bg-white shadow-sm"
                        animate={{ left: notificationPrefs[item.key] ? 24 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CALIBRATION SCHEDULE PANEL */}
          {activeSection === "calibration" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-[18px] font-semibold text-white mb-1">Calibration Schedule</h2>
              <p className="text-[13px] text-white/40 mb-6">How often IMPRINT checks your drift.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />

              <div className="mb-8 p-3 rounded-[10px]" style={{ background: "rgba(255,184,0,0.06)", border: "1px solid rgba(255,184,0,0.15)" }}>
                <p className="text-[13px] italic" style={{ color: "rgba(255,184,0,0.80)" }}>
                  Bi-weekly is the recommended cadence for meaningful drift measurement. Changing it affects the accuracy of your Drift Score.
                </p>
              </div>

              <div className="mb-8">
                <label className="text-[13px] font-medium text-white/40 uppercase mb-3 block">Session frequency</label>
                <div className="flex flex-wrap gap-2">
                  {["Weekly", "Bi-weekly", "Monthly"].map(freq => (
                    <button key={freq} onClick={() => handleCalibrationChange(freq)} className="px-4 py-2 rounded-full text-[13px] transition-all" style={calibrationFrequency === freq ? { background: "#FF5500", color: "white" } : { background: "#1A1A1A", color: "white/70" }}>
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[13px] font-medium text-white/40 uppercase mb-3 block">Remind me before session is due</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "1 day", val: 1 }, 
                    { label: "2 days", val: 2 }, 
                    { label: "3 days", val: 3 }, 
                    { label: "1 week", val: 7 }
                  ].map(opt => (
                    <button key={opt.val} onClick={() => handleReminderChange(opt.val)} className="px-4 py-2 rounded-full text-[13px] transition-all" style={calibrationReminderDays === opt.val ? { background: "rgba(255,85,0,0.20)", color: "#FF5500", border: "1px solid rgba(255,85,0,0.40)" } : { background: "#1A1A1A", color: "white/70", border: "1px solid transparent" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <span className="text-[13px] text-white/40 mr-2">Next calibration:</span>
                <span className="text-[14px] font-medium" style={{ color: nextCalibration === "Available now" ? "#FF5500" : "white" }}>
                  {nextCalibration || "Loading..."}
                </span>
              </div>
            </motion.div>
          )}

          {/* AI PROTOCOL PANEL */}
          {activeSection === "protocol" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-[18px] font-semibold text-white mb-1">AI Reduction Protocol</h2>
              <p className="text-[13px] text-white/40 mb-6">A voluntary commitment to use AI less.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />

              {!protocolActive ? (
                <div className="text-center py-6">
                  <Brain size={32} className="mx-auto mb-4 text-white/15" />
                  <p className="text-[16px] font-medium text-white mb-1">No reduction protocol active.</p>
                  <p className="text-[14px] text-white/40 mb-8">Start one when your Drift Score signals it's needed.</p>
                  
                  <div className="text-left mb-6">
                    <label className="text-[13px] font-medium text-white/60 mb-2 block">Duration</label>
                    <div className="flex gap-2">
                      {[3, 7, 14, 30].map(d => (
                        <button key={d} onClick={() => setProtocolDuration(d)} className="px-4 py-2 rounded-full text-[13px] transition-all" style={protocolDuration === d ? { background: "#FF5500", color: "white" } : { background: "#1A1A1A", color: "white" }}>
                          {d} days
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-left mb-8 flex flex-col gap-3">
                    <label className="text-[13px] font-medium text-white/60 mb-1 block">Commitment Level</label>
                    {[
                      { title: "Mindful Use", desc: "Pause before using AI for any task. Ask: can I do this myself?" },
                      { title: "Reduced Use", desc: "Limit AI to research only. No writing, drafting, or deciding." },
                      { title: "Full Forge Mode", desc: "Zero AI tool usage for the duration. The Forge handles everything." }
                    ].map(lvl => (
                      <button key={lvl.title} onClick={() => setProtocolLevel(lvl.title)} className="p-4 rounded-[12px] border text-left transition-all" style={protocolLevel === lvl.title ? { background: "rgba(255,85,0,0.06)", borderColor: "rgba(255,85,0,0.30)" } : { background: "#1A1A1A", borderColor: "transparent" }}>
                        <p className="font-medium text-white text-[15px] mb-1">{lvl.title}</p>
                        <p className="text-[13px] text-white/50">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>

                  <button onClick={startProtocol} disabled={startingProtocol} className="w-full py-3 rounded-full font-medium text-white transition-all hover:opacity-90" style={{ background: "#FF5500" }}>
                    {startingProtocol ? "Starting..." : "Start Protocol"}
                  </button>
                </div>
              ) : (
                <div className="rounded-[14px] p-6" style={{ background: "rgba(255,85,0,0.06)", border: "1px solid rgba(255,85,0,0.20)" }}>
                  <span className="block text-[11px] font-bold text-[#FF5500] uppercase tracking-widest mb-2">PROTOCOL ACTIVE</span>
                  <p className="text-[14px] text-white mb-1">Started: Today</p>
                  <p className="text-[16px] font-bold text-[#FF5500] mb-4">{daysRemaining} days remaining</p>
                  
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-[#FF5500]" style={{ width: '10%' }} />
                  </div>
                  
                  <p className="text-[14px] text-white/50 italic mb-6">"{protocolLevel}"</p>
                  
                  <button onClick={endProtocol} className="text-[13px] text-red-400 hover:text-red-300 transition-colors">
                    End Protocol Early
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* DATA & PRIVACY PANEL */}
          {activeSection === "privacy" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-[18px] font-semibold text-white mb-1">Data & Privacy</h2>
              <p className="text-[13px] text-white/40 mb-6">You own your data. Always.</p>
              <div className="h-[1px] w-full bg-white/5 mb-6" />

              <div className="flex items-start gap-3 p-4 rounded-[12px] mb-8" style={{ background: "rgba(0,217,126,0.04)", border: "1px solid rgba(0,217,126,0.15)" }}>
                <CheckCircle size={18} color="#00D97E" className="mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium text-white mb-1">Your data belongs to you.</p>
                  <p className="text-[13px] text-white/60">IMPRINT never sells your data. Your baseline, journal, and beliefs are private and encrypted.</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                <div>
                  <p className="text-[15px] font-medium text-white mb-1">Export All My Data</p>
                  <p className="text-[13px] text-white/50">Download everything as JSON.</p>
                </div>
                <button onClick={exportData} className="px-4 py-2 rounded-full text-[13px] text-white bg-white/5 hover:bg-white/10 transition-colors">Export Data</button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-white mb-1">Leaderboard Visibility</p>
                  <p className="text-[13px] text-white/50">Show me on the global leaderboard.</p>
                </div>
                <div className="w-11 h-6 rounded-full bg-[#FF5500] relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
            </motion.div>
          )}

          {/* DANGER ZONE PANEL */}
          {activeSection === "delete" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-8" style={{ background: "rgba(255,45,45,0.04)", border: "1px solid rgba(255,45,45,0.15)" }}>
              <h2 className="text-[18px] font-semibold text-[#FF2D2D] mb-1">Danger Zone</h2>
              <p className="text-[13px] text-[#FF2D2D]/60 mb-6">Irreversible actions.</p>
              <div className="h-[1px] w-full bg-[#FF2D2D]/20 mb-6" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium text-white mb-1">Delete Account</p>
                  <p className="text-[13px] text-white/50 max-w-[300px]">Permanently delete your account and all associated data. This cannot be undone. Ever.</p>
                </div>
                <button className="px-6 py-2.5 rounded-full text-[14px] font-medium text-[#FF2D2D] border border-[#FF2D2D]/30 hover:bg-[#FF2D2D]/10 transition-colors shrink-0">
                  Delete Account
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
