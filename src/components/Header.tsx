
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="w-full p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          Imperfect Breath
        </Link>
      </nav>
    </header>
  );
};

export default Header;
