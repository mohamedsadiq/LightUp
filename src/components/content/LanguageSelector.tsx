import { motion } from "framer-motion"
import { LANGUAGES } from "~utils/constants"

interface LanguageSelectorProps {
  selectedLanguage: string
  onChange: (language: string) => void
  label: string
}

export const LanguageSelector = ({ selectedLanguage, onChange, label }: LanguageSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={styles.container}
    >
      <label style={styles.label}>{label}</label>
      <select 
        value={selectedLanguage}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
      >
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </motion.div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    marginBottom: "8px"
  },
  label: {
    fontSize: "10px",
    color: "#666",
    fontWeight: 500
  },
  select: {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid #e2e2e2",
    fontSize: "12px",
    backgroundColor: "white",
    cursor: "pointer"
  }
} 