"use client";

import { ExternalLink, Info } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ITSS, ITSS_INFO_CARD, ITSS_LEVELS } from "@/constants/lp";
import { fadeUpItem, staggerContainer } from "@/lib/motion";

const LEVEL_CIRCLE_STYLES = [
  "bg-indigo-100 text-indigo-600",
  "bg-indigo-200 text-indigo-700",
  "bg-indigo-300 text-indigo-800",
  "bg-indigo-400 text-white",
  "bg-indigo-500 text-white",
  "bg-indigo-600 text-white",
  "bg-indigo-700 text-white",
] as const;

const HIGHLIGHTED_LEVEL = 4;

export function ItssSection() {
  const prefersReducedMotion = useReducedMotion();
  const container = staggerContainer(prefersReducedMotion, { staggerChildren: 0.06 });
  const item = fadeUpItem(prefersReducedMotion);

  return (
    <section
      id="itss"
      aria-labelledby="itss-heading"
      className="scroll-mt-[72px] bg-background py-10 md:py-14"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          headingId="itss-heading"
          label={ITSS.label}
          title={ITSS.title}
          description={ITSS.description}
          align="center"
        />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {ITSS.note}
        </p>

        {/* Desktop: horizontal timeline */}
        <div className="relative mt-8 hidden lg:block">
          <div
            className="absolute inset-x-0 top-8 h-px bg-gradient-to-r from-indigo-100 to-primary"
            aria-hidden="true"
          />
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={container}
            className="relative grid grid-cols-7 gap-6"
          >
            {ITSS_LEVELS.map((level, index) => {
              const isHighlighted = level.level === HIGHLIGHTED_LEVEL;
              return (
                <motion.li
                  key={level.level}
                  variants={item}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center">
                    <span
                      className={`flex items-center justify-center rounded-full text-lg font-bold ${LEVEL_CIRCLE_STYLES[index]} ${
                        isHighlighted
                          ? "h-16 w-16 shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                          : "h-14 w-14"
                      }`}
                    >
                      {level.level}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {level.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {level.description}
                  </p>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        {/* Mobile / tablet: vertical timeline */}
        <div className="relative mt-8 lg:hidden">
          <div
            className="absolute top-0 bottom-0 left-8 w-px bg-gradient-to-b from-indigo-100 to-primary"
            aria-hidden="true"
          />
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={container}
            className="relative flex flex-col gap-5"
          >
            {ITSS_LEVELS.map((level, index) => {
              const isHighlighted = level.level === HIGHLIGHTED_LEVEL;
              return (
                <motion.li key={level.level} variants={item} className="flex gap-4">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center">
                    <span
                      className={`flex items-center justify-center rounded-full text-lg font-bold ${LEVEL_CIRCLE_STYLES[index]} ${
                        isHighlighted
                          ? "h-16 w-16 shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                          : "h-14 w-14"
                      }`}
                    >
                      {level.level}
                    </span>
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-foreground">
                      {level.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              {ITSS_INFO_CARD.title}
            </h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {ITSS_INFO_CARD.body}
          </p>
          <a
            href={ITSS_INFO_CARD.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span>{ITSS_INFO_CARD.linkLabel}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
