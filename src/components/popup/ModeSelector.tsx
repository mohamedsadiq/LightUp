import { ActionButton } from "~components/buttons/ActionButton"
import { MODES } from "~utils/constants"
import type { Mode } from "~types/settings"

interface ModeSelectorProps {
  activeMode: Mode
  onModeChange: (mode: Mode) => void
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onModeChange
}) => {
  return (
    <div style={styles.buttonContainer}>
      <ActionButton
        mode="summarize"
        activeMode={activeMode}
        onClick={() => onModeChange("summarize")}>
        Summarize
      </ActionButton>
      <ActionButton
        mode="explain"
        activeMode={activeMode}
        onClick={() => onModeChange("explain")}>
        Explain 
      </ActionButton>
      <ActionButton
        mode="analyze"
        activeMode={activeMode}
        onClick={() => onModeChange("analyze")}>
        Analyze
      </ActionButton>
      <ActionButton
        mode="free"
        activeMode={activeMode}
        onClick={() => onModeChange("free")}>
        Ask Anything
      </ActionButton>
    </div>
  )
}

const styles = {
  buttonContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginBottom: 20
  }
} 