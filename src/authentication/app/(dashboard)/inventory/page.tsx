"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Plus, Barcode, AlertTriangle, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InventoryItem {
  id: string
  name: string
  barcode: string
  category: string
  quantity: number
  reorderLevel: number
  unit: string
  lastUpdated: string
  location: string
  supplier?: string
}

const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Syringes (5ml)",
    barcode: "8901234567890",
    category: "Medical Supplies",
    quantity: 150,
    reorderLevel: 50,
    unit: "Box",
    lastUpdated: new Date().toISOString(),
    location: "Shelf A1",
    supplier: "MedSupply Co.",
  },
  {
    id: "2",
    name: "Gloves (Medium)",
    barcode: "8901234567891",
    category: "PPE",
    quantity: 25,
    reorderLevel: 100,
    unit: "Box",
    lastUpdated: new Date().toISOString(),
    location: "Shelf B2",
    supplier: "SafeGuard Inc.",
  },
  {
    id: "3",
    name: "Paracetamol 500mg",
    barcode: "8901234567892",
    category: "Medication",
    quantity: 200,
    reorderLevel: 100,
    unit: "Bottle",
    lastUpdated: new Date().toISOString(),
    location: "Cabinet C1",
    supplier: "PharmaCare Ltd.",
  },
  {
    id: "4",
    name: "Bandages (10cm)",
    barcode: "8901234567893",
    category: "Medical Supplies",
    quantity: 80,
    reorderLevel: 100,
    unit: "Box",
    lastUpdated: new Date().toISOString(),
    location: "Shelf A2",
    supplier: "MedSupply Co.",
  },
]

const categories = ["Medical Supplies", "PPE", "Medication", "Equipment", "Consumables"]

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentQty, setAdjustmentQty] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [newItem, setNewItem] = useState({
    name: "",
    barcode: "",
    category: "Medical Supplies",
    quantity: "",
    reorderLevel: "",
    unit: "Box",
    location: "",
    supplier: "",
  })

  const handleBarcodeUpdate = (barcode: string, quantityChange = 1) => {
    const item = inventory.find((i) => i.barcode === barcode)
    if (item) {
      const newQty = Math.max(0, item.quantity - quantityChange)
      setInventory(
        inventory.map((i) =>
          i.id === item.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i,
        ),
      )
      setBarcodeInput("")
      setIsBarcodeDialogOpen(false)
    }
  }

  const handleAddItem = () => {
    if (newItem.name && newItem.barcode && newItem.quantity) {
      const item: InventoryItem = {
        id: (inventory.length + 1).toString(),
        name: newItem.name,
        barcode: newItem.barcode,
        category: newItem.category,
        quantity: Number.parseInt(newItem.quantity),
        reorderLevel: Number.parseInt(newItem.reorderLevel) || 50,
        unit: newItem.unit,
        location: newItem.location,
        supplier: newItem.supplier,
        lastUpdated: new Date().toISOString(),
      }
      setInventory([...inventory, item])
      setNewItem({
        name: "",
        barcode: "",
        category: "Medical Supplies",
        quantity: "",
        reorderLevel: "",
        unit: "Box",
        location: "",
        supplier: "",
      })
      setIsAddDialogOpen(false)
    }
  }

  const handleAdjustStock = () => {
    if (selectedItem && adjustmentQty) {
      const change = Number.parseInt(adjustmentQty)
      const newQty = Math.max(0, selectedItem.quantity + change)
      setInventory(
        inventory.map((i) =>
          i.id === selectedItem.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i,
        ),
      )
      setSelectedItem(null)
      setAdjustmentQty("")
      setIsAdjustDialogOpen(false)
    }
  }

  const filteredInventory =
    categoryFilter === "all" ? inventory : inventory.filter((i) => i.category === categoryFilter)

  const lowStockItems = filteredInventory.filter((i) => i.quantity <= i.reorderLevel)
  const stats = {
    total: filteredInventory.length,
    lowStock: lowStockItems.length,
    outOfStock: filteredInventory.filter((i) => i.quantity === 0).length,
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Inventory Management" subtitle="Track and manage medical supplies and equipment" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            </CardContent>
          </Card>
        </div>

        {lowStockItems.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  {lowStockItems.length} items require reordering
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  {lowStockItems.map((i) => i.name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Inventory Items</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                    <Barcode className="h-4 w-4 mr-2" />
                    Scan Barcode
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Scan Item Barcode</DialogTitle>
                    <DialogDescription>Scan or enter the barcode to update inventory quantity</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="w-full h-64 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Barcode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Barcode Scanner Preview</p>
                        <p className="text-xs text-muted-foreground mt-1">Coming soon: Camera support</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barcode-input">Enter barcode:</Label>
                      <Input
                        id="barcode-input"
                        placeholder="8901234567890"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleBarcodeUpdate(barcodeInput)
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => handleBarcodeUpdate(barcodeInput)}
                      className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]"
                    >
                      Decrease Stock
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input
                          id="item-name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          placeholder="e.g., Syringes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input
                          id="barcode"
                          value={newItem.barcode}
                          onChange={(e) => setNewItem({ ...newItem, barcode: e.target.value })}
                          placeholder="8901234567890"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newItem.category}
                          onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Box">Box</SelectItem>
                            <SelectItem value="Bottle">Bottle</SelectItem>
                            <SelectItem value="Pack">Pack</SelectItem>
                            <SelectItem value="Unit">Unit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reorder">Reorder Level</Label>
                        <Input
                          id="reorder"
                          type="number"
                          value={newItem.reorderLevel}
                          onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
                          placeholder="50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newItem.location}
                          onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                          placeholder="Shelf A1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={newItem.supplier}
                        onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                        placeholder="e.g., MedSupply Co."
                      />
                    </div>
                    <Button onClick={handleAddItem} className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredInventory.map((item) => {
                const isLowStock = item.quantity <= item.reorderLevel
                const isOutOfStock = item.quantity === 0
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
                        {isLowStock && !isOutOfStock && <Badge variant="secondary">Low Stock</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Barcode: {item.barcode} • Category: {item.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location: {item.location} {item.supplier && `• Supplier: ${item.supplier}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{item.quantity}</div>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                        <p className="text-xs text-muted-foreground mt-1">Reorder: {item.reorderLevel}</p>
                      </div>
                      <Dialog
                        open={isAdjustDialogOpen && selectedItem?.id === item.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setSelectedItem(null)
                            setAdjustmentQty("")
                          }
                          setIsAdjustDialogOpen(open)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsAdjustDialogOpen(true)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Stock for {item.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              Current quantity: <span className="font-semibold">{item.quantity}</span>
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="adjustment">Adjustment (+ or -)</Label>
                              <Input
                                id="adjustment"
                                type="number"
                                placeholder="Enter quantity change"
                                value={adjustmentQty}
                                onChange={(e) => setAdjustmentQty(e.target.value)}
                              />
                            </div>
                            <Button onClick={handleAdjustStock} className="w-full bg-[#5B6EF5] hover:bg-[#4A5DE4]">
                              Update Stock
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )
              })}
              {filteredInventory.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory items</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
