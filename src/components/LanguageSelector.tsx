import { useState, useEffect } from "react"
import styled from "@emotion/styled"
import { Storage } from "@plasmohq/storage"

import { 
  SUPPORTED_LANGUAGES, 
  getSelectedLocale, 
  setSelectedLocale,
  SELECTED_LOCALE_KEY
} from "~utils/i18n"

// Define theme colors to match the app theme
const theme = {
  dark: {
    background: "#2A2A2A",
    foreground: "#FFFFFF",
    border: "#3A3A3A",
    primary: "#0078D4"
  }
}

const SelectContainer = styled.div<{ compact?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.compact ? '8px' : '16px'};
`

const Label = styled.label<{ compact?: boolean }>`
  color: ${theme.dark.foreground};
  font-size: ${props => props.compact ? '12px' : '14px'};
  margin-bottom: ${props => props.compact ? '4px' : '6px'};
  ${props => props.compact && 'display: none;'}
`

const Select = styled.select<{ compact?: boolean }>`
  background-color: ${theme.dark.background};
  color: ${theme.dark.foreground};
  padding: ${props => props.compact ? '4px 8px' : '8px 12px'};
  border-radius: 4px;
  border: 1px solid ${theme.dark.border};
  font-size: ${props => props.compact ? '12px' : '14px'};
  width: 100%;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: ${theme.dark.primary};
  }
  
  option {
    background-color: ${theme.dark.background};
    color: ${theme.dark.foreground};
  }
`

// Define interface for component props
export interface LanguageSelectorProps {
  onChange?: (locale: string) => void
  label?: string
  compact?: boolean
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onChange,
  label = chrome.i18n.getMessage("languageLabel") || "Language",
  compact = false
}) => {
  const [selectedLocale, setLocale] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const storage = new Storage()
  
  // Load the selected locale on component mount
  useEffect(() => {
    const loadSelectedLocale = async () => {
      try {
        const locale = await getSelectedLocale()
        setLocale(locale)
      } catch (error) {
        console.error("Error loading selected locale:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSelectedLocale()
  }, [])
  
  // Handle language change
  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value
    setLocale(newLocale)
    
    try {
      await setSelectedLocale(newLocale)
      
      if (onChange) {
        onChange(newLocale)
      }
      
      // Notify the user that they need to reload for full effect
      // In a real implementation, we might want to show a toast or notification
      console.log("Language changed to", newLocale)
    } catch (error) {
      console.error("Error setting language:", error)
    }
  }
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <SelectContainer compact={compact}>
      <Label compact={compact} htmlFor="language-selector">{label}</Label>
      <Select
        compact={compact}
        id="language-selector"
        value={selectedLocale}
        onChange={handleLanguageChange}
        aria-label={label}>
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName} ({language.name})
          </option>
        ))}
      </Select>
    </SelectContainer>
  )
}

export default LanguageSelector
