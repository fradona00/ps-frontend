
export default function LoadingScreen({ visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-[#FFD100] mx-auto"></div> 
    </div>
  );
}
