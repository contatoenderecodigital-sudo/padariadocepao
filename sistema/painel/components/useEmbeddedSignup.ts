"use client";

// Hook do Embedded Signup (Tech Provider da Meta). Carrega o FB SDK, abre o
// popup, captura code + waba_id + phone_number_id e finaliza no backend.
// Reusado pelo botao grande (onboarding) e pelos botoes de reconectar/trocar.

import { useEffect, useRef, useState } from "react";

const APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID ?? "986426127711722";
const CONFIG_ID = process.env.NEXT_PUBLIC_FB_CONFIG_ID ?? "1031470826450642";
const VERSION = "v22.0";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export type EstadoConexao = "idle" | "conectando" | "ok" | "erro";

export function useEmbeddedSignup() {
  const [pronto, setPronto] = useState(false);
  const [estado, setEstado] = useState<EstadoConexao>("idle");
  const [msg, setMsg] = useState("");
  const waData = useRef<{ waba_id?: string; phone_number_id?: string }>({});

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      let host = "";
      try {
        host = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (!host.endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          waData.current = { waba_id: data.data?.waba_id, phone_number_id: data.data?.phone_number_id };
        }
      } catch {
        /* nem toda mensagem e JSON */
      }
    }
    window.addEventListener("message", onMessage);

    if (window.FB) {
      setPronto(true);
    } else {
      window.fbAsyncInit = function () {
        window.FB.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: true, version: VERSION });
        setPronto(true);
      };
      if (!document.getElementById("facebook-jssdk")) {
        const s = document.createElement("script");
        s.id = "facebook-jssdk";
        s.src = "https://connect.facebook.net/en_US/sdk.js";
        s.async = true;
        s.defer = true;
        s.crossOrigin = "anonymous";
        document.body.appendChild(s);
      }
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function conectar(onDone?: (ok: boolean) => void) {
    if (!window.FB) return;
    setEstado("conectando");
    setMsg("");
    waData.current = {};
    window.FB.login(
      (response: any) => {
        const code = response?.authResponse?.code;
        if (!code) {
          setEstado("erro");
          setMsg("Conexão cancelada. Tente novamente.");
          onDone?.(false);
          return;
        }
        fetch("/api/whatsapp/embedded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            waba_id: waData.current.waba_id,
            phone_number_id: waData.current.phone_number_id,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.ok) {
              setEstado("ok");
              setMsg("WhatsApp conectado! A IA já vai atender neste número.");
              onDone?.(true);
            } else {
              setEstado("erro");
              setMsg(d.erro ?? "Falha ao conectar.");
              onDone?.(false);
            }
          })
          .catch((e) => {
            setEstado("erro");
            setMsg(String(e));
            onDone?.(false);
          });
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      },
    );
  }

  return { pronto, estado, msg, conectar };
}
