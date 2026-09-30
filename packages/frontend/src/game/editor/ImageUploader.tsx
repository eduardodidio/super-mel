import { useState, useRef, useCallback } from "react";
import type { CustomAsset } from "@super-mel/shared";

interface ImageUploaderProps {
  onConfirm: (asset: CustomAsset) => void;
  onCancel: () => void;
  existingCount: number;
}

export function ImageUploader({ onConfirm, onCancel, existingCount }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d")!;

        // Nearest-neighbor scaling for pixel art look
        ctx.imageSmoothingEnabled = false;

        // Draw the source image scaled to 64x64
        ctx.drawImage(img, 0, 0, 64, 64);

        // Get the pixelated result as a data URI
        const pixelatedDataUri = canvas.toDataURL("image/png");

        setPreviewUri(pixelatedDataUri);
        setLoading(false);

        // Default name from filename (without extension), truncated to 20 chars
        const defaultName = file.name
          .replace(/\.[^.]+$/, "")
          .slice(0, 20);
        setNameInput(defaultName);
      };
      img.onerror = () => {
        setError("Erro ao carregar imagem");
        setLoading(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setError("Erro ao ler arquivo");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!previewUri) return;

    const trimmedName = nameInput.trim().slice(0, 20);
    if (trimmedName.length === 0) {
      setError("Digite um nome");
      return;
    }

    if (existingCount >= 10) {
      setError("Limite de 10 imagens atingido");
      return;
    }

    if (previewUri.length > 15000) {
      setError("Imagem muito grande");
      return;
    }

    const asset: CustomAsset = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      dataUri: previewUri,
    };
    onConfirm(asset);
  }, [previewUri, nameInput, existingCount, onConfirm]);

  const atLimit = existingCount >= 10;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>Upload de Imagem</h3>
        <p style={styles.counter}>Imagens: {existingCount}/10</p>

        {!previewUri && !loading && (
          <>
            <button
              style={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={atLimit}
            >
              {atLimit ? "LIMITE ATINGIDO" : "ESCOLHER IMAGEM"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </>
        )}

        {loading && <p style={styles.loadingText}>Processando...</p>}

        {previewUri && (
          <div style={styles.previewSection}>
            <img
              src={previewUri}
              alt="Preview"
              style={styles.previewImage}
            />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value.slice(0, 20));
                setError(null);
              }}
              placeholder="Nome da imagem"
              maxLength={20}
              style={styles.nameInput}
            />
            <p style={styles.charCount}>{nameInput.length}/20</p>
          </div>
        )}

        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.buttons}>
          {previewUri && (
            <button
              style={{
                ...styles.confirmBtn,
                ...(atLimit || !nameInput.trim() ? styles.disabledBtn : {}),
              }}
              onClick={handleConfirm}
              disabled={atLimit || !nameInput.trim()}
            >
              CONFIRMAR
            </button>
          )}
          <button style={styles.cancelBtn} onClick={onCancel}>
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    fontFamily: "monospace",
    color: "#fff",
  },
  modal: {
    background: "#1a1a2e",
    border: "2px solid #444",
    borderRadius: 8,
    padding: 24,
    minWidth: 280,
    maxWidth: 350,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    color: "#fff",
  },
  counter: {
    margin: 0,
    fontSize: 12,
    color: "#888",
  },
  uploadBtn: {
    padding: "10px 20px",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  loadingText: {
    margin: 0,
    fontSize: 13,
    color: "#aaa",
  },
  previewSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  previewImage: {
    width: 128,
    height: 128,
    imageRendering: "pixelated" as any,
    border: "2px solid #555",
    borderRadius: 4,
    background: "#000",
  },
  nameInput: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 13,
    fontFamily: "monospace",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 4,
    outline: "none",
    boxSizing: "border-box",
  },
  charCount: {
    margin: 0,
    fontSize: 10,
    color: "#666",
    alignSelf: "flex-end",
  },
  errorText: {
    margin: 0,
    fontSize: 12,
    color: "#ff4444",
  },
  buttons: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  confirmBtn: {
    padding: "8px 16px",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#4a8a4a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "8px 16px",
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#6a4a4a",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
