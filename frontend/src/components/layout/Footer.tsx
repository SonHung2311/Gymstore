export default function Footer() {
  return (
    <footer className="bg-dark text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-white font-semibold text-lg">💪 GymStore</p>
            <p className="text-sm mt-1">Dụng cụ thể thao chất lượng cao</p>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} GymStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
