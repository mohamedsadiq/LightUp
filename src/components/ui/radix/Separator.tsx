import * as Separator from "@radix-ui/react-separator"
import styled from "@emotion/styled"

const theme = {
  divider: "var(--popup-divider)"
}

export const StyledSeparator = styled(Separator.Root)`
  height: 1px;
  background: ${theme.divider};
  margin: 16px 12px;
  opacity: 0.3;
  
  &[data-orientation="vertical"] {
    width: 1px;
    height: auto;
    margin: 12px 16px;
  }
`

interface SeparatorProps {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

export const Divider = ({ orientation = "horizontal", decorative = true }: SeparatorProps) => (
  <StyledSeparator orientation={orientation} decorative={decorative} />
)
