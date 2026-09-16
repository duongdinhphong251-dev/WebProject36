import { SVGProps } from "react";

const ViIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <g clipPath="url(#clip0_141_1558)">
      <path
        fill="#D80027"
        d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12"
      ></path>
      <path
        fill="#FFDA44"
        d="m12 6.261 1.295 3.986h4.191l-3.39 2.463 1.295 3.986L12 14.233 8.61 16.696l1.295-3.986-3.39-2.463h4.19z"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0_141_1558">
        <path fill="#fff" d="M0 0h24v24H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

export default ViIcon;
