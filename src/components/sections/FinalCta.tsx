"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Building2 } from "lucide-react";
import { CTA } from "@/constants/lp";
import { fadeOnly } from "@/lib/motion";

export function FinalCta() {
  const prefersReducedMotion = useReducedMotion();
  const fade = fadeOnly(prefersReducedMotion, { duration: 0.6 });

  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="scroll-mt-[72px] bg-background py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={fade}
          className="relative isolate overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#4338CA_0%,#4F46E5_45%,#6366F1_100%)] px-8 py-10 text-center sm:px-12 md:py-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]"
          />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <span className="text-sm font-semibold tracking-wide text-white/80 uppercase">
              {CTA.label}
            </span>
            <h2
              id="cta-heading"
              className="mt-3 text-3xl leading-tight font-bold tracking-tight whitespace-pre-line text-white sm:text-4xl lg:text-5xl"
            >
              {CTA.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed whitespace-pre-line text-white/85">
              {CTA.description}
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={CTA.primaryHref}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-primary shadow-sm transition-colors duration-200 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
              >
                {CTA.primaryCta}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href={CTA.secondaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {CTA.secondaryCta}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
