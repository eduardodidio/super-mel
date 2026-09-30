import type { CustomAsset } from "@super-mel/shared";

interface CustomAssetPaletteProps {
  assets: CustomAsset[];
  selectedAssetId: string | null;
  selectedMode: "block" | "sign" | null;
  onSelectAsset: (assetId: string, mode: "block" | "sign") => void;
  onUpload: () => void;
  onRemoveAsset: (assetId: string) => void;
}

export function CustomAssetPalette({
  assets,
  selectedAssetId,
  selectedMode,
  onSelectAsset,
  onUpload,
  onRemoveAsset,
}: CustomAssetPaletteProps) {
  const atLimit = assets.length >= 10;

  return (
    <div style={styles.container}>
      <p style={styles.counter}>Imagens: {assets.length}/10</p>

      {/* Asset grid */}
      <div style={styles.grid}>
        {assets.map((asset) => {
          const isSelected = selectedAssetId === asset.id;
          return (
            <div
              key={asset.id}
              style={{
                ...styles.thumbnail,
                borderColor: isSelected ? "#fff" : "#555",
              }}
            >
              <img
                src={asset.dataUri}
                alt={asset.name}
                style={styles.thumbImage}
                onClick={() => onSelectAsset(asset.id, selectedMode ?? "block")}
              />
              <span style={styles.thumbName}>{asset.name.slice(0, 6)}</span>
              <button
                style={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAsset(asset.id);
                }}
                title="Remover"
              >
                X
              </button>
            </div>
          );
        })}
      </div>

      {/* Mode buttons when an asset is selected */}
      {selectedAssetId && (
        <div style={styles.modeButtons}>
          <button
            style={{
              ...styles.modeBtn,
              background: selectedMode === "block" ? "#4a8a4a" : "#4a4a6a",
            }}
            onClick={() => onSelectAsset(selectedAssetId, "block")}
          >
            BLOCO
          </button>
          <button
            style={{
              ...styles.modeBtn,
              background: selectedMode === "sign" ? "#4a8a4a" : "#4a4a6a",
            }}
            onClick={() => onSelectAsset(selectedAssetId, "sign")}
          >
            PLACA
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        style={{
          ...styles.uploadBtn,
          ...(atLimit ? styles.disabledBtn : {}),
        }}
        onClick={onUpload}
        disabled={atLimit}
      >
        + UPLOAD
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
  },
  counter: {
    margin: 0,
    fontSize: 10,
    color: "#888",
    textAlign: "center",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
    maxWidth: 120,
  },
  thumbnail: {
    position: "relative",
    width: 48,
    height: 56,
    border: "2px solid #555",
    borderRadius: 4,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    background: "#222",
    overflow: "hidden",
  },
  thumbImage: {
    width: 40,
    height: 40,
    imageRendering: "pixelated" as any,
    objectFit: "contain",
    marginTop: 2,
  },
  thumbName: {
    fontSize: 7,
    color: "#aaa",
    textAlign: "center",
    overflow: "hidden",
    whiteSpace: "nowrap",
    width: "100%",
    padding: "0 2px",
    boxSizing: "border-box",
  },
  removeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "monospace",
    background: "#aa2222",
    color: "#fff",
    border: "none",
    borderRadius: "0 2px 0 2px",
    cursor: "pointer",
    padding: 0,
    lineHeight: "14px",
    textAlign: "center",
  },
  modeButtons: {
    display: "flex",
    gap: 4,
  },
  modeBtn: {
    padding: "4px 8px",
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "bold",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
  },
  uploadBtn: {
    padding: "6px 12px",
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "bold",
    background: "#4a4a8a",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};
