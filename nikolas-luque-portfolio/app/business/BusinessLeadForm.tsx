"use client";

import { useState, type FormEvent } from "react";
import "./business-lead-form.css";

export default function BusinessLeadForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/business/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.get("nombre"),
          email: data.get("email"),
          servicio: data.get("servicio"),
          telefono: data.get("telefono"),
          mensaje: data.get("mensaje"),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.mensaje || "No se pudo enviar.");
      }

      setStatus(result.mensaje || "Solicitud enviada correctamente.");
      form.reset();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Error al enviar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="business-lead-section" id="solicitar-demo">
      <div className="business-lead-container">
        <div className="business-lead-intro">
          <span className="business-lead-eyebrow">
            NIKOLAS LUQUE / BUSINESS SOLUTIONS
          </span>
          <h2>Construyamos tu próxima solución digital.</h2>
          <p>
            Cuéntame qué necesita tu negocio y exploremos cómo
            automatizar procesos, conectar herramientas y mejorar
            la gestión de tus clientes.
          </p>
        </div>

        <form className="business-lead-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input name="nombre" required minLength={2} placeholder="Tu nombre" />
          </label>

          <label>
            Correo electrónico
            <input name="email" type="email" required placeholder="correo@empresa.com" />
          </label>

          <label>
            Teléfono o WhatsApp
            <input name="telefono" type="tel" placeholder="+51 999 999 999" />
          </label>

          <label>
            ¿Qué servicio necesitas?
            <select name="servicio" required defaultValue="">
              <option value="" disabled>Selecciona una solución</option>
              <option value="CRM">CRM y gestión de clientes</option>
              <option value="Automatización">Automatización con n8n</option>
              <option value="Desarrollo web">Desarrollo web</option>
              <option value="Integración de APIs">Integración de APIs</option>
              <option value="Consultoría">Consultoría tecnológica</option>
            </select>
          </label>

          <label className="business-lead-full">
            Cuéntame sobre tu proyecto
            <textarea
              name="mensaje"
              rows={5}
              placeholder="Describe brevemente lo que necesitas..."
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Solicitar una asesoría →"}
          </button>

          {status && <p role="status" className="business-lead-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}
