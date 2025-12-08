import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type{ Medicine, Service } from '../types';
import { MedicineCard } from './MedicineCard';
import { ServiceCard } from './ServiceCard';

interface ProductDisplayProps {
  medicines: Medicine[];
  services: Service[];
  onAddMedicineToCart: (medicine: Medicine) => void;
  onAddServiceToCart: (service: Service) => void;
  searchQuery: string;
  selectedType: string;
}

export const ProductDisplay = ({
  medicines,
  services,
  onAddMedicineToCart,
  onAddServiceToCart,
  searchQuery,
  selectedType,
}: ProductDisplayProps) => {
  const [activeTab, setActiveTab] = useState<'medicines' | 'services'>('medicines');

  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.barcode.includes(searchQuery);
    const matchesType = selectedType === 'all' || med.type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredServices = services.filter((svc) => {
    const matchesSearch = svc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || svc.name === selectedType;
    return matchesSearch && matchesType;
  });

  const handlePrevious = () => {
    setActiveTab(activeTab === 'medicines' ? 'services' : 'medicines');
  };

  const handleNext = () => {
    setActiveTab(activeTab === 'medicines' ? 'services' : 'medicines');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('medicines')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'medicines'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Medicine List
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Service List
          </button>
        </div>

        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'medicines' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((medicine) => (
                <MedicineCard
                  key={medicine._id}
                  medicine={medicine}
                  onAddToCart={onAddMedicineToCart}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No medicines found
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  onAddToCart={onAddServiceToCart}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No services found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
