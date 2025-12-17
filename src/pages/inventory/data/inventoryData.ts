// Minimal mock data and types used by the Inventory page.
// This file intentionally provides a small dataset so the UI can render
// without a backend during frontend development.

export type Medicine = {
	id: string;
	name: string;
	barcode?: string;
	stock: number;
};

export type MedicineGroup = {
	id: string;
	title: string;
	totalMedicines: number;
	totalStocks: number;
	medicines: Medicine[];
};

export const medicineGroupsData: MedicineGroup[] = [
	{
		id: 'group-1',
		title: 'Pain Relief',
		totalMedicines: 2,
		totalStocks: 120,
		medicines: [
			{ id: 'm-1', name: 'Paracetamol 500mg', barcode: '000111222', stock: 80 },
			{ id: 'm-2', name: 'Ibuprofen 200mg', barcode: '000111223', stock: 40 },
		],
	},
	{
		id: 'group-2',
		title: 'Antibiotics',
		totalMedicines: 1,
		totalStocks: 60,
		medicines: [
			{ id: 'm-3', name: 'Amoxicillin 500mg', barcode: '000111224', stock: 60 },
		],
	},
];

// Additional mock structures used by other inventory pages/components

export type Batch = {
	id: string;
	batchNo?: string;
	expiryDate?: string;
	qty?: number;
	remaining?: number;
	purchaseDate?: string;
};

export type BatchDetail = {
	batchNo: string;
	supplier: string;
	quantity: number;
	purchaseDate: string;
	expiryDate: string;
	purchasingPrice: number;
	settingPrice: number;
	priceUnit?: string;
};

// Medicines keyed by group name (used by MedicineList)
export const medicinesByGroup: Record<string, { id: string; name: string }[]> = {
	'Pain Relief': [
		{ id: 'm-1', name: 'Paracetamol 500mg' },
		{ id: 'm-2', name: 'Ibuprofen 200mg' },
	],
	'Antibiotics': [
		{ id: 'm-3', name: 'Amoxicillin 500mg' },
	],
};

// Detailed medicine records keyed by medicine id (used by MedicineDetail)
export const medicineDetailsData: Record<string, {
	id: string;
	name: string;
	group: string;
	description: { genericName?: string };
	stock: { total: number; batches: number };
}> = {
	'm-1': {
		id: 'm-1',
		name: 'Paracetamol 500mg',
		group: 'Pain Relief',
		description: { genericName: 'Acetaminophen' },
		stock: { total: 80, batches: 2 }
	},
	'm-2': {
		id: 'm-2',
		name: 'Ibuprofen 200mg',
		group: 'Pain Relief',
		description: { genericName: 'Ibuprofen' },
		stock: { total: 40, batches: 1 }
	},
	'm-3': {
		id: 'm-3',
		name: 'Amoxicillin 500mg',
		group: 'Antibiotics',
		description: { genericName: 'Amoxicillin' },
		stock: { total: 60, batches: 1 }
	}
};

// Batches keyed by medicine id
export const batchesByMedicine: Record<string, Batch[]> = {
	'm-1': [
		{ id: 'batch-101', batchNo: 'P-101', expiryDate: '2026-06-01', qty: 50, remaining: 40, purchaseDate: '2024-06-01' },
		{ id: 'batch-102', batchNo: 'P-102', expiryDate: '2027-01-01', qty: 30, remaining: 30, purchaseDate: '2025-01-01' },
	],
	'm-2': [
		{ id: 'batch-201', batchNo: 'I-201', expiryDate: '2026-12-01', qty: 40, remaining: 40, purchaseDate: '2025-02-01' },
	],
	'm-3': [
		{ id: 'batch-301', batchNo: 'A-301', expiryDate: '2026-03-01', qty: 60, remaining: 60, purchaseDate: '2024-12-01' },
	]
};

// Batch detail records keyed by batch id
export const batchDetailsData: Record<string, BatchDetail> = {
	'batch-101': { batchNo: 'P-101', supplier: 'PharmaCo', quantity: 50, purchaseDate: '2024-06-01', expiryDate: '2026-06-01', purchasingPrice: 100, settingPrice: 120, priceUnit: 'Pack' },
	'batch-102': { batchNo: 'P-102', supplier: 'PharmaCo', quantity: 30, purchaseDate: '2025-01-01', expiryDate: '2027-01-01', purchasingPrice: 60, settingPrice: 72, priceUnit: 'Pack' },
	'batch-201': { batchNo: 'I-201', supplier: 'MediCorp', quantity: 40, purchaseDate: '2025-02-01', expiryDate: '2026-12-01', purchasingPrice: 200, settingPrice: 230, priceUnit: 'Box' },
	'batch-301': { batchNo: 'A-301', supplier: 'HealthSupplies', quantity: 60, purchaseDate: '2024-12-01', expiryDate: '2026-03-01', purchasingPrice: 300, settingPrice: 360, priceUnit: 'Box' },
};

