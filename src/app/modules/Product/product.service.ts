import httpStatus from "http-status";
import { Product } from "./product.model";
import { TProduct, TProductFilter } from "./product.interface";
import { ProductSearchableFields } from "./product.constant";
import AppError from "../../error/AppError";
import QueryBuilder from "../../builder/QueryBuilder";

const createProduct = async (
  payload: Partial<TProduct>,
  vendorId: string
): Promise<TProduct> => {
  try {
    // Set vendor from authenticated user
    payload.vendor = vendorId as any;

    // Check if slug already exists
    if (payload.slug) {
      const existingProduct = await Product.findOne({ slug: payload.slug });
      if (existingProduct) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Product with this slug already exists"
        );
      }
    }

    const result = await Product.create(payload);
    return result;
  } catch (error) {
    throw error;
  }
};

const getAllProducts = async (query: Record<string, unknown>) => {
  try {
    const productQuery = new QueryBuilder(
      Product.find({ isActive: true }).populate("vendor", "name email"),
      query
    )
      .search(ProductSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await productQuery.modelQuery;
    const meta = await productQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getAllProductsForAdmin = async (query: Record<string, unknown>) => {
  try {
    const productQuery = new QueryBuilder(
      Product.find().populate("vendor", "name email"),
      query
    )
      .search(ProductSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await productQuery.modelQuery;
    const meta = await productQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getProductById = async (id: string): Promise<TProduct> => {
  try {
    const result = await Product.findById(id).populate("vendor", "name email");

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getProductBySlug = async (slug: string): Promise<TProduct> => {
  try {
    const result = await Product.findOne({ slug, isActive: true }).populate(
      "vendor",
      "name email"
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getProductsByVendor = async (
  vendorId: string,
  query: Record<string, unknown>
) => {
  try {
    const productQuery = new QueryBuilder(
      Product.find({ vendor: vendorId }).populate("vendor", "name email"),
      query
    )
      .search(ProductSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await productQuery.modelQuery;
    const meta = await productQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getFeaturedProducts = async (limit: number = 8) => {
  try {
    const result = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .populate("vendor", "name email")
      .sort({ createdAt: -1 })
      .limit(limit);

    return result;
  } catch (error) {
    throw error;
  }
};

const getProductsByCategory = async (
  category: string,
  query: Record<string, unknown>
) => {
  try {
    const productQuery = new QueryBuilder(
      Product.find({ category, isActive: true }).populate(
        "vendor",
        "name email"
      ),
      query
    )
      .search(ProductSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await productQuery.modelQuery;
    const meta = await productQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const updateProduct = async (
  id: string,
  payload: Partial<TProduct>,
  vendorId?: string
): Promise<TProduct> => {
  try {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Check if vendor is updating their own product (unless admin)
    if (vendorId && product.vendor.toString() !== vendorId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only update your own products"
      );
    }

    // Check slug uniqueness if being updated
    if (payload.slug && payload.slug !== product.slug) {
      const existingProduct = await Product.findOne({ slug: payload.slug });
      if (existingProduct) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Product with this slug already exists"
        );
      }
    }

    const result = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("vendor", "name email");

    return result!;
  } catch (error) {
    throw error;
  }
};

const deleteProduct = async (id: string, vendorId?: string): Promise<void> => {
  try {
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Check if vendor is deleting their own product (unless admin)
    if (vendorId && product.vendor.toString() !== vendorId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only delete your own products"
      );
    }

    await Product.findByIdAndDelete(id);
  } catch (error) {
    throw error;
  }
};

const incrementDownloadCount = async (id: string): Promise<void> => {
  try {
    await Product.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
};

const updateProductStats = async (
  id: string,
  salesCount: number,
  revenue: number
): Promise<void> => {
  try {
    await Product.findByIdAndUpdate(
      id,
      {
        $inc: {
          totalSales: salesCount,
          revenue: revenue,
        },
      },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
};

const searchProducts = async (
  searchTerm: string,
  filters: TProductFilter = {}
) => {
  try {
    const query: any = {
      isActive: true,
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { shortDescription: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
    };

    // Apply additional filters
    if (filters.category) query.category = filters.category;
    if (filters.type) query.type = filters.type;
    if (filters.minPrice !== undefined)
      query.price = { $gte: filters.minPrice };
    if (filters.maxPrice !== undefined)
      query.price = { ...query.price, $lte: filters.maxPrice };
    if (filters.vendor) query.vendor = filters.vendor;

    const result = await Product.find(query)
      .populate("vendor", "name email")
      .sort({ totalSales: -1, createdAt: -1 });

    return result;
  } catch (error) {
    throw error;
  }
};

export const ProductServices = {
  createProduct,
  getAllProducts,
  getAllProductsForAdmin,
  getProductById,
  getProductBySlug,
  getProductsByVendor,
  getFeaturedProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  incrementDownloadCount,
  updateProductStats,
  searchProducts,
};
