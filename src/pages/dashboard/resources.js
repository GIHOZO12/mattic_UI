const text = (name, label, extra = {}) => ({
  name,
  label,
  type: "text",
  ...extra,
});
const number = (name, label, extra = {}) => ({
  name,
  label,
  type: "number",
  min: 0,
  ...extra,
});
const select = (name, label, source, extra = {}) => ({
  name,
  label,
  type: "select",
  source,
  ...extra,
});
const check = (name, label, value = true) => ({
  name,
  label,
  type: "checkbox",
  default: value,
});
export const resources = {
  products: {
    title: "Products",
    description: "Thoughtful pieces, ready for their next occasion.",
    columns: ["name", "category", "base_price", "sale_price", "is_active"],
    search: true,
    filters: [
      {
        name: "is_active",
        label: "Availability",
        options: [
          ["true", "Active"],
          ["false", "Inactive"],
        ],
      },
    ],
    fields: [
      text("name", "Product name", { required: true }),
      text("slug", "URL slug", {
        hint: "Leave empty to generate automatically.",
      }),
      select("category", "Category / subcategory", "categories", {
        required: true,
      }),
      select("brand", "Brand", "brands", { nullable: true }),
      text("image", "Product image", {
        type: "file",
        createOnly: true,
        hint: "This becomes the main image on your store's product listing. JPG, PNG or WEBP, up to 5 MB.",
      }),
      text("short_description", "Short description"),
      text("description", "Description", { type: "textarea" }),
      text("material", "Material"),
      number("base_price", "Regular price", { required: true, step: "0.01" }),
      number("sale_price", "Sale price", { nullable: true, step: "0.01" }),
      check("featured", "Featured in the store edit", false),
      check("is_active", "Visible in the store"),
    ],
  },
  categories: {
    title: "Categories",
    description:
      "Organize the collection, from broad categories to specific edits.",
    columns: ["name", "parent", "is_active"],
    search: true,
    fields: [
      text("name", "Category name", { required: true }),
      text("slug", "URL slug"),
      text("description", "Description", { type: "textarea" }),
      select("parent", "Parent category", "categories", { nullable: true }),
      text("image", "Category image", { type: "file" }),
      check("is_active", "Active category"),
    ],
  },
  brands: {
    title: "Brands",
    description: "The names behind the collection.",
    columns: ["name", "slug", "is_active"],
    search: true,
    fields: [
      text("name", "Brand name", { required: true }),
      text("slug", "URL slug"),
      text("description", "Description", { type: "textarea" }),
      text("logo", "Brand logo", { type: "file" }),
      check("is_active", "Active brand"),
    ],
  },
  sizes: {
    title: "Sizes",
    description: "Keep sizing clear across the collection.",
    columns: ["name", "category", "order", "is_active"],
    fields: [
      text("name", "Size name", { required: true }),
      select("category", "Category (optional)", "categories", {
        nullable: true,
      }),
      number("order", "Display order", { default: 0 }),
      check("is_active", "Available size"),
    ],
  },
  colors: {
    title: "Colors",
    description: "The palette of your store.",
    columns: ["name", "hex_code", "is_active"],
    fields: [
      text("name", "Color name", { required: true }),
      text("hex_code", "Color hex code", {
        required: true,
        placeholder: "#FFFFFF",
        pattern: /^#[0-9a-fA-F]{6}$/,
      }),
      check("is_active", "Available color"),
    ],
  },
  inventory: {
    title: "Inventory",
    description: "A clear view of every size, color and piece in stock.",
    columns: [
      "product",
      "size_name",
      "color_name",
      "sku",
      "stock_quantity",
      "is_available",
    ],
    search: true,
    filters: [
      {
        name: "low_stock",
        label: "Stock level",
        options: [["true", "Low stock"]],
      },
      {
        name: "out_of_stock",
        label: "Availability",
        options: [["true", "Out of stock"]],
      },
    ],
    fields: [
      select("product", "Product", "products", { required: true }),
      select("size", "Size", "sizes", { required: true }),
      select("color", "Color", "colors", { required: true }),
      text("sku", "SKU / stock code", { required: true }),
      number("price", "Variant price override", {
        nullable: true,
        step: "0.01",
        hint: "Leave empty to use the product’s current price.",
      }),
      number("stock_quantity", "Available stock", {
        required: true,
        default: 0,
      }),
      check("is_available", "Available for purchase"),
    ],
  },
  coupons: {
    title: "Coupons",
    description: "A considered incentive for your customers.",
    columns: [
      "code",
      "discount_type",
      "value",
      "times_used",
      "end_date",
      "is_active",
    ],
    search: true,
    fields: [
      text("code", "Coupon code", { required: true }),
      select("discount_type", "Discount type", null, {
        required: true,
        options: [
          ["PERCENTAGE", "Percentage"],
          ["FIXED", "Fixed amount"],
        ],
      }),
      number("value", "Discount value", { required: true, step: "0.01" }),
      number("minimum_order", "Minimum order value", {
        default: 0,
        step: "0.01",
      }),
      text("start_date", "Starts at", {
        type: "datetime-local",
        required: true,
      }),
      text("end_date", "Ends at", { type: "datetime-local", required: true }),
      number("usage_limit", "Total usage limit", { nullable: true }),
      check("is_active", "Active coupon"),
    ],
  },
  reviews: {
    title: "Reviews",
    description: "Approve honest customer experiences for the storefront.",
    columns: ["product", "user", "rating", "title", "comment", "is_approved"],
    noCreate: true,
    filters: [
      {
        name: "is_approved",
        label: "Moderation",
        options: [
          ["false", "Awaiting approval"],
          ["true", "Approved"],
        ],
      },
    ],
    fields: [check("is_approved", "Approved for public display", false)],
  },
  orders: {
    title: "Orders",
    description: "From the first good choice to the final delivery.",
    columns: [
      "order_number",
      "customer_email",
      "created_at",
      "total_amount",
      "payment_status",
      "status",
    ],
    readOnly: true,
    search: true,
    dateFilter: true,
    filters: [
      {
        name: "status",
        label: "Order status",
        options: [
          "PENDING_PAYMENT",
          "PAYMENT_SUBMITTED",
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ].map((s) => [s, s.toLowerCase().replaceAll("_", " ")]),
      },
      {
        name: "payment_status",
        label: "Payment status",
        options: ["UNPAID", "PENDING_VERIFICATION", "PAID", "REJECTED"].map(
          (s) => [s, s.toLowerCase().replaceAll("_", " ")],
        ),
      },
    ],
  },
  payments: {
    title: "Payments",
    description: "Review the proof. Confirm with confidence.",
    columns: ["order_number", "customer", "amount", "submitted_at", "status"],
    readOnly: true,
    search: true,
    dateFilter: true,
    filters: [
      {
        name: "status",
        label: "Payment status",
        options: ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"].map((s) => [
          s,
          s.toLowerCase(),
        ]),
      },
    ],
  },
  customers: {
    title: "Customers",
    description: "The people who make your store.",
    columns: [
      "email",
      "first_name",
      "phone_number",
      "number_of_orders",
      "total_spent",
      "date_joined",
    ],
    readOnly: true,
    search: true,
  },
  settings: {
    title: "Store settings",
    description: "The essentials that make your store yours.",
    fields: [
      text("store_name", "Store name", { required: true }),
      text("logo", "Store logo", { type: "file" }),
      text("support_email", "Support email", { type: "email" }),
      text("support_phone", "Support phone", { type: "tel" }),
      text("currency", "Currency", {
        required: true,
        default: "RWF",
        maxLength: 3,
      }),
      number("shipping_fee", "Flat delivery fee", {
        required: true,
        default: 0,
        step: "0.01",
      }),
      number("free_shipping_threshold", "Free delivery from", {
        nullable: true,
        step: "0.01",
      }),
      number("low_stock_threshold", "Low-stock threshold", { default: 5 }),
      check("active", "Active store settings"),
    ],
  },
  "payment-settings": {
    title: "Mobile Money settings",
    description: "Publish clear payment details for every customer.",
    fields: [
      text("merchant_name", "Merchant name", { required: true }),
      text("momo_phone_number", "Mobile Money number", {
        type: "tel",
        required: true,
        default: "0784888458",
      }),
      text("payment_instructions", "Payment instructions", {
        type: "textarea",
        required: true,
      }),
      text("currency", "Currency", {
        required: true,
        default: "RWF",
        maxLength: 3,
      }),
      check("is_active", "Active payment settings"),
    ],
  },
};
export const columnLabels = {
  is_active: "Active",
  is_available: "Available",
  is_approved: "Approved",
  base_price: "Regular price",
  sale_price: "Sale price",
  stock_quantity: "Stock",
  size_name: "Size",
  color_name: "Color",
  total_amount: "Total",
  payment_status: "Payment",
  number_of_orders: "Orders",
  total_spent: "Total spent",
  created_at: "Placed",
  submitted_at: "Submitted",
  date_joined: "Joined",
  times_used: "Used",
  end_date: "Ends",
  hex_code: "Swatch",
  customer_email: "Customer",
};
