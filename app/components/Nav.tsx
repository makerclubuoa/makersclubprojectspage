"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import LinkButton from "./global/LinkButton";

const NAVLINK =
  "text-white px-[11px] py-1.5 rounded-full transition-colors duration-150 whitespace-nowrap hover:bg-white/15 max-md:px-6 max-md:py-4 max-md:rounded-none max-md:text-base max-md:font-medium max-md:text-left max-md:w-full max-md:border-b max-md:border-white/15 max-md:last:border-b-0";
const NAVAUTH =
  "text-white px-3 py-[7px] rounded-full font-[550] text-sm transition-opacity duration-200 whitespace-nowrap hover:opacity-70";
const HBAR =
  "block w-5 h-[1.5px] bg-white rounded-[2px] transition-[transform,opacity] duration-200";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function close() {
    setMenuOpen(false);
  }

  const adminEmails = (
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "makerclubuoa@gmail.com"
  )
    .split(",")
    .map((e) => e.trim());
  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-8 py-3.5 bg-gradient-to-b from-black/70 via-black/40 to-transparent text-[15px] max-md:grid-cols-[1fr_auto] max-md:px-5 max-md:overflow-visible"
      id="nav"
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          className="hidden max-md:flex flex-col justify-center gap-[5px] cursor-pointer p-1.5 shrink-0"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span
            className={`${HBAR}${menuOpen ? " translate-y-[6.5px] rotate-45" : ""}`}
          />
          <span className={`${HBAR}${menuOpen ? " opacity-0" : ""}`} />
          <span
            className={`${HBAR}${menuOpen ? " -translate-y-[6.5px] -rotate-45" : ""}`}
          />
        </button>
        <a className="flex items-center gap-3" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_h_w.svg"
            alt="UoA Maker Club"
            className="h-8 w-auto"
          />
        </a>
      </div>

      {/* Center: nav links (mobile drawer) */}
      <div
        className={`flex gap-0.5 items-center justify-center text-[15px] font-medium max-md:absolute max-md:top-full max-md:left-0 max-md:right-0 max-md:h-[calc(100svh-58px)] max-md:bg-black/70 max-md:backdrop-blur-xl max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:pb-6 max-md:overflow-y-auto max-md:border-t max-md:border-white/15 ${menuOpen ? "max-md:flex" : "max-md:hidden"}`}
      >
        <a href="/about" className={NAVLINK} onClick={close}>
          About
        </a>
        <a href="/faq" className={NAVLINK} onClick={close}>
          FAQ
        </a>
        <a href="/events" className={NAVLINK} onClick={close}>
          Events
        </a>
        <a href="https://vend.makeuoa.nz/" className={NAVLINK} onClick={close}>
          Vending Machine
        </a>
        <Link href="/projects" className={NAVLINK} onClick={close}>
          Projects
        </Link>
        <Link
          href="/submit"
          className="
          hidden max-md:block max-md:mx-5 max-md:mt-3 max-md:px-5 max-md:py-3.5 max-md:rounded-base max-md:bg-white max-md:text-ink max-md:font-semibold max-md:text-center max-md:whitespace-nowrap"
          onClick={close}
        >
          Submit a Project
        </Link>

        {/* Mobile-only footer inside the drawer */}
        <div className="hidden max-md:flex max-md:items-center max-md:gap-3 max-md:px-6 max-md:py-4 max-md:mt-auto max-md:border-t max-md:border-white/15">
          {!loading &&
            (user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-ink px-2 py-[7px] rounded-full font-[550] text-sm transition-opacity duration-200 hover:opacity-70 max-w-[14ch] truncate"
                  onClick={close}
                >
                  {displayName}
                </Link>
                <button
                  className={NAVAUTH}
                  onClick={() => {
                    signOut();
                    close();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className={NAVAUTH} onClick={close}>
                Sign in
              </Link>
            ))}
        </div>
      </div>

      {/* Right: auth */}
      <div className="flex items-center gap-2 justify-end max-md:hidden">
        {!loading &&
          (user ? (
            <>
              {adminEmails.includes(user.email ?? "") && (
                <Link href="/admin" className={NAVAUTH} onClick={close}>
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-white px-2 py-[7px] rounded-full font-[550] text-sm transition-opacity duration-200 hover:opacity-70 max-w-[14ch] truncate"
                onClick={close}
              >
                {displayName}
              </Link>
              <button
                className={NAVAUTH}
                onClick={() => {
                  signOut();
                  close();
                }}
              >
                Sign out
              </button>
              <Link
                href="/submit"
                className="shadow-[2px_2px_0px_0px_#000] border-2 border-black bg-white text-ink px-4 py-[7px] rounded-full font-semibold text-sm "
                onClick={close}
              >
                Submit a Project
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={NAVAUTH} onClick={close}>
                Sign in
              </Link>

              <Link
                className="shadow-[2px_2px_0px_0px_#000] border-2 border-black bg-white text-ink px-4 py-[7px] rounded-full font-semibold text-sm "
                href="/submit"
                onClick={close}
              >
                Submit a Project
              </Link>
            </>
          ))}
      </div>
    </nav>
  );
}
