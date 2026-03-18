import React from "react";

const panelStyle = {
  backgroundImage: "url('/Sona-main-Building.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

const lineOverlayStyle = {
  backgroundImage:
    "repeating-linear-gradient(164deg, rgba(255, 255, 255, 0.28) 0px, rgba(255, 255, 255, 0.12) 2px, rgba(255, 255, 255, 0) 24px), repeating-linear-gradient(172deg, rgba(255, 255, 255, 0.18) 0px, rgba(255, 255, 255, 0.08) 1px, rgba(255, 255, 255, 0) 20px)",
};

function AuthSplitLayout({
  title,
  subtitle,
  heroEyebrow = "Department of IT",
  heroTitle = "DRMS",
  heroDescription = "A Centralized Platform to store and manage departmental records of Information Technology Department.",
  children,
  footer,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] px-3 py-4 sm:px-6 sm:py-4 flex items-center justify-center">

      <div className="auth-card-rise relative mx-auto flex h-fit w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/30 bg-white/95 shadow-[0_35px_90px_rgba(2,6,23,0.68)] backdrop-blur-sm md:flex-row">
        <section
          className="relative hidden w-full items-end overflow-hidden p-6 sm:p-8 md:flex md:min-h-full md:w-[48%] md:p-8"
          style={panelStyle}
        >
          <div
            className="auth-panel-flow pointer-events-none absolute inset-0 opacity-35"
            style={lineOverlayStyle}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/65" />

          <div className="relative z-10 max-w-xs text-white">
            <p className="mb-5 text-xs tracking-[0.3em] text-white/80 [font-family:'DM_Sans',sans-serif]">
              {heroEyebrow}
            </p>
            <h2 className="text-5xl leading-[0.9] text-white [font-family:'Cormorant_Garamond',serif] sm:text-6xl">
              {heroTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 [font-family:'DM_Sans',sans-serif]">
              {heroDescription}
            </p>
          </div>
        </section>

        <section className="flex w-full items-center bg-[#f5f5f6] px-6 py-6 sm:px-8 md:w-[52%] md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-md text-slate-900 [font-family:'DM_Sans',sans-serif]">
            <div className="mb-4 flex items-center justify-center">
              <img
                src="/SONA_LOGO_HD.png"
                alt="Sona College Logo"
                className="h-24 w-auto object-contain"
                loading="eager"
              />
            </div>

            <h1 className="text-center text-4xl leading-tight text-slate-900 [font-family:'Cormorant_Garamond',serif] sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-center text-xs text-slate-500">
              {subtitle}
            </p>

            <div className="mt-6">{children}</div>

            {footer && <div className="mt-6 text-center text-xs text-slate-600">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthSplitLayout;
