"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Card,
  CardBody,
  User,
  Chip,
  Tooltip,
  Pagination,
} from "@heroui/react";
import { Link } from "@heroui/react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Image as ImageIcon,
  Package,
  Download,
} from "lucide-react";

import { Navbar } from "../components/navbar";
import { useAuth } from "../components/auth-provider";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  subscribeToProducts,
  type Product,
} from "../lib/supabase/products";

// Function to format price in yen
const formatPriceInYen = (price: number) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(price);
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState<string>("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const rowsPerPage = 6;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = subscribeToProducts((fetchedProducts) => {
      setProducts(fetchedProducts);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => {
    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.description.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }, [products, searchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const handleAddOrUpdateProduct = async () => {
    if (!productName || !productPrice || !productDescription) {
      alert("Please fill out all fields.");

      return;
    }

    setIsLoading(true);
    const priceAsNumber = parseFloat(productPrice);
    let imageUrl = "";

    try {
      if (productImage) {
        imageUrl = await uploadProductImage(productImage);
      } else if (selectedProductId) {
        const existingProduct = products.find(
          (p) => p.id === selectedProductId,
        );

        imageUrl = existingProduct?.image_url || "";
      }

      if (selectedProductId) {
        await updateProduct(selectedProductId, {
          name: productName,
          price: priceAsNumber,
          description: productDescription,
          image_url: imageUrl,
        });
      } else {
        await addProduct({
          name: productName,
          price: priceAsNumber,
          description: productDescription,
          image_url: imageUrl,
        });
      }

      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Failed to save product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
    } catch (error: any) {
      console.error("Failed to delete product:", error);
    }
  };

  const resetForm = () => {
    setProductName("");
    setProductPrice("");
    setProductDescription("");
    setProductImage(null);
    setSelectedProductId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProductId(product.id);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductDescription(product.description);
    onOpen();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HeroUI Navbar */}
      <Navbar />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Active Inventory
            </h1>
            <p className="text-default-500">
              Overview of your product store and stock.
            </p>
          </div>
          <div className="flex gap-3">
            <Button startContent={<Download size={18} />} variant="flat">
              Export
            </Button>
            <Button
              className="shadow-lg shadow-primary/30"
              color="primary"
              endContent={<Plus size={18} />}
              onPress={onOpen}
            >
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary text-primary-foreground">
            <CardBody className="flex flex-row items-center gap-4 p-6 text-white">
              <div className="p-3 bg-white/20 rounded-xl">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm font-medium opacity-80">Total Products</p>
                <h3 className="text-2xl font-bold font-mono">
                  {products.length}
                </h3>
              </div>
            </CardBody>
          </Card>
          <Card className="border-none bg-content2">
            <CardBody className="flex flex-row items-center gap-4 p-6">
              <div className="p-3 bg-success/20 rounded-xl text-success font-mono font-bold">
                ¥
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">
                  Inventory Value
                </p>
                <h3 className="text-2xl font-bold">
                  {isMounted
                    ? formatPriceInYen(
                        products.reduce((acc, curr) => acc + curr.price, 0),
                      )
                    : "¥0"}
                </h3>
              </div>
            </CardBody>
          </Card>
          <Card className="border-none bg-content2">
            <CardBody className="flex flex-row items-center gap-4 p-6">
              <div className="p-3 bg-secondary/20 rounded-xl text-secondary font-mono font-bold font-mono font-bold">
                ⚡
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">
                  Recent Updates
                </p>
                <h3 className="text-2xl font-bold">Real-time</h3>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="border-none shadow-xl bg-content1">
          <CardBody className="p-0">
            <Table
              removeWrapper
              aria-label="Inventory table"
              bottomContent={
                <div className="flex w-full justify-between items-center p-4 border-t border-divider">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                  />
                  <div className="flex gap-2 text-small text-default-400">
                    <span className="text-default-500">
                      {filteredItems.length} items found
                    </span>
                    <span>|</span>
                    <span>Rows per page: {rowsPerPage}</span>
                  </div>
                </div>
              }
            >
              <TableHeader>
                <TableColumn className="bg-transparent">PRODUCT</TableColumn>
                <TableColumn className="bg-transparent text-center">
                  CATEGORY
                </TableColumn>
                <TableColumn className="bg-transparent text-center">
                  PRICE
                </TableColumn>
                <TableColumn className="bg-transparent text-end">
                  ACTIONS
                </TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="No products matching your search"
                items={items}
              >
                {(item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-divider/50 last:border-0 hover:bg-default-50 transition-colors"
                  >
                    <TableCell>
                      <User
                        avatarProps={{
                          radius: "lg",
                          src: item.image_url,
                          fallback: <ImageIcon size={20} />,
                          className: "bg-default-100",
                        }}
                        description={
                          <span className="text-tiny opacity-60 font-mono">
                            #{item.id.slice(0, 8)}
                          </span>
                        }
                        name={
                          <span className="font-semibold text-medium">
                            {item.name}
                          </span>
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Chip
                        className="capitalize"
                        color="warning"
                        size="sm"
                        variant="flat"
                      >
                        General
                      </Chip>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-success-600 font-mono">
                        {formatPriceInYen(item.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Tooltip content="Edit Details">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openEditModal(item)}
                          >
                            <Pencil
                              className="text-default-500 hover:text-primary transition-colors"
                              size={18}
                            />
                          </Button>
                        </Tooltip>
                        <Tooltip color="danger" content="Delete Product">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleDeleteProduct(item.id)}
                          >
                            <Trash2
                              className="text-danger opacity-70 hover:opacity-100 transition-colors"
                              size={18}
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </main>

      {/* Modal Form */}
      <Modal
        backdrop="blur"
        classNames={{
          base: "bg-content1 dark:bg-black border border-divider shadow-2xl",
          header: "border-b border-divider/50",
          footer: "border-t border-divider/50",
        }}
        isOpen={isOpen}
        placement="center"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedProductId ? "Update Item" : "New Inventory Entry"}
              </ModalHeader>
              <ModalBody className="py-6 gap-4">
                <Input
                  label="Name"
                  placeholder="e.g. Mechanical Keyboard"
                  value={productName}
                  variant="flat"
                  onValueChange={setProductName}
                />
                <Input
                  label="Price"
                  placeholder="0.00"
                  startContent={<span className="text-default-400">¥</span>}
                  type="number"
                  value={productPrice}
                  variant="flat"
                  onValueChange={setProductPrice}
                />
                <Input
                  label="Description"
                  placeholder="Add details about this item..."
                  value={productDescription}
                  variant="flat"
                  onValueChange={setProductDescription}
                />
                <div className="space-y-2">
                  <p className="text-tiny text-default-500 ml-1">Cover Image</p>
                  <div className="flex items-center justify-center border-2 border-dashed border-divider rounded-xl overflow-hidden hover:border-primary transition-colors p-4">
                    <input
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      id="product-image"
                      type="file"
                      onChange={(e) =>
                        setProductImage(
                          e.target.files ? e.target.files[0] : null,
                        )
                      }
                    />
                    <label
                      className="cursor-pointer flex flex-col items-center gap-2 text-default-400"
                      htmlFor="product-image"
                    >
                      {productImage ? (
                        <div className="text-success flex items-center gap-2">
                          <ImageIcon size={20} />
                          <span className="text-small truncate max-w-[200px]">
                            {productImage.name}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Plus size={24} />
                          <span className="text-tiny">Click to upload</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    resetForm();
                    onClose();
                  }}
                >
                  Close
                </Button>
                <Button
                  className="px-8"
                  color="primary"
                  isLoading={isLoading}
                  onPress={handleAddOrUpdateProduct}
                >
                  {selectedProductId ? "Update" : "Create"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
