import styled from "@emotion/styled"

const Badge = styled.span<{ variant: "100% offline" | "offline" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${(props) => {
    if (props.variant === "100% offline") {
      return `
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: 1px solid #059669;
      `
    }
    return `
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
      border: 1px solid #4b5563;
    `
  }}
`

const Icon = styled.span`
  font-size: 12px;
`

interface PrivacyBadgeProps {
  privacy: "100% offline" | "offline"
  showLabel?: boolean
}

export const PrivacyBadge = ({ privacy, showLabel = true }: PrivacyBadgeProps) => {
  const icon = privacy === "100% offline" ? "🔒" : "🛡️"
  
  return (
    <Badge variant={privacy}>
      <Icon>{icon}</Icon>
      {showLabel && <span>{privacy}</span>}
    </Badge>
  )
}
