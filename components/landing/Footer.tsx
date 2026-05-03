"use client";

import Link from "next/link";


function XIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}


const FOOTER_LINKS = {
  Product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "The Engine", href: "#engine" },
    { label: "Drift Score", href: "#" },
    { label: "Vault", href: "#" },
  ],
  "For You": [
    { label: "Writers", href: "#" },
    { label: "Developers", href: "#" },
    { label: "Designers", href: "#" },
    { label: "All Professions", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Data Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-transparent mt-16 md:mt-24">
      <div 
        className="w-full relative rounded-t-[40px] md:rounded-t-[60px] overflow-hidden border-t border-[rgba(255,85,0,0.15)] isolate" 
        style={{ 
          background: "linear-gradient(180deg, #160601 0%, #050201 100%)",
          transform: "translateZ(0)",
        }}
      >
        
        {/* Massive Top-Edge Glow */}
        <div 
          className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none opacity-100 -z-10" 
          style={{ 
            background: "radial-gradient(100% 100% at 50% 0%, #FF5500 0%, rgba(255,60,0,0.5) 25%, rgba(10,2,0,0) 70%)" 
          }} 
        />
        <div 
          className="absolute top-0 left-0 right-0 h-[150px] pointer-events-none opacity-60 -z-10" 
          style={{ 
            background: "radial-gradient(100% 100% at 50% 0%, #FF7700 0%, rgba(255,119,0,0) 80%)" 
          }} 
        />

        <div className="max-w-[1440px] mx-auto relative z-10 px-8 md:px-16 pt-16 md:pt-20 pb-8 flex flex-col h-full">
          
          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-12 md:mb-16">
            {/* Left Side: Logo, Title, CTA */}
            <div className="max-w-xl">
              {/* Header-synced Logo & Brand */}
              <div className="flex items-center gap-0.5 mb-8">
                <span
                  className="text-[28px] font-bold text-white tracking-tight"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  IMPRINT
                </span>
                <span
                  className="w-2 h-2 rounded-full bg-[#FF5500] mb-4 ml-0.5"
                  style={{
                    boxShadow: "0 0 10px rgba(255,85,0,0.9)",
                  }}
                />
              </div>
              
              <h2 className="text-[32px] md:text-[44px] font-medium text-white/90 leading-[1.1] tracking-tight mb-4 max-w-[480px]">
                Protecting cognitive identity in the age of AI.
              </h2>
              <p className="text-[15px] text-white/40 mb-10 max-w-[400px]">
                Let&apos;s build something authentic.
              </p>

              {/* Glowing CTA */}
              <Link href="/signup">
                <button className="px-8 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95" style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.8) 0%, rgba(255,69,0,1) 100%)", border: "1px solid rgba(255,130,50,0.5)", boxShadow: "0 0 30px rgba(255,69,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)" }}>
                  Start Now
                </button>
              </Link>
            </div>

            {/* Right Side: Links */}
            <div className="flex flex-col sm:flex-row gap-16 md:gap-24 pr-0 lg:pr-10 pt-4">
              {/* Product */}
              <div>
                <h4 className="text-white font-bold mb-6 text-sm">Menu</h4>
                <ul className="space-y-4">
                  {FOOTER_LINKS["Product"].map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-white/60 hover:text-white transition-colors flex items-center gap-3 text-[14px]">
                        <span className="w-1 h-1 rounded-full bg-white/30" /> {link.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" className="text-white/60 hover:text-white transition-colors flex items-center gap-3 text-[14px]">
                      <span className="w-1 h-1 rounded-full bg-white/30" /> Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/60 hover:text-white transition-colors flex items-center gap-3 text-[14px]">
                      <span className="w-1 h-1 rounded-full bg-white/30" /> FAQs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/60 hover:text-white transition-colors flex items-center gap-3 text-[14px]">
                      <span className="w-1 h-1 rounded-full bg-white/30" /> Contact
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Company */}
              <div>
                <h4 className="text-white font-bold mb-6 text-sm">Explore Imprint</h4>
                <ul className="space-y-4">
                  {FOOTER_LINKS["Company"].map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-white/60 hover:text-white transition-colors flex items-center gap-3 text-[14px]">
                        <span className="w-1 h-1 rounded-full bg-white/30" /> {link.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" className="text-white/60 hover:text-white transition-colors flex items-center gap-3 text-[14px]">
                      <span className="w-1 h-1 rounded-full bg-white/30" /> Testimonials
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Socials */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-auto pt-8">
            <p className="text-[13px] text-white/30 mb-6 md:mb-0">
              © 2026 IMPRINT. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {[
                { Icon: XIcon, href: "#", label: "X / Twitter" },
                { Icon: InstagramIcon, href: "#", label: "Instagram" },
                { Icon: LinkedinIcon, href: "#", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
