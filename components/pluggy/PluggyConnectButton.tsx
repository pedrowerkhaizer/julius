"use client";
import { PluggyConnect } from "react-pluggy-connect";
import { useState } from "react";

export default function PluggyConnectButton({ onConnected }: { onConnected?: () => void }) {
  const [connectToken, setConnectToken] = useState<string | null>(null);

  const fetchToken = async () => {
    const res = await fetch("http://localhost:3001/pluggy/connect-token", { method: "POST" });
    const { accessToken } = await res.json();
    setConnectToken(accessToken);
  };

  return (
    <>
      <button onClick={fetchToken}>
        Conectar banco via Pluggy
      </button>
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={false}
          onSuccess={({ item }) => {
            console.log("Pluggy item conectado:", item);
            localStorage.setItem("pluggy_itemId", item.id);
            if (onConnected) onConnected();
            // Você pode também forçar um reload: window.location.reload();
          }}
          onError={err => {
            alert("Erro: " + err.message);
          }}
        />
      )}
    </>
  );
}
