import type { Theme } from "~types/theme";

export const Logo = (theme: Theme = "light") => (
  theme === "light" ? (
    <svg width="40" height="40" viewBox="0 0 193 194" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_339_94)">
        <circle cx="96.8148" cy="97.8148" r="30.8148" fill="black"/>
        <circle cx="96.8148" cy="97.8148" r="30.1886" stroke="#A72D20" stroke-width="1.25238"/>
      </g>
      <g filter="url(#filter1_d_339_94)">
        <ellipse cx="97.5" cy="98" rx="28.5" ry="29" fill="black"/>
      </g>
      <defs>
        <filter id="filter0_d_339_94" x="0.700001" y="0.865079" width="192.229" height="192.23" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="11" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_339_94"/>
          <feOffset dy="-0.834922"/>
          <feGaussianBlur stdDeviation="27.15"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_339_94"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_339_94" result="shape"/>
        </filter>
        <filter id="filter1_d_339_94" x="50.6317" y="50.6317" width="93.7366" height="94.7366" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="9.18414"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_339_94"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_339_94" result="shape"/>
        </filter>
      </defs>
    </svg>
  ) : (
    <svg width="40" height="40" viewBox="0 0 93 94" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_729_79)">
        <circle cx="46.2447" cy="47.3492" r="14.8228" fill="#292929"/>
        <circle cx="46.2447" cy="47.3492" r="14.5216" stroke="#292929" stroke-width="0.602432"/>
      </g>
      <g filter="url(#filter1_d_729_79)">
        <ellipse cx="46.5687" cy="47.4381" rx="13.7093" ry="13.9498" fill="#292929"/>
      </g>
      <defs>
        <filter id="filter0_d_729_79" x="0.0107341" y="0.713605" width="92.4707" height="92.4678" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="5.29131" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_729_79"/>
          <feOffset dy="-0.401621"/>
          <feGaussianBlur stdDeviation="13.0599"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_729_79"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_729_79" result="shape"/>
        </filter>
        <filter id="filter1_d_729_79" x="24.0237" y="24.6526" width="45.0932" height="45.571" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="4.41783"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_729_79"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_729_79" result="shape"/>
        </filter>
      </defs>
    </svg>
  )
);

export const CloseIcon = ({ theme = "light" }: { theme?: Theme }) => (
  <svg width="16" height="16" viewBox="0 0 87 86" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M43.17 0C14.389 0 0 14.251 0 42.752C0 71.253 14.389 85.503 43.17 85.503C71.995 85.503 86.408 71.253 86.408 42.752C86.408 14.251 71.995 0 43.17 0ZM68.391 68.769C63.103 74.266 54.697 77.015 43.17 77.015C31.734 77.015 23.36 74.267 18.05 68.769C12.74 63.273 10.085 54.6 10.085 42.752C10.085 30.903 12.74 22.23 18.05 16.734C23.36 11.237 31.734 8.488 43.17 8.488C54.697 8.488 63.103 11.237 68.391 16.734C73.678 22.23 76.322 30.903 76.322 42.752C76.322 54.6 73.678 63.273 68.391 68.769Z" 
      fill={theme === "dark" ? "#FFFFFF" : "#000000"}
    />
    <path 
      d="M60.8462 25.131C58.8102 23.095 55.5102 23.095 53.4742 25.131L43.2042 35.401L32.9342 25.131C30.8982 23.095 27.5982 23.095 25.5622 25.131C23.5262 27.167 23.5262 30.467 25.5622 32.503L35.8322 42.773L25.5622 53.043C23.5262 55.079 23.5262 58.379 25.5622 60.415C27.5982 62.451 30.8982 62.451 32.9342 60.415L43.2042 50.145L53.4742 60.415C55.5102 62.451 58.8102 62.451 60.8462 60.415C62.8822 58.379 62.8822 55.079 60.8462 53.043L50.5762 42.773L60.8462 32.503C62.8822 30.467 62.8822 27.166 60.8462 25.131Z" 
      fill={theme === "dark" ? "#FFFFFF" : "#000000"}
    />
  </svg>
); 