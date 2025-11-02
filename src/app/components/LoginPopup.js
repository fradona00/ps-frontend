

export default function LoginPopup({ visible, onClick }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center w-4/5 text-center">
        <p className="text-white text-lg mb-4">Per continuare è necessario effettuare il login</p>
        <button onClick={onClick} className="text-bold text-white border-0 rounded-4xl bg-[#164194] py-2 px-8 hover:cursor-pointer hover:bg-[#FFD100] hover:text-[#164194] transition-colors ">LOGIN</button>
      </div>
    </div>
  );
}
