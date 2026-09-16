const ShareIcon = ({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 14 13"
    className={className}
  >
    <path
      stroke="#A4A7AE"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      d="M12.486 6.639c.163-.14.244-.21.274-.293a.33.33 0 0 0 0-.225c-.03-.083-.111-.153-.274-.292L6.839.989c-.28-.24-.42-.361-.54-.364a.33.33 0 0 0-.266.123c-.075.092-.075.276-.075.645v2.864A6.444 6.444 0 0 0 .625 10.6v.408A7.6 7.6 0 0 1 5.958 8.28v2.793c0 .369 0 .553.075.645.065.08.164.126.267.123.119-.003.259-.123.539-.363z"
    ></path>
  </svg>
);

export default ShareIcon;
