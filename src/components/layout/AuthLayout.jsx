
export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/kpp-building.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,25,65,0.92),rgba(23,44,104,0.82),rgba(15,23,42,0.86))] dark:bg-[linear-gradient(135deg,rgba(3,8,19,0.94),rgba(11,24,48,0.9),rgba(15,23,42,0.96))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,201,27,0.22),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_20%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,201,27,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(142,164,255,0.12),transparent_20%)]" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full border border-white/10 bg-djp-yellow/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-16">
        <div className="mx-auto w-full max-w-[1680px]">

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-10 xl:gap-16 w-full">
            <section className="flex flex-col mb-4 lg:mb-0 items-center lg:items-start text-center lg:text-left w-full lg:flex-1 lg:min-w-0 lg:pr-6 xl:pr-12">
              <div className="w-full flex flex-col items-center lg:items-start gap-3 sm:gap-4">
                <img
                  src="/logo.png"
                  alt="Logo BOOKOLAKA"
                  className="w-auto h-14 sm:h-16 lg:h-20 xl:h-24 object-contain lg:object-left drop-shadow-xl shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'%3E%3Crect width='240' height='80' rx='12' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.2)' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='bold' fill='rgba(255,255,255,0.6)'%3ELogo (Landscape)%3C/text%3E%3C/svg%3E";
                  }}
                />

                <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-heading font-extrabold leading-[1.18] text-white drop-shadow-md tracking-tight break-words">
                  BOOKOLAKA - Smart Booking System
                </h1>

                <p className="mt-2 text-sm sm:text-base md:text-lg xl:text-xl 2xl:text-2xl leading-relaxed text-white/80 font-medium drop-shadow-sm max-w-2xl">
                  Sentralisasi layanan peminjaman fasilitas kantor.
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
