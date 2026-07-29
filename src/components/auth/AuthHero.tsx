import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { BRAND } from "@/constants/lp";

interface AuthHeroProps {
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  imageFlip?: boolean;
  headline: string;
  description: string;
  bullets: readonly string[];
  children: ReactNode;
}

export function AuthHero({
  imageSrc,
  imageAlt,
  imagePosition = "center",
  imageFlip = false,
  headline,
  description,
  bullets,
  children,
}: AuthHeroProps) {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-10 object-cover"
        style={{
          objectPosition: imagePosition,
          transform: imageFlip ? "scaleX(-1)" : undefined,
        }}
      />

      {/* Overall wash — kept light so the photo's natural colors stay visible */}
      <div className="absolute inset-0 -z-10 bg-slate-950/30" aria-hidden="true" />
      {/* Left gradient for text legibility */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07101F]/85 via-[#111A35]/45 to-transparent"
        aria-hidden="true"
      />
      {/* Subtle bottom vignette */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/35 to-transparent"
        aria-hidden="true"
      />
      {/* Extra wash on mobile, where copy and card stack over more of the photo */}
      <div className="absolute inset-0 -z-10 bg-black/25 md:hidden" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid min-h-svh max-w-[1180px] items-center gap-6 px-5 py-12 md:px-8 lg:grid-cols-[minmax(420px,560px)_minmax(420px,500px)] lg:gap-8 lg:px-10 lg:py-0 xl:gap-10">
        <div className="flex h-full max-w-[520px] flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-700 motion-reduce:animate-none">
          <Link href="/" className="flex w-fit flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-white">
              {BRAND.name}
            </span>
            <span className="text-xs text-white/80">{BRAND.subtitle}</span>
          </Link>

          <div className="mt-6 lg:mt-10">
            <p className="text-2xl leading-tight font-bold tracking-tight whitespace-pre-line text-white sm:text-3xl lg:text-4xl xl:text-5xl">
              {headline}
            </p>
            <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-white/85">
              {description}
            </p>

            <ul className="mt-6 flex flex-col gap-3 lg:mt-8">
              {bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-center gap-2.5 text-sm text-white/90"
                >
                  <CircleCheck
                    className="h-4 w-4 shrink-0 text-cyan-300"
                    aria-hidden="true"
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center lg:justify-self-start">
          {children}
        </div>
      </div>
    </div>
  );
}
