import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Banner } from "../../types";

interface Props {
  banners: Banner[];
}

export default function HeroCarousel({ banners }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % banners.length),
    [banners.length]
  );

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, banners.length]);

  if (!banners.length) return null;

  const banner = banners[current];

  return (
    <div className="relative overflow-hidden">
      {/* Slide */}
      <div
        key={banner.id}
        className={`bg-gradient-to-br ${banner.bg} text-white py-24 px-4 transition-all duration-500`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {banner.title}
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">{banner.subtitle}</p>
          <Link
            to={banner.link}
            className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-light transition-colors shadow-lg"
          >
            {banner.cta} →
          </Link>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current ? "bg-white scale-125" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
