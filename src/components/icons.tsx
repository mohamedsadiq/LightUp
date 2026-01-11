import type { Theme } from "~types/theme";

import openAiLightLogoUrl from "../../public/OpenAI-black-monoblossom.svg"
import openAiDarkLogoUrl from "../../public/OpenAI-white-monoblossom.svg"

export const Logo = (theme: Theme = "light") => (
  theme === "light" ? (
    <svg width="40" height="40" viewBox="0 0 193 194" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_339_94)">
        <circle cx="96.8148" cy="97.8148" r="30.8148" fill="black"/>
        <circle cx="96.8148" cy="97.8148" r="30.1886" stroke="#A72D20" strokeWidth="1.25238"/>
      </g>
      <g filter="url(#filter1_d_339_94)">
        <ellipse cx="97.5" cy="98" rx="28.5" ry="29" fill="black"/>
      </g>
      <defs>
        <filter id="filter0_d_339_94" x="0.700001" y="0.865079" width="192.229" height="192.23" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="11" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_339_94"/>
          <feOffset dy="-0.834922"/>
          <feGaussianBlur stdDeviation="27.15"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_339_94"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_339_94" result="shape"/>
        </filter>
        <filter id="filter1_d_339_94" x="50.6317" y="50.6317" width="93.7366" height="94.7366" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
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
        <circle cx="46.2447" cy="47.3492" r="14.5216" stroke="#292929" strokeWidth="0.602432"/>
      </g>
      <g filter="url(#filter1_d_729_79)">
        <ellipse cx="46.5687" cy="47.4381" rx="13.7093" ry="13.9498" fill="#292929"/>
      </g>
      <defs>
        <filter id="filter0_d_729_79" x="0.0107341" y="0.713605" width="92.4707" height="92.4678" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="5.29131" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_729_79"/>
          <feOffset dy="-0.401621"/>
          <feGaussianBlur stdDeviation="13.0599"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_729_79"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_729_79" result="shape"/>
        </filter>
        <filter id="filter1_d_729_79" x="24.0237" y="24.6526" width="45.0932" height="45.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
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

export const LightUpIcon = () => (
  <svg width="32" height="32" viewBox="0 0 93 94" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_729_79)">
      <circle cx="46.2447" cy="47.3492" r="14.8228" fill="#292929"/>
      <circle cx="46.2447" cy="47.3492" r="14.5216" stroke="#292929" strokeWidth="0.602432"/>
    </g>
    <g filter="url(#filter1_d_729_79)">
      <ellipse cx="46.5687" cy="47.4381" rx="13.7093" ry="13.9498" fill="#292929"/>
    </g>
    <defs>
      <filter id="filter0_d_729_79" x="0.0107341" y="0.713605" width="92.4707" height="92.4678" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feMorphology radius="5.29131" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_729_79"/>
        <feOffset dy="-0.401621"/>
        <feGaussianBlur stdDeviation="13.0599"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_729_79"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_729_79" result="shape"/>
      </filter>
      <filter id="filter1_d_729_79" x="24.0237" y="24.6526" width="45.0932" height="45.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="4.41783"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="shape"/>
      </filter>
    </defs>
  </svg>
);

export const GeminiIcon = () => (
  <svg width="32" height="32" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="maskme" maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65">
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/>
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#prefix__paint0_linear_2001_67)"/>
    </mask>
    <g mask="url(#maskme)">
      <g filter="url(#prefix__filter0_f_2001_67)">
        <path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/>
      </g>
      <g filter="url(#prefix__filter1_f_2001_67)">
        <path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/>
      </g>
      <g filter="url(#prefix__filter2_f_2001_67)">
        <path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/>
      </g>
      <g filter="url(#prefix__filter3_f_2001_67)">
        <path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/>
      </g>
      <g filter="url(#prefix__filter4_f_2001_67)">
        <path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/>
      </g>
      <g filter="url(#prefix__filter5_f_2001_67)">
        <path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/>
      </g>
      <g filter="url(#prefix__filter6_f_2001_67)">
        <path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/>
      </g>
      <g filter="url(#prefix__filter7_f_2001_67)">
        <path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/>
      </g>
      <g filter="url(#prefix__filter8_f_2001_67)">
        <path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/>
      </g>
      <g filter="url(#prefix__filter9_f_2001_67)">
        <path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/>
      </g>
      <g filter="url(#prefix__filter10_f_2001_67)">
        <path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/>
      </g>
    </g>
    <defs>
      <filter id="prefix__filter0_f_2001_67" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter1_f_2001_67" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter2_f_2001_67" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter3_f_2001_67" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter4_f_2001_67" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter5_f_2001_67" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter6_f_2001_67" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter7_f_2001_67" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter8_f_2001_67" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter9_f_2001_67" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <filter id="prefix__filter10_f_2001_67" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67"/>
      </filter>
      <linearGradient id="prefix__paint0_linear_2001_67" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse">
        <stop stop-color="#4893FC"/>
        <stop offset=".27" stop-color="#4893FC"/>
        <stop offset=".777" stop-color="#969DFF"/>
        <stop offset="1" stop-color="#BD99FE"/>
      </linearGradient>
    </defs>
  </svg>
);

export const GrokIcon = () => (
  <svg width="32" height="32" viewBox="0 0 512 492" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M197.76 315.52l170.197-125.803c8.342-6.186 20.267-3.776 24.256 5.803 20.907 50.539 11.563 111.253-30.08 152.939-41.621 41.685-99.562 50.816-152.512 29.994l-57.834 26.816c82.965 56.768 183.701 42.731 246.656-20.33 49.941-50.006 65.408-118.166 50.944-179.627l.128.149c-20.971-90.282 5.162-126.378 58.666-200.17 1.28-1.75 2.56-3.499 3.819-5.291l-70.421 70.507v-.214l-243.883 245.27m-35.072 30.528c-59.563-56.96-49.28-145.088 1.515-195.926 37.568-37.61 99.136-52.97 152.874-30.4l57.707-26.666a166.554 166.554 0 00-39.019-21.334 191.467 191.467 0 00-208.042 41.942c-54.038 54.101-71.04 137.301-41.856 208.298 21.802 53.056-13.931 90.582-49.92 128.47C23.104 463.915 10.304 477.333 0 491.541l162.56-145.386" fill="#000"/>
  </svg>
);

type OpenAIIconProps = {
  theme?: "light" | "dark"
  size?: number
  className?: string
  alt?: string
}

export const OpenAIIcon = ({
  theme = "light",
  size = 32,
  className = "",
  alt = "OpenAI"
}: OpenAIIconProps) => {
  const resolvedSrc = theme === "dark" ? openAiDarkLogoUrl : openAiLightLogoUrl

  return (
    <img
      src={resolvedSrc}
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ display: "block" }}
    />
  )
}

export const LocalIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#666666"/>
  </svg>
); 