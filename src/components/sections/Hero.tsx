"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleCheck,
  ImageIcon,
  MessagesSquare,
  UserPlus,
} from "lucide-react";
import { HERO } from "@/constants/lp";
import { fadeUpItem, staggerContainer } from "@/lib/motion";

const TRUST_POINTS = [
  { icon: CircleCheck, label: "登録無料" },
  { icon: MessagesSquare, label: "企業と直接やり取り" },
  { icon: BriefcaseBusiness, label: "就職・案件・時間精算に対応" },
] as const;

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const [imageFailed, setImageFailed] = useState(false);

  const container = staggerContainer(prefersReducedMotion, {
    staggerChildren: 0.1,
    delayChildren: 0.05,
  });
  const fadeUp = fadeUpItem(prefersReducedMotion, { duration: 0.5 });

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[max(720px,calc(100svh-72px))] items-center overflow-hidden"
    >
      <div className="absolute inset-0 -z-30">
        {imageFailed ? (
          <div
            aria-hidden="true"
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground"
          >
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
            <p className="text-sm">画像を準備中です</p>
          </div>
        ) : (
          <Image
            src="/image/hero-engineer.png"
            alt="エンジニアと企業のマッチングプラットフォーム"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_15%] md:object-[78%_center]"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      {/* Overlays: flat dark wash, left-to-right gradient for text legibility, subtle bottom gradient */}
      <div className="absolute inset-0 -z-20 bg-black/25" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-20 bg-gradient-to-r from-[#08111F]/95 via-[#08111F]/65 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 -z-20 bg-gradient-to-t from-black/35 via-transparent to-transparent"
        aria-hidden="true"
      />
      {/* Slightly stronger wash on mobile so text stays legible without a side column to lean on */}
      <div
        className="absolute inset-0 -z-20 bg-black/15 md:hidden"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-24 md:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={container}
          className="max-w-2xl"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold text-cyan-300"
          >
            {HERO.eyebrow}
          </motion.p>

          <motion.h1
            id="hero-heading"
            variants={fadeUp}
            className="mt-4 text-4xl leading-tight font-bold tracking-tight text-balance text-white whitespace-pre-line sm:text-5xl lg:text-6xl"
          >
            {HERO.title}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed whitespace-pre-line text-white/90"
          >
            {HERO.description}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="#opportunities"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
            >
              {HERO.primaryCta}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/70 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {HERO.secondaryCta}
            </Link>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
          >
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 text-sm text-white/90"
              >
                <Icon className="h-4 w-4 text-white/90" aria-hidden="true" />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
