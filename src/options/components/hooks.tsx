import { useState, useEffect, useRef, useCallback } from "react";
import { Storage } from "@plasmohq/storage";
import type { Settings } from "./types";

// Hook for toast notifications
export const useToastNotifications = () => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = (message, type = "success") => {
    const id = toastIdRef.current++;
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const ToastComponent = (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1000
      }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === "success" ? "#4CAF50" : "#f44336",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            marginBottom: "10px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}>
          {toast.message}
        </div>
      ))}
    </div>
  );

  return { addToast, ToastComponent };
};

// Hook for auto-saving settings
export const useAutoSave = (settings: Settings, storage: Storage, addToast: (message: string, type?: string) => void) => {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      await storage.set("settings", newSettings);
      addToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      addToast("Failed to save settings.", "error");
    }
  }, [storage, addToast]);

  useEffect(() => {
    if (settings) {
      setIsSaving(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        saveSettings(settings);
        setIsSaving(false);
      }, 1500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [settings, saveSettings]);

  const AutoSaveIndicator = (
    <div style={{ color: "#999", fontSize: "12px", textAlign: "center" }}>
      {isSaving ? "Saving..." : "Changes saved"}
    </div>
  );

  return { saveSettings, AutoSaveIndicator };
};
