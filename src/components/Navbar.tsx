import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { BrandLogo } from "./BrandLogo";

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="nav" role="banner">
      <div className="nav__inner">
        {/* Brand */}
        <div className="nav__left">
          <BrandLogo height={150} showBadge />
        </div>

        {/* Desktop Navigation */}
        <nav
          className="menu menu--desktop"
          aria-label="Hauptnavigation"
          role="navigation"
        >
          <a href="#create">Create</a>
          <a href="#how">How it works</a>
          <a href="#explore">Explore</a>
          <a href="#faq">FAQ</a>
          <a href="#faq">Impressum</a>
        </nav>

        {/* Mobile Toggle */}
        <button
          ref={btnRef}
          className="nav__toggle"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(v => !v)}
        >
          <span aria-hidden="true" className={`burger ${open ? "is-open" : ""}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`menu-drawer ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <nav className="menu menu--mobile" aria-label="Mobile Navigation">
          <a href="#create" onClick={() => setOpen(false)}>Create</a>
          <a href="#how" onClick={() => setOpen(false)}>How it works</a>
          <a href="#explore" onClick={() => setOpen(false)}>Explore</a>
          <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;