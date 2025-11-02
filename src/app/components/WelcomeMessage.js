import { set } from "date-fns";

export default function WelcomeMessage({ visible, setVisible, title, message }) {
  if (!visible) return null;

  const handleOverlayClick = (e) => {
    // Chiudi solo se clicchi sull'overlay, NON sul contenitore interno
    if (e.target === e.currentTarget) {
      setVisible(false);
    }
  };

  return (
    <div
      onClick={handleOverlayClick} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center md:w-1/2 w-3/4">
        <p className='text-4xl py-10'>{title}</p>
        <p className='text-2xl py-10'>{message}</p>
      </div>
    </div>
  );
}
