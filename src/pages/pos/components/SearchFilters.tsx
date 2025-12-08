import { Search, ShoppingCart, ScanBarcode } from 'lucide-react';
import type{ Medicine, Service } from '../types';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  medicines: Medicine[];
  services: Service[];
  onToggleCart: () => void;
  onOpenScanner: () => void;
  cartItemCount: number;
}

export const SearchFilters = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  medicines,
  services,
  onToggleCart,
  onOpenScanner,
  cartItemCount,
}: SearchFiltersProps) => {
  const medicineTypes = ['all', ...new Set(medicines.map((m) => m.type))];
  const serviceNames = ['all', ...new Set(services.map((s) => s.name))];
  const allTypes = [...new Set([...medicineTypes, ...serviceNames])];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or barcode..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {allTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={onOpenScanner}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ScanBarcode className="w-5 h-5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button
            onClick={onToggleCart}
            className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
