
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

      <div className="relative z-10 flex min-h-screen w-full flex-col justify-between lg:justify-center overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-[1680px] my-auto">

          {/* MOBILE COMPACT HEADER (Ide 1: Compact Horizontal Header for < 1024px) */}
          <div className="flex lg:hidden flex-col items-center justify-center gap-3 mb-5 sm:mb-7 w-full animate-fade-in">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <img
                src="/logo.png"
                alt="Logo KPP Pratama Kolaka DJP"
                className="w-auto h-9 sm:h-11 object-contain drop-shadow-md shrink-0"
              />
              <div className="h-6 sm:h-7 w-[1.5px] bg-white/45 rounded-full shrink-0 drop-shadow-sm" />
              <img
                src="/logofull.png"
                alt="Logo BOOKOLAKA"
                className="w-auto h-9 sm:h-11 object-contain drop-shadow-md shrink-0"
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-wide text-white uppercase drop-shadow-md">
                Smart Office Portal
              </h1>
              <p className="text-xs sm:text-sm font-medium text-white/85 tracking-normal drop-shadow-sm">
                Layanan Fasilitas & Tracking SPD Terintegrasi
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-10 xl:gap-16 w-full">
            {/* DESKTOP FULL HERO SECTION (Visible only on lg and above) */}
            <section className="hidden lg:flex flex-col items-start text-left w-full lg:flex-1 lg:min-w-0 lg:pr-6 xl:pr-12">
              <div className="w-full flex flex-col items-start gap-5">
                <div className="flex flex-wrap items-center justify-start gap-6 lg:gap-8 max-w-full">
                  <img
                    src="/logo.png"
                    alt="Logo KPP Pratama Kolaka DJP"
                    className="w-auto lg:h-20 xl:h-24 object-contain object-left drop-shadow-lg shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'%3E%3Crect width='240' height='80' rx='12' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgba(255,255,255,0.6)'%3ELogo%3C/text%3E%3C/svg%3E";
                    }}
                  />

                  <div className="lg:h-14 xl:h-16 w-[1.5px] bg-white/40 rounded-full shrink-0 drop-shadow-sm" />

                  <img
                    src="/logofull.png"
                    alt="Logo BOOKOLAKA"
                    className="w-auto lg:h-20 xl:h-24 object-contain object-left drop-shadow-lg shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/logoweb.png";
                    }}
                  />
                </div>

                <p className="mt-2 text-lg xl:text-xl leading-relaxed text-white/95 font-semibold max-w-2xl drop-shadow-md">
                  Portal terintegrasi layanan peminjaman fasilitas kantor, tracking perjalanan dinas (SPD), dan monitoring kehadiran kerja WFH/WFO.
                </p>
              </div>
            </section>

            <div className="w-full max-w-[400px] sm:max-w-[430px] lg:w-[420px] xl:w-[460px] lg:max-w-none lg:shrink-0 animate-fade-in mx-auto lg:mx-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
