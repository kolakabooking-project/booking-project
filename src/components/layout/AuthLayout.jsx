
export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 transition-colors duration-700">
      {/* Day Background Image (Visible in Light Mode) */}
      <img
        src="/kpp-building.png"
        alt="Gedung KPP Pratama Kolaka Siang"
        className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out opacity-95 dark:opacity-0 scale-100 dark:scale-105 pointer-events-none"
      />
      {/* Night Background Image (Visible in Dark Mode) */}
      <img
        src="/kpp-building-night.jpg"
        alt="Gedung KPP Pratama Kolaka Malam"
        className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out opacity-0 dark:opacity-95 scale-105 dark:scale-100 pointer-events-none"
      />

      {/* Dynamic Vignette Overlay (Adapts smoothly between Light/Day & Dark/Night) */}
      <div className="absolute inset-0 transition-colors duration-1000 ease-in-out bg-gradient-to-b from-blue-900/40 via-slate-900/35 to-slate-900/65 dark:from-[#1a2a4a]/70 dark:via-[#0f172a]/65 dark:to-[#090e1a]/90 pointer-events-none" />

      {/* Dynamic Ambient Lighting Beams/Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110vh] h-[45vh] rounded-b-full bg-blue-400/20 dark:bg-blue-500/10 blur-[80px] pointer-events-none transition-all duration-1000" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90vh] h-[50vh] rounded-t-full bg-amber-300/15 dark:bg-slate-900/45 blur-[80px] pointer-events-none transition-all duration-1000" />

      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-[1680px]">

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-10 xl:gap-16 w-full">
            <section className="flex flex-col mb-4 lg:mb-0 items-center lg:items-start text-center lg:text-left w-full lg:flex-1 lg:min-w-0 lg:pr-6 xl:pr-12">
              <div className="w-full flex flex-col items-center lg:items-start gap-4 sm:gap-5">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-8 max-w-full">
                  <img
                    src="/logo.png"
                    alt="Logo KPP Pratama Kolaka DJP"
                    className="w-auto h-14 sm:h-16 lg:h-20 xl:h-24 object-contain lg:object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] drop-shadow-[0_0_24px_rgba(0,0,0,0.8)] shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'%3E%3Crect width='240' height='80' rx='12' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgba(255,255,255,0.6)'%3ELogo%3C/text%3E%3C/svg%3E";
                    }}
                  />

                  <div className="h-10 sm:h-12 lg:h-14 xl:h-16 w-[1.5px] bg-white/40 rounded-full shrink-0 hidden sm:block drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

                  <img
                    src="/logofull.png"
                    alt="Logo BOOKOLAKA"
                    className="w-auto h-14 sm:h-16 lg:h-20 xl:h-24 object-contain lg:object-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] drop-shadow-[0_0_24px_rgba(0,0,0,0.8)] shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/logoweb.png";
                    }}
                  />
                </div>

                <p className="mt-2 text-sm sm:text-base md:text-lg xl:text-xl leading-relaxed text-white font-semibold max-w-2xl [text-shadow:_0_2px_12px_rgba(0,0,0,0.95),_0_1px_4px_rgba(0,0,0,0.95),_0_0_20px_rgba(0,0,0,0.8)]">
                  Portal terintegrasi layanan peminjaman fasilitas kantor, tracking perjalanan dinas (SPD), dan monitoring kehadiran kerja WFH/WFO.
                </p>
              </div>
            </section>

            <div className="w-full max-w-md lg:w-[420px] xl:w-[460px] lg:max-w-none lg:shrink-0 animate-fade-in mx-auto lg:mx-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
