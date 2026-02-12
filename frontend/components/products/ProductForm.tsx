"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProducts } from "@/contexts/ProductContext";
import { useCategories } from "@/contexts/CategoryContext";
import {
  Upload,
  X,
  Star,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";

const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be less than 255 characters"),
  description: z.string().optional(),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a number greater than 0",
    }),
  quantity: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: "Quantity must be a non-negative number",
    }),
  slug: z
    .string()
    .optional()
    .refine((val) => !val || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val), {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  status: z.enum(["draft", "active", "archived"]),
  category_id: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductImage {
  id?: number;
  image_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
  file?: File;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

interface ProductFormProps {
  productId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({
  productId,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const isEdit = !!productId;
  const router = useRouter();

  const {
    createProduct,
    updateProduct,
    fetchProduct,
    uploadProductImage,
    uploadProductImages,
    deleteProductImage,
    updateProductImage,
    setPrimaryImage,
    reorderProductImages,
    currentProduct,
    loading: contextLoading,
    uploading,
    error: contextError,
    clearError,
    refreshCurrentProduct,
  } = useProducts();

  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategories();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [slugGenerated, setSlugGenerated] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      quantity: "0",
      slug: "",
      status: "draft",
      category_id: "",
    },
    mode: "onChange",
  });

  const watchName = watch("name");

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isEdit && productId) {
      fetchProduct(productId);
    }
  }, [isEdit, productId, fetchProduct]);

  useEffect(() => {
    if (isEdit && currentProduct) {
      reset({
        name: currentProduct.name || "",
        description: currentProduct.description || "",
        price: currentProduct.price?.toString() || "",
        quantity: currentProduct.quantity?.toString() || "0",
        slug: currentProduct.slug || "",
        status:
          (currentProduct.status as "draft" | "active" | "archived") || "draft",
        category_id: currentProduct.category_id?.toString() || "",
      });

      if (currentProduct.images) {
        setImages(
          currentProduct.images
            .sort((a, b) => a.display_order - b.display_order)
            .map((img) => ({
              id: img.id,
              image_url: img.image_url,
              thumbnail_url: img.thumbnail_url,
              alt_text: img.alt_text,
              is_primary: img.is_primary,
              display_order: img.display_order,
            })),
        );
      }
    }
  }, [isEdit, currentProduct, reset]);

  useEffect(() => {
    if (!isEdit && watchName && !slugGenerated && !getValues("slug")) {
      const generatedSlug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug);
      setSlugGenerated(true);
    }
  }, [watchName, isEdit, slugGenerated, setValue, getValues]);

  useEffect(() => {
    return () => {
      clearError?.();
    };
  }, [clearError]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: ProductImage[] = files.map((file, index) => ({
      image_url: URL.createObjectURL(file),
      is_primary: images.length === 0 && index === 0,
      display_order: images.length + index,
      file: file,
      alt_text: watchName || "Product image",
      isUploading: false,
      uploadProgress: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);

    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      const newImages: ProductImage[] = imageFiles.map((file, index) => ({
        image_url: URL.createObjectURL(file),
        is_primary: images.length === 0 && index === 0,
        display_order: images.length + index,
        file: file,
        alt_text: watchName || "Product image",
        isUploading: false,
        uploadProgress: 0,
      }));

      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    if (image.image_url.startsWith("blob:")) {
      URL.revokeObjectURL(image.image_url);
    }
    const imageId = image.id;
    if (imageId) {
      setDeletedImageIds((prev) => [...prev, imageId]);
    }

    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  const moveImage = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    [newImages[index], newImages[newIndex]] = [
      newImages[newIndex],
      newImages[index],
    ];
    newImages.forEach((img, i) => (img.display_order = i));

    setImages(newImages);
  };

  const setAsPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setImages(newImages);
  };

  const updateImageAltText = (index: number, altText: string) => {
    const newImages = [...images];
    newImages[index].alt_text = altText;
    setImages(newImages);
  };

  const uploadImagesForProduct = async (productId: number) => {
    const imagesToUpload = images.filter((img) => img.file && !img.id);

    if (imagesToUpload.length === 0) return;

    const batchSize = 3;
    for (let i = 0; i < imagesToUpload.length; i += batchSize) {
      const batch = imagesToUpload.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (image, batchIndex) => {
          const imageIndex = images.findIndex((img) => img.file === image.file);
          setImages((prev) => {
            const updated = [...prev];
            updated[imageIndex] = {
              ...updated[imageIndex],
              isUploading: true,
              uploadProgress: 0,
            };
            return updated;
          });

          try {
            const uploadedImage = await uploadProductImage(
              productId,
              image.file!,
              {
                is_primary: image.is_primary,
                display_order: image.display_order,
                alt_text: image.alt_text || watchName,
              },
            );

            setImages((prev) => {
              const updated = [...prev];
              updated[imageIndex] = {
                ...uploadedImage,
                isUploading: false,
                uploadProgress: 100,
              };
              return updated;
            });
          } catch (error) {
            setImages((prev) => {
              const updated = [...prev];
              updated[imageIndex] = {
                ...updated[imageIndex],
                isUploading: false,
                error: "Failed to upload image",
              };
              return updated;
            });
            throw error;
          }
        }),
      );
    }
  };

  const deleteMarkedImages = async () => {
    if (deletedImageIds.length === 0) return;

    await Promise.all(
      deletedImageIds.map(async (imageId) => {
        try {
          await deleteProductImage(imageId);
        } catch (error) {
          console.error(`Failed to delete image ${imageId}:`, error);
        }
      }),
    );
  };

  const updateImageMetadata = async () => {
    if (!isEdit || !currentProduct) return;

    const updatedImages = images.filter((img) => img.id);

    await Promise.all(
      updatedImages.map(async (image) => {
        const originalImage = currentProduct.images?.find(
          (img) => img.id === image.id,
        );

        if (
          originalImage &&
          (originalImage.alt_text !== image.alt_text ||
            originalImage.is_primary !== image.is_primary ||
            originalImage.display_order !== image.display_order)
        ) {
          try {
            await updateProductImage(image.id!, {
              alt_text: image.alt_text || undefined,
              is_primary: image.is_primary,
              display_order: image.display_order,
            });
          } catch (error) {
            console.error(`Failed to update image ${image.id}:`, error);
          }
        }
      }),
    );

    const needsReorder = images.some(
      (img, index) => img.id && img.display_order !== index,
    );

    if (needsReorder) {
      const imageOrder = images
        .filter((img) => img.id)
        .map((img, index) => ({
          id: img.id!,
          display_order: index,
        }));

      await reorderProductImages(currentProduct.id, imageOrder);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const productData = {
        ...data,
        price: parseFloat(data.price),
        quantity: parseInt(data.quantity),
        category_id: data.category_id ? parseInt(data.category_id) : null,
        slug: data.slug || undefined,
      };

      let newProductId: number;

      if (isEdit) {
        if (!currentProduct?.id) throw new Error("Product ID not found");

        await updateProduct(currentProduct.id, productData);
        newProductId = currentProduct.id;

        await deleteMarkedImages();
        await updateImageMetadata();

        setSuccessMessage("Product updated successfully!");
      } else {
        const newProduct = await createProduct(productData);
        newProductId = newProduct.id;

        await uploadImagesForProduct(newProductId);

        setSuccessMessage("Product created successfully!");
      }

      if (isEdit) {
        await refreshCurrentProduct();
      }

      setTimeout(() => {
        onSuccess?.();
        if (!onSuccess) {
          router.push(`/products/${newProductId}`);
        }
      }, 1500);
    } catch (error: any) {
      console.error("Error in form submission:", error);
      setFormError(
        error.response?.data?.detail ||
          error.message ||
          "An error occurred while saving the product",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = contextLoading || isSubmitting || uploading;
  const isFormValid = isValid && (isEdit ? isDirty : true) && images.length > 0;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {(formError || contextError) && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {formError || contextError}
              </p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Product Images
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({images.length} uploaded)
              </span>
            </h3>

            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`relative flex items-start gap-4 p-4 rounded-lg border ${
                    image.is_primary
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="w-20 h-20 relative shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {image.isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {image.is_primary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Primary
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Order: {index + 1}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={image.alt_text || ""}
                      onChange={(e) =>
                        updateImageAltText(index, e.target.value)
                      }
                      placeholder="Alt text (for SEO)"
                      className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={isLoading}
                    />

                    {image.error && (
                      <p className="mt-1 text-xs text-red-600">{image.error}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0 || isLoading}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, "down")}
                      disabled={index === images.length - 1 || isLoading}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {!image.is_primary && (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(index)}
                        disabled={isLoading}
                        className="p-1.5 text-gray-600 hover:text-yellow-600 hover:bg-gray-100 rounded"
                        title="Set as primary"
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label className="cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Click to upload</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={isLoading}
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {" "}
                    or drag and drop
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>

              {!isEdit && images.length === 0 && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  At least one product image is required
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Product Status
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <select
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    ref={ref}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                )}
              />
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.status.message}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Draft: Only visible to you
                <br />
                active: Visible to customers
                <br />
                archived: Listed but not purchasable
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter product name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700"
                >
                  URL Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  {...register("slug")}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.slug ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="product-name-url"
                  disabled={isLoading}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.slug.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to auto-generate from product name
                </p>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={6}
                  {...register("description")}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Product description"
                  disabled={isLoading}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="price"
                    {...register("price")}
                    className={`block w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="quantity"
                  {...register("quantity")}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quantity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                  disabled={isLoading}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category</h3>

            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <Controller
                name="category_id"
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <select
                    id="category_id"
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || ""}
                    ref={ref}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading || categoriesLoading}
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category_id.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Select a category to help customers find your product
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {uploading
                ? "Uploading Images..."
                : isEdit
                  ? "Updating Product..."
                  : "Creating Product..."}
            </span>
          ) : isEdit ? (
            "Update Product"
          ) : (
            "Create Product"
          )}
        </button>
      </div>

      {!isFormValid && !isLoading && (
        <div className="text-sm text-gray-500 text-right">
          {!isValid && "Please fix form errors"}
          {!isEdit && images.length === 0 && " • At least one image required"}
          {isEdit && !isDirty && " • No changes to save"}
        </div>
      )}
    </form>
  );
}
