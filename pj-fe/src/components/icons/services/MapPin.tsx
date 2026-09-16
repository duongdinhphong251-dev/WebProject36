import { ComponentProps } from "react";

const MapPin = (props: ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    fill="none"
    viewBox="0 0 12 12"
    {...props}
  >
    <path
      fill="#414651"
      stroke="#414651"
      strokeWidth="0.5"
      d="M5.995 1.125H6c1.683 0 3.573.986 4.066 3.155.554 2.444-.938 4.538-2.355 5.9a2.45 2.45 0 0 1-1.71.695 2.47 2.47 0 0 1-1.717-.695c-1.372-1.32-2.816-3.33-2.4-5.677l.045-.228c.493-2.168 2.387-3.15 4.066-3.15ZM6 3.33a1.825 1.825 0 1 0 0 3.65 1.825 1.825 0 0 0 0-3.65Z"
    ></path>
  </svg>
);

export default MapPin;
