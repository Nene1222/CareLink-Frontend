import React, { useState, useEffect } from 'react';
import '../../assets/style/inventory/medicineDetail.css';
import BatchesTable from '../../components/inventory/BatchesTable';
import BatchDetailModal from '../../components/inventory/BatchDetailModal';
import AddBatchModal from '../../components/inventory/AddBatchModal';
import EditBatchModal from '../../components/inventory/EditBatchModal';
import InventoryBar from '../../components/layout/inventoryBar';
// TODO: Uncomment when backend API is integrated
// import { inventoryService } from '../../services/api/inventoryService';
import { medicineDetailsData, batchesByMedicine, batchDetailsData, type Batch, type BatchDetail } from './data/inventoryData';

interface MedicineDetailProps {
  medicineId: string;
  medicineName: string;
  onBack: () => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({
  medicineId,
  medicineName,
  onBack
  }) => {
  const [isBatchesOpen, setIsBatchesOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchDetails, setBatchDetails] = useState<{ [key: string]: any }>({});
  const [medicineData, setMedicineData] = useState({
    id: medicineId,
    name: medicineName,
    group: 'Unknown',
    description: {} as { genericName?: string },
    stock: { total: 0, batches: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load medicine and batches from API
  useEffect(() => {
    loadMedicineData();
  }, [medicineId]);

  const loadMedicineData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Uncomment when backend API is integrated
      // const medicine = await inventoryService.getMedicineById(medicineId);
      
      // Mock data for frontend testing
      const medicineDetail = medicineDetailsData[medicineId];
      if (medicineDetail) {
        setMedicineData({
          id: medicineDetail.id,
          name: medicineDetail.name,
          group: medicineDetail.group,
          description: { genericName: medicineDetail.description.genericName },
          stock: medicineDetail.stock
        });
      } else {
        // Fallback if medicine not found in mock data
        setMedicineData({
          id: medicineId,
          name: medicineName,
          group: 'Unknown',
          description: {},
          stock: { total: 0, batches: 0 }
        });
      }
      
      // Load batches from mock data
      const batchesData = batchesByMedicine[medicineId] || [];
      setBatches(batchesData);
      
      // Convert batches to batch details format
      const details: { [key: string]: BatchDetail } = {};
      batchesData.forEach((batch: Batch) => {
        const batchDetail = batchDetailsData[batch.id];
        if (batchDetail) {
          details[batch.id] = batchDetail;
        } else {
          // Fallback batch detail
          details[batch.id] = {
            batchNo: batch.batchNo || `BATCH-${batch.id.slice(-6)}`,
            supplier: 'Unknown',
            quantity: batch.qty || 0,
            purchaseDate: batch.purchaseDate || '',
            expiryDate: batch.expiryDate || '',
            purchasingPrice: 0,
            settingPrice: 0,
            priceUnit: 'Unit'
          };
        }
      });
      setBatchDetails(details);
    } catch (err: any) {
      console.error('Failed to load medicine data:', err);
      setError(err.message || 'Failed to load medicine data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = () => {
    setIsAddBatchModalOpen(true);
  };

  const handleSaveBatch = async (batchData: {
    batchNo: string;
    supplier: string;
    quantity: number;
    purchaseDate: string;
    expiryDate: string;
    purchasingPrice: number;
    settingPrice: number;
  }) => {
    try {
      setError(null);
      // TODO: Uncomment when backend API is integrated
      // await inventoryService.createBatch({
      //   medicine_id: medicineId,
      //   supplier: batchData.supplier,
      //   quantity: batchData.quantity,
      //   purchase_date: batchData.purchaseDate,
      //   expiry_date: batchData.expiryDate,
      //   purchase_price: batchData.purchasingPrice,
      //   setting_price: batchData.settingPrice,
      // });
      
      // Mock create for frontend testing
      const newBatchId = `batch-${Date.now()}`;
      const newBatch: Batch = {
        id: newBatchId,
        batchNo: batchData.batchNo,
        expiryDate: batchData.expiryDate,
        qty: batchData.quantity,
        remaining: batchData.quantity,
        purchaseDate: batchData.purchaseDate
      };
      
      const newBatchDetail: BatchDetail = {
        batchNo: batchData.batchNo,
        supplier: batchData.supplier,
        quantity: batchData.quantity,
        purchaseDate: batchData.purchaseDate,
        expiryDate: batchData.expiryDate,
        purchasingPrice: batchData.purchasingPrice,
        settingPrice: batchData.settingPrice,
        priceUnit: 'Unit'
      };
      
      setBatches(prev => [...prev, newBatch]);
      setBatchDetails(prev => ({ ...prev, [newBatchId]: newBatchDetail }));
      
      // Update stock
      setMedicineData(prev => ({
        ...prev,
        stock: {
          total: prev.stock.total + batchData.quantity,
          batches: prev.stock.batches + 1
        }
      }));
      
      setIsAddBatchModalOpen(false);
    } catch (err: any) {
      console.error('Error creating batch:', err);
      setError(err.message || 'Failed to create batch');
      alert(err.message || 'Failed to create batch');
    }
  };

  const handleCloseAddBatchModal = () => {
    setIsAddBatchModalOpen(false);
  };

  const handleBatchesClick = () => {
    setIsBatchesOpen(!isBatchesOpen);
  };

  const handleBatchDetailClick = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  const handleCloseBatchDetail = () => {
    setSelectedBatchId(null);
  };

  const handleEditBatch = () => {
    setIsEditBatchModalOpen(true);
  };

  const handleSaveEditBatch = async (batchId: string, batchData: {
    batchNo: string;
    supplier: string;
    quantity: number;
    purchaseDate: string;
    expiryDate: string;
    purchasingPrice: number;
    settingPrice: number;
  }) => {
    try {
      setError(null);
      // TODO: Uncomment when backend API is integrated
      // await inventoryService.updateBatch(batchId, {
      //   supplier: batchData.supplier,
      //   quantity: batchData.quantity,
      //   purchase_date: batchData.purchaseDate,
      //   expiry_date: batchData.expiryDate,
      //   purchase_price: batchData.purchasingPrice,
      //   setting_price: batchData.settingPrice,
      // });
      
      // Mock update for frontend testing
      setBatches(prev =>
        prev.map(batch =>
          batch.id === batchId
            ? { ...batch, batchNo: batchData.batchNo, expiryDate: batchData.expiryDate, qty: batchData.quantity, remaining: batchData.quantity, purchaseDate: batchData.purchaseDate }
            : batch
        )
      );
      
      setBatchDetails(prev => ({
        ...prev,
        [batchId]: {
          ...prev[batchId],
          batchNo: batchData.batchNo,
          supplier: batchData.supplier,
          quantity: batchData.quantity,
          purchaseDate: batchData.purchaseDate,
          expiryDate: batchData.expiryDate,
          purchasingPrice: batchData.purchasingPrice,
          settingPrice: batchData.settingPrice
        }
      }));
      
      setIsEditBatchModalOpen(false);
      handleCloseBatchDetail();
    } catch (err: any) {
      console.error('Error updating batch:', err);
      setError(err.message || 'Failed to update batch');
      alert(err.message || 'Failed to update batch');
    }
  };

  const handleCloseEditBatchModal = () => {
    setIsEditBatchModalOpen(false);
  };

  const handleDeleteBatch = async () => {
    if (selectedBatchId) {
      if (window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
        try {
          setError(null);
          // TODO: Uncomment when backend API is integrated
          // await inventoryService.deleteBatch(selectedBatchId);
          
          // Mock delete for frontend testing
          const batchToDelete = batches.find(b => b.id === selectedBatchId);
          setBatches(prev => prev.filter(b => b.id !== selectedBatchId));
          setBatchDetails(prev => {
            const newDetails = { ...prev };
            delete newDetails[selectedBatchId];
            return newDetails;
          });
          
          // Update stock
          if (batchToDelete) {
            setMedicineData(prev => ({
              ...prev,
              stock: {
                total: Math.max(0, prev.stock.total - (batchToDelete.qty || 0)),
                batches: Math.max(0, prev.stock.batches - 1)
              }
            }));
          }
          
          handleCloseBatchDetail();
        } catch (err: any) {
          console.error('Error deleting batch:', err);
          setError(err.message || 'Failed to delete batch');
          alert(err.message || 'Failed to delete batch');
        }
      }
    }
  };

  // Get batch detail from state
  const selectedBatchDetail = selectedBatchId ? batchDetails[selectedBatchId] : null;

  return (
    <div className="medicine-detail-container">
      {/* Inventory Bar */}
      <InventoryBar
        showBackButton={true}
        onBack={onBack}
        showSearchBar={false}
      />

      {/* Medicine Name and Add Stock Button */}
      <div className="medicine-header">
        <h2 className="medicine-name">{medicineData.name}</h2>
        <button className="add-stock-btn" onClick={handleAddStock}>
          <span className="plus-icon">+</span>
          Add Stock
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fee', 
          color: '#c33', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading medicine data...
        </div>
      )}

      {/* Medicine Detail Card */}
      <div className="detail-card">
        {/* Group */}
        <div className="detail-section group-section">
          <span className="detail-label">Group:</span>
          <span className="detail-value group-value">{medicineData.group}</span>
        </div>

        {/* Description - Only show if there's actual content */}
        {Object.keys(medicineData.description).length > 0 && (
        <div className="detail-section description-section">
          <div className="section-label">Description:</div>
          <div className="description-content">
              {medicineData.description.genericName && (
            <div className="description-item">
                  <span className="desc-label">Description:</span>
              <span className="desc-value">{medicineData.description.genericName}</span>
            </div>
              )}
            </div>
          </div>
        )}

        {/* Stock */}
        <div className="detail-section stock-section">
          <div className="section-label">Stock:</div>
          <div className="stock-content">
            <div className="stock-item">
              <span className="stock-label">Total:</span>
              <span className="stock-value">{medicineData.stock.total} units</span>
            </div>
            <div className="batches-item" onClick={handleBatchesClick}>
              <span className="batches-count">{medicineData.stock.batches} Batches</span>
              <div className="batches-icons">
                <span className="warning-icon">⚠️</span>
                <svg 
                  className={`dropdown-arrow ${isBatchesOpen ? 'open' : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            {isBatchesOpen && (
              <BatchesTable
                batches={batches}
                onDetailClick={handleBatchDetailClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Batch Detail Modal */}
      {selectedBatchDetail && (
        <BatchDetailModal
          isOpen={selectedBatchId !== null && !isEditBatchModalOpen}
          onClose={handleCloseBatchDetail}
          batchDetail={selectedBatchDetail}
          onEdit={handleEditBatch}
          onDelete={handleDeleteBatch}
        />
      )}

      {/* Edit Batch Modal */}
      {selectedBatchId && selectedBatchDetail && (
        <EditBatchModal
          isOpen={isEditBatchModalOpen}
          onClose={handleCloseEditBatchModal}
          onSave={handleSaveEditBatch}
          batchId={selectedBatchId}
          batchDetail={selectedBatchDetail}
        />
      )}

      {/* Add Batch Modal */}
      <AddBatchModal
        isOpen={isAddBatchModalOpen}
        onClose={handleCloseAddBatchModal}
        onSave={handleSaveBatch}
        medicineName={medicineData.name}
      />
    </div>
  );
};

export default MedicineDetail;

