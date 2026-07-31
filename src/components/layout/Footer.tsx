import Image from "next/image";
import { BRAND, FOOTER } from "@/constants/lp";

export function Footer() {
  return (
    <footer className="border-t border-border bg-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/image/logo.png"
                alt=""
                width={42}
                height={42}
                className="h-[42px] w-[42px] shrink-0 object-contain"
              />
              <p className="text-lg font-bold tracking-tight text-foreground">
                {BRAND.name}
              </p>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {FOOTER.description}
            </p>
          </div>

          {FOOTER.columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) =>
                  // "#" is reserved for links with no legitimate destination
                  // yet (see FOOTER in src/constants/lp.ts) -- rendered as
                  // plain non-interactive text, not a fabricated link.
                  link.href === "#" ? (
                    <li key={link.label}>
                      <span
                        aria-disabled="true"
                        className="text-sm text-muted-foreground/50"
                      >
                        {link.label}
                      </span>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ENGINEER MATCH. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
