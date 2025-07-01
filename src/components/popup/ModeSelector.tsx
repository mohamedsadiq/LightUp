import { ActionButton } from "~components/buttons/ActionButton"
import { MODES } from "~utils/constants"
import { getMessage } from "~utils/i18n"
import type { Mode } from "~types/settings"

interface ModeSelectorProps {
  activeMode: Mode
  onModeChange: (mode: Mode) => void
  preferredModes?: Mode[]
}

const DEFAULT_MODES: Mode[] = ["summarize", "explain", "analyze", "free"]

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  activeMode,
  onModeChange,
  preferredModes = DEFAULT_MODES
}) => {
  const displayModes = preferredModes.slice(0, 4)

  const modeNames: Record<Mode, string> = {
    summarize: getMessage("summarizeAction") || "Summarize",
    explain: getMessage("explainAction") || "Explain",
    analyze: getMessage("analyzeAction") || "Analyze",
    translate: getMessage("translateAction") || "Translate",
    free: getMessage("askAnythingAction") || "Ask Anything"
  }

  return (
    <div style={styles.buttonContainer}>
      {displayModes.map((mode) => (
        <ActionButton
          key={mode}
          mode={mode}
          activeMode={activeMode}
          onClick={() => onModeChange(mode)}>
          {modeNames[mode]}
        </ActionButton>
      ))}
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