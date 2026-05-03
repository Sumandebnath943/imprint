"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";

const finalStatement = "The machine is not more interesting than you.";
const words = finalStatement.split(" ");

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function AboutClient() {
  return (
    <div className="relative pt-[120px] pb-32">
      {/* Orange Glow */}
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,85,0,0.15) 0%, rgba(255,85,0,0) 70%)",
          filter: "blur(60px)",
          animation: "pulse 8s ease-in-out infinite alternate"
        }} />

      {/* GHOST TEXT */}
      <div className="absolute top-[10%] right-0 pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
        <span style={{ fontSize: 200, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>WHY</span>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12">
        {/* SECTION 1: HERO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-40 pt-10">
          <div className="inline-block px-4 py-1.5 rounded-full mb-8 font-bold tracking-widest uppercase"
            style={{ background: "rgba(255,85,0,0.12)", border: "1px solid rgba(255,85,0,0.25)", color: "#FF5500", fontSize: 12 }}>
            The Philosophy
          </div>
          <h1 className="font-bold mb-6" style={{ fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 0.95, maxWidth: 700 }}>
            <span className="text-white block">We are losing ourselves</span>
            <span className="text-white block">to the machines</span>
            <span style={{ color: "#FF5500" }}>we built.</span>
          </h1>
          <p className="text-[18px] md:text-[20px]" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 560, lineHeight: 1.7 }}>
            Not dramatically. Not all at once. Quietly — one delegated thought at a time. IMPRINT exists because someone has to care about what happens to the human mind when it stops being asked to work.
          </p>
        </motion.div>

        {/* SECTION 2: THE PROBLEM */}
        <div className="relative mb-40">
          <div className="absolute top-20 left-[-5%] pointer-events-none select-none overflow-hidden" style={{ zIndex: 0 }}>
            <span style={{ fontSize: 160, fontWeight: 700, color: "#fff", opacity: 0.03, lineHeight: 1 }}>DRIFT</span>
          </div>

          <div className="flex flex-col md:flex-row gap-16 relative z-10">
            {/* Sticky Left Column */}
            <div className="md:w-[400px] shrink-0">
              <div className="sticky top-[120px]">
                <span className="text-[13px] font-bold uppercase tracking-widest mb-4 block" style={{ color: "#FF5500" }}>/01</span>
                <h2 className="font-bold mb-6" style={{ fontSize: "clamp(36px, 4vw, 48px)", lineHeight: 1.1 }}>
                  <span className="text-white block">Echo Drift.</span>
                  <span style={{ color: "#FF5500" }}>The slow erosion.</span>
                </h2>
                <p className="text-[17px]" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
                  Echo Drift is what happens when a human mind is consistently relieved of its cognitive responsibilities. It is not sudden. It is not dramatic. It is a gradual narrowing — of vocabulary, of reasoning depth, of creative instinct — that only becomes visible in retrospect.
                </p>
              </div>
            </div>
            
            {/* Scrollable Right Column */}
            <div className="flex-1 flex flex-col gap-10 mt-10 md:mt-0">
              {[
                { title: "The mechanism", body: "Every time you ask an AI to draft your email, summarize your document, or tell you what to decide — you are not just saving time. You are practicing NOT using a cognitive capability. And like any muscle, the capability responds to that practice." },
                { title: "The timeline", body: "The research on skill atrophy is unambiguous. A capability unused for 60–90 days shows measurable decline. A capability unused for 6 months shows significant degradation. A year of delegation, and the skill you had feels like someone else's memory." },
                { title: "The invisibility", body: "The most dangerous thing about Echo Drift is that you don't feel it happening. You feel more productive. More efficient. The AI makes you feel capable precisely as your underlying capability erodes. By the time you notice — you've been noticing for months without naming it." },
                { title: "The test", body: "Open a blank document right now. Write 300 words on something you know deeply — without AI, without notes, without search. How does it feel? That feeling is data." }
              ].map((b, i) => (
                <motion.div key={b.title} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={fadeUpVariant}
                  className="p-8 rounded-[20px]" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-white mb-3" style={{ fontSize: 20 }}>{b.title}</h3>
                  <p className="text-[16px]" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.7 }}>{b.body}</p>
                  {i === 3 && (
                    <Link href="/signup" className="inline-block mt-6 px-6 py-3 rounded-full text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: "#FF5500" }}>
                      Begin your Baseline Imprint →
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: TWO BELIEFS */}
        <div className="mb-40 text-center">
          <span className="text-[13px] font-bold uppercase tracking-widest mb-4 block" style={{ color: "#FF5500" }}>/02</span>
          <h2 className="font-bold mb-16 mx-auto" style={{ fontSize: "clamp(40px, 5vw, 56px)", lineHeight: 1 }}>
            <span className="text-white block">Two beliefs.</span>
            <span style={{ color: "#FF5500" }}>Everything else follows.</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-8 text-left">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="flex-1 relative rounded-[24px] p-10 overflow-hidden flex flex-col" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="absolute top-4 left-6 font-bold" style={{ fontSize: 64, color: "rgba(255,85,0,0.15)" }}>01</span>
              <div className="relative z-10 flex-1 pt-8">
                <h3 className="font-semibold text-white mb-4" style={{ fontSize: 28 }}>Your mind is worth protecting.</h3>
                <p className="text-[16px]" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                  Not as a productivity asset. Not as a competitive advantage. As the irreplaceable, singular, deeply human thing it is. There is no AI that thinks like you. There never will be. But there could be a version of you that thinks less like you — if you let it happen.
                </p>
              </div>
              <div className="w-10 h-0.5 mt-10" style={{ background: "#FF5500" }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              className="flex-1 relative rounded-[24px] p-10 overflow-hidden flex flex-col" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="absolute top-4 left-6 font-bold" style={{ fontSize: 64, color: "rgba(255,85,0,0.15)" }}>02</span>
              <div className="relative z-10 flex-1 pt-8">
                <h3 className="font-semibold text-white mb-4" style={{ fontSize: 28 }}>Measurement creates accountability.</h3>
                <p className="text-[16px]" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                  You cannot protect what you cannot see. IMPRINT gives your identity a score — not to judge you, but to show you the direction of travel. A Drift Score of 12 is proof you are still yourself. A Drift Score of 71 is a call to action. Both are more useful than not knowing.
                </p>
              </div>
              <div className="w-10 h-0.5 mt-10" style={{ background: "#FF5500" }} />
            </motion.div>
          </div>
        </div>

        {/* SECTION 4: WHAT IT IS NOT */}
        <div className="mb-40">
          <span className="text-[13px] font-bold uppercase tracking-widest mb-4 block" style={{ color: "#FF5500" }}>/03</span>
          <h2 className="font-bold mb-16" style={{ fontSize: "clamp(36px, 4vw, 48px)", lineHeight: 1.1 }}>
            <span className="text-white block">Let&apos;s be clear</span>
            <span style={{ color: "#FF5500" }}>about what this isn&apos;t.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {[
              { title: "Not anti-AI.", body: "IMPRINT does not believe AI is the enemy. AI is a tool. Tools don't create dependency — humans do. IMPRINT is for humans who want to use AI as a tool, not become one." },
              { title: "Not a productivity app.", body: "We are not interested in your output. We are interested in your capability. Those are not the same thing, and the difference matters more than most people currently realize." },
              { title: "Not a journal or wellness app.", body: "IMPRINT is an engine with a measurement system. It has opinions. It will tell you when your score is going the wrong direction. It is not here to validate — it is here to reflect." },
              { title: "Not for everyone.", body: "IMPRINT requires honesty, consistency, and a willingness to confront your own drift. If you want something that tells you you're doing great regardless of your data — this is not that." }
            ].map((n, i) => (
              <motion.div key={n.title} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { delay: i * 0.1 } } }}>
                <h3 className="font-semibold text-white mb-3" style={{ fontSize: 20 }}>{n.title}</h3>
                <p className="text-[16px]" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{n.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 5: ORIGIN */}
        <div className="mb-40">
          <span className="text-[13px] font-bold uppercase tracking-widest mb-4 block text-center md:text-left" style={{ color: "#FF5500" }}>/04</span>
          <h2 className="font-bold mb-10 text-center md:text-left" style={{ fontSize: "clamp(36px, 4vw, 48px)", lineHeight: 1.1 }}>
            <span style={{ color: "#FF5500" }}>Why we built this.</span>
          </h2>
          
          <div className="max-w-[640px] mx-auto md:mx-0">
            <p className="text-[18px] mb-6" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.8 }}>
              IMPRINT started with a single observation: the most capable people we knew were becoming less capable — and they didn&apos;t notice, because their AI tools were making their output better even as their instincts atrophied.
            </p>
            <p className="text-[18px]" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.8 }}>
              We built IMPRINT because we wanted a way to check. A way to say: set aside the tools for 20 minutes. Answer from your own mind. Compare it to who you were 3 months ago. See the truth.<br/><br/>It turns out the truth is worth seeing.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-12">
              <Link href="/signup" className="w-full sm:w-auto rounded-full px-8 py-3.5 font-medium text-white text-center transition-all hover:opacity-90" style={{ background: "#FF5500" }}>Begin Your Imprint →</Link>
              <button disabled className="w-full sm:w-auto rounded-full px-8 py-3.5 font-medium text-center transition-all opacity-50 cursor-not-allowed" style={{ border: "1px solid rgba(255,255,255,0.20)", color: "white" }}>Read the science →</button>
            </div>
          </div>
        </div>

        {/* SECTION 6: FINAL STATEMENT */}
        <div className="py-32 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,85,0,0.15) 0%, rgba(255,85,0,0) 70%)", filter: "blur(80px)" }} />
          
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="font-bold mb-8 relative z-10 mx-auto" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95, maxWidth: 800, display: "inline-block" }}>
            {words.map((word, i) => {
              const isHighlight = i === words.length - 1; // "you."
              return (
                <motion.span key={i} className="inline-block mr-3 md:mr-4 mb-2"
                  variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  style={{ color: isHighlight ? "#FF5500" : "white" }}>
                  {word}
                </motion.span>
              );
            })}
          </motion.h2>
          
          <p className="text-[18px] md:text-[20px] mx-auto mb-12 relative z-10" style={{ color: "rgba(255,255,255,0.50)", maxWidth: 480 }}>
            Your thinking. Your voice. Your instincts. They are worth protecting.
          </p>
          <Link href="/signup" className="inline-block rounded-full px-10 py-4 font-bold text-white text-[16px] relative z-10 transition-all hover:scale-105" style={{ background: "#FF5500", boxShadow: "0 10px 30px rgba(255,85,0,0.3)" }}>
            Begin Your Imprint →
          </Link>
        </div>
      </div>
    </div>
  );
}
