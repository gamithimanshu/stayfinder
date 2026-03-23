export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer>
      <p>&copy; {year} StayFinder. All rights reserved.</p>
    </footer>
  );
};
