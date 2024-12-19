export const Logo = (theme: "light" | "dark" = "light") => (
  theme === "dark" ? (
    <svg width="35" height="35" viewBox="0 0 93 94" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_713_73)">
        <circle cx="46.2447" cy="47.3492" r="14.8228" fill="#292929"/>
        <circle cx="46.2447" cy="47.3492" r="14.5216" stroke="#292929" strokeWidth="0.602432"/>
      </g>
      <g filter="url(#filter1_d_713_73)">
        <ellipse cx="46.5687" cy="47.4381" rx="13.7093" ry="13.9498" fill="#292929"/>
      </g>
      <defs>
        <filter id="filter0_d_713_73" x="0.0107341" y="0.713605" width="92.4707" height="92.4678" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="5.29131" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_713_73"/>
          <feOffset dy="-0.401621"/>
          <feGaussianBlur stdDeviation="13.0599"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_713_73"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_713_73" result="shape"/>
        </filter>
        <filter id="filter1_d_713_73" x="24.0237" y="24.6526" width="45.0932" height="45.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="4.41783"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_713_73"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_713_73" result="shape"/>
        </filter>
      </defs>
    </svg>
  ) : (
    <svg width="35" height="35" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_171_147)">
    <circle cx="101.067" cy="101.227" r="32.1546" fill="black"/>
    <circle cx="101.067" cy="101.227" r="31.5012" stroke="#A72D20" strokeWidth="1.30683"/>
    </g>
    <g filter="url(#filter1_d_171_147)">
    <ellipse cx="101.782" cy="101.42" rx="29.7391" ry="30.2609" fill="black"/>
    </g>
    <defs>
    <filter id="filter0_d_171_147" x="0.772979" y="0.061912" width="200.587" height="200.588" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feMorphology radius="11.4783" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_171_147"/>
    <feOffset dy="-0.871223"/>
    <feGaussianBlur stdDeviation="28.3304"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
    </filter>
    <filter id="filter1_d_171_147" x="52.8761" y="51.9923" width="97.8123" height="98.8553" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset/>
    <feGaussianBlur stdDeviation="9.58345"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
    </filter>
    </defs>
    </svg>
  )
);

export const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 87 86" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.17 0C14.389 0 0 14.251 0 42.752C0 71.253 14.389 85.503 43.17 85.503C71.995 85.503 86.408 71.253 86.408 42.752C86.408 14.251 71.995 0 43.17 0ZM68.391 68.769C63.103 74.266 54.697 77.015 43.17 77.015C31.734 77.015 23.36 74.267 18.05 68.769C12.74 63.273 10.085 54.6 10.085 42.752C10.085 30.903 12.74 22.23 18.05 16.734C23.36 11.237 31.734 8.488 43.17 8.488C54.697 8.488 63.103 11.237 68.391 16.734C73.678 22.23 76.322 30.903 76.322 42.752C76.322 54.6 73.678 63.273 68.391 68.769Z" fill="currentColor"/>
    <path d="M60.8462 25.131C58.8102 23.095 55.5102 23.095 53.4742 25.131L43.2042 35.401L32.9342 25.131C30.8982 23.095 27.5982 23.095 25.5622 25.131C23.5262 27.167 23.5262 30.467 25.5622 32.503L35.8322 42.773L25.5622 53.043C23.5262 55.079 23.5262 58.379 25.5622 60.415C27.5982 62.451 30.8982 62.451 32.9342 60.415L43.2042 50.145L53.4742 60.415C55.5102 62.451 58.8102 62.451 60.8462 60.415C62.8822 58.379 62.8822 55.079 60.8462 53.043L50.5762 42.773L60.8462 32.503C62.8822 30.467 62.8822 27.166 60.8462 25.131Z" fill="currentColor"/>
  </svg>
)

export const PinIcon = () => (
    <svg width="13" height="13" viewBox="0 0 80 81" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44.9453 0.031461C51.3157 1.40143 55.863 4.04868 61 8.00021C61.669 8.49263 62.338 8.98505 63.0273 9.4924C70.0576 15.0888 77.8855 23.9484 79.25 33.1252C79 37.0002 79 37.0002 77.7031 38.758C76 40.0002 76 40.0002 72.5 39.7502C69 39.0002 69 39.0002 66 38.0002C65.5968 38.8607 65.5968 38.8607 65.1855 39.7385C63.9665 42.0641 62.588 44.0748 61.0312 46.1877C60.4602 46.9689 59.8891 47.7501 59.3008 48.5549C57.5 51.0002 57.5 51.0002 55.6992 53.4455C55.1282 54.2267 54.5571 55.0079 53.9688 55.8127C53.4473 56.5204 52.9259 57.2281 52.3887 57.9572C51.0356 59.9479 49.8587 61.7487 49 64.0002C49.4538 64.9077 49.9075 65.8152 50.375 66.7502C52.4418 70.8838 52.2361 73.4347 52 78.0002C48.4929 79.3578 46.2323 78.943 42.875 77.5627C24.8706 68.8441 9.87213 52.7445 1 35.0002C0.875 31.4377 0.875 31.4377 1 28.0002C2 27.0002 2 27.0002 4.6875 26.7502C8 27.0002 8 27.0002 11.0625 28.5627C14.5571 30.2728 15.368 30.1794 19 29.0002C21.1931 27.5173 23.2048 26.0372 25.25 24.3752C25.8149 23.9281 26.3797 23.4809 26.9617 23.0202C28.1034 22.116 29.2423 21.2083 30.3784 20.2971C32.6701 18.4643 34.9913 16.6704 37.3125 14.8752C38.542 13.9172 39.7713 12.9591 41 12.0002C40.505 11.0102 40.505 11.0102 40 10.0002C39.7969 8.12521 39.7969 8.12521 39.75 6.00021C39.7242 5.29896 39.6984 4.59771 39.6719 3.87521C39.7802 3.25646 39.8884 2.63771 40 2.00021C43 0.000211 43 0.000210986 44.9453 0.031461ZM50.5625 18.3869C49.8398 18.9075 49.1171 19.428 48.3726 19.9643C47.5896 20.533 46.8067 21.1018 46 21.6877C45.2029 22.2648 44.4058 22.8419 43.5845 23.4365C35.2776 29.4784 27.1247 35.7165 19 42.0002C20.4158 46.554 22.9551 49.3793 26.3125 52.6252C27.0231 53.3406 27.0231 53.3406 27.748 54.0705C30.6116 56.8909 33.4696 59.0839 37 61.0002C47.0573 48.2325 47.0573 48.2325 56.75 35.1877C57.1552 34.6326 57.5605 34.0775 57.978 33.5056C60.1503 30.4576 61.7708 27.5376 63 24.0002C61.6905 22.6639 60.3773 21.3312 59.0625 20.0002C58.3316 19.2577 57.6007 18.5152 56.8477 17.7502C53.9847 15.0386 53.5406 16.2398 50.5625 18.3869Z" fill="black"/>
    <path d="M17 58C19.6219 59.0487 20.7937 59.6493 22.25 62.125C22.4975 62.7437 22.745 63.3625 23 64C20.5044 66.6706 17.9747 69.3064 15.4375 71.9375C14.7331 72.6922 14.0286 73.447 13.3028 74.2246C7.30863 80.3845 7.30863 80.3845 2.97269 81.0039C1.99171 81.0026 1.01074 81.0013 3.19777e-05 81C-0.00668808 75.886 1.04422 73.53 4.59769 69.8164C6.07092 68.3828 7.5598 66.9651 9.06253 65.5625C9.82115 64.831 10.5798 64.0994 11.3614 63.3457C13.2281 61.5494 15.1073 59.7687 17 58Z" fill="black"/>
    </svg>
) 