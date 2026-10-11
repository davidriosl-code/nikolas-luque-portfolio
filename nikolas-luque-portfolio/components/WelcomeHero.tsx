"use client";

import { useEffect, useRef, useState } from "react";
import "./welcome-hero.css";

export default function WelcomeHero({ onEnterJarvis }: { onEnterJarvis?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState<"anim" | "go" | "done">("anim");
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  // Bucle continuo sin cortes para el video de fondo
  useEffect(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA || !videoB) return;

    let activeVideo = videoA;
    let nextVideo = videoB;
    let isSwapping = false;
    const FADE = 0.9;

    const handleTimeUpdate = () => {
      if (isSwapping || !activeVideo.duration) return;
      if (activeVideo.duration - activeVideo.currentTime > FADE) return;

      isSwapping = true;
      const currentOut = activeVideo;
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => {});

      nextVideo.classList.add("is-active");
      currentOut.classList.remove("is-active");

      // Intercambiar referencias
      if (activeVideo === videoA) {
        activeVideo = videoB;
        nextVideo = videoA;
      } else {
        activeVideo = videoA;
        nextVideo = videoB;
      }

      setTimeout(() => {
        currentOut.pause();
        currentOut.currentTime = 0;
        isSwapping = false;
      }, FADE * 1000 + 100);
    };

    videoA.addEventListener("timeupdate", handleTimeUpdate);
    videoB.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      videoA.removeEventListener("timeupdate", handleTimeUpdate);
      videoB.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // Entrada animada (una sola vez; espera a las fuentes, máx. 900ms)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let started = false;
    let safety: number | undefined;
    const boot = window.setTimeout(() => start(), 900);

    function start() {
      if (started) return;
      started = true;
      window.clearTimeout(boot);
      setPhase("go");
      safety = window.setTimeout(() => setPhase("done"), 2600);
    }

    if (document.fonts?.ready) document.fonts.ready.then(start, start);
    else start();

    return () => {
      window.clearTimeout(boot);
      window.clearTimeout(safety);
    };
  }, []);

  // Menú móvil (clic fuera y Escape)
  useEffect(() => {
    if (!menuOpen) return;

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || burgerRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <main
      className={`hero welcome-hero${phase !== "done" ? " anim" : ""}${phase === "go" ? " go" : ""}`}
      onAnimationEnd={(e) => {
        // El último CTA termina la secuencia y se quitan las clases de entrada
        if (
          e.animationName === "wh-pillIn" &&
          (e.target as HTMLElement).matches(".ctas .btn:last-child")
        ) {
          setPhase("done");
        }
      }}
    >
      {/* Fondo de Video */}
      <div className="bg" role="img" aria-label="Globo interactivo">
        <video
          ref={videoARef}
          className="bg-video is-active"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4"
            type="video/mp4"
          />
        </video>
        <video
          ref={videoBRef}
          className="bg-video"
          muted
          loop
          playsInline
          preload="auto"
          poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104036_bd6924f6-3c8e-417e-8465-6d03c8c2e9e6.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Navegación Superior */}
      <header className="nav">
        <a href="#" className="logo" aria-label="Nikolas Luque, inicio">
          <img
            src="/logo-nl-claro.png"
            alt="nl."
            style={{ height: 44, width: "auto", display: "block" }}
          />
        </a>
        <nav className="nav-links" aria-label="Principal">
          <a href="#productos">Productos</a>
          <a href="#precios">Precios</a>
          <a href="#desarrolladores">Desarrolladores</a>
          <a href="#recursos">Recursos</a>
          <a href="#contacto">Contacto</a>
        </nav>

        {/* Vacío a propósito: mantiene los enlaces centrados en el layout */}
        <div className="nav-actions" />

        {/* Botón hamburguesa (solo se ve en tablet/móvil) */}
        <button
          ref={burgerRef}
          type="button"
          className="burger"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          <span />
        </button>
      </header>

      {/* Panel del menú móvil */}
      <nav
        ref={menuRef}
        id="menu"
        className={`menu${menuOpen ? " open" : ""}`}
        aria-label="Móvil"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setMenuOpen(false);
        }}
      >
        <a href="#productos">Productos</a>
        <a href="#precios">Precios</a>
        <a href="#desarrolladores">Desarrolladores</a>
        <a href="#recursos">Recursos</a>
        <a href="#contacto">Contacto</a>
      </nav>

      {/* Hero Central */}
      <div className="hero-inner">
        <h1>
          <span className="ln">
            <span className="ln-i">Le damos</span>
          </span>
          <span className="ln">
            <span className="ln-i">la bienvenida</span>
          </span>
        </h1>
        <p className="sub">
          Resolvemos problemas de alto valor con automatizaciones
          <br />
          y complementos de software, y mucho más,
          <br />
          a través de la exploración de su negocio digital.
        </p>
        <div className="ctas">
          <button onClick={onEnterJarvis} className="btn btn-lg btn-primary">
            Empecemos
            <svg className="arw" viewBox="0 0 12 10" fill="none" aria-hidden="true">
              <path
                d="M0.8 5h10M7.1 1.4 10.9 5l-3.8 3.6"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
