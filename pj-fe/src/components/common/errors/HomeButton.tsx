export default function HomeButton() {
  const handleNavigation = () => {
    window.location.href = '/';
  };

  return (
    <button type="button" onClick={handleNavigation}>
      Back to Home Page
    </button>
  );
}
