// import { useState, useEffect } from 'react';
// import type{ Medicine, Service } from '../types';

// export const usePOSData = () => {
//   const [medicines, setMedicines] = useState<Medicine[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         // Fetch medicines, batches, and groups from backend
//         const [medRes, batchRes, groupRes, servicesRes] = await Promise.all([
//           fetch('/api/medicines'),
//           fetch('/api/batches'),
//           fetch('/api/group-medicines'),
//           fetch('/data/services.json'), // keep services from static file
//         ]);

//         if (!medRes.ok || !batchRes.ok || !groupRes.ok || !servicesRes.ok) {
//           throw new Error('Failed to fetch data');
//         }

//         const medicinesData = await medRes.json();
//         const batchesData = await batchRes.json();
//         const groupsData = await groupRes.json();
//         const servicesData = await servicesRes.json();

//         // Transform medicines
//         const transformedMedicines: Medicine[] = medicinesData.map((med: any) => {
//           const medBatches = batchesData.filter(
//             (batch: any) => batch.medicine_id === med._id && batch.quantity > 0
//           );

//           const totalQuantity = medBatches.reduce(
//             (sum: number, batch: any) => sum + batch.quantity,
//             0
//           );

//           const expireDates = medBatches
//             .map((batch: any) => batch.expiry_date)
//             .sort();

//           const group = groupsData.find((g: any) => g._id === med.group_medicine_id);

//           return {
//             _id: med._id,
//             image: med.photo || '',
//             name: med.name,
//             type: group?.group_name || '',
//             price: medBatches[0]?.setting_price || 0,
//             barcode: med.barcode_value || '',
//             quantity: totalQuantity,
//             expireDate: expireDates,
//           };
//         });

//         setMedicines(transformedMedicines);
//         setServices(servicesData);
//         setError(null);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'An error occurred');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   return { medicines, services, loading, error };
// };


import { useState, useEffect } from 'react';
import type{ Medicine, Service } from '../types';

export const usePOSData = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [medRes, batchRes, groupRes, servicesRes] = await Promise.all([
          fetch('/data/medicines.json'),
          fetch('/data/batches.json'),
          fetch('/data/group-medicines.json'),
          fetch('/data/services.json')
        ]);

        if (!medRes.ok || !batchRes.ok || !groupRes.ok || !servicesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const medicinesData = await medRes.json();
        const batchesData = await batchRes.json();
        const groupsData = await groupRes.json();
        const servicesData = await servicesRes.json();

        const transformedMedicines: Medicine[] = medicinesData.map((med: any) => {
          const medBatches = batchesData.filter(
            (batch: any) => batch.medicine_id === med._id && batch.quantity > 0
          );

          const totalQuantity = medBatches.reduce(
            (sum: number, batch: any) => sum + batch.quantity,
            0
          );

          const expireDates = medBatches.map((batch: any) => batch.expiry_date).sort();

          const group = groupsData.find((g: any) => g._id === med.group_medicine_id);

          return {
            _id: med._id,
            image: med.photo || '',
            name: med.name,
            type: group?.group_name || '',
            price: medBatches[0]?.setting_price || 0,
            barcode: med.barcode_value || '',
            quantity: totalQuantity,
            expireDate: expireDates
          };
        });

        setMedicines(transformedMedicines);
        setServices(servicesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { medicines, services, loading, error };
};
