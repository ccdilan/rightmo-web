export type User = { id: number; name: string; email: string };
export type Category = { id: number; name: string };
export type Product = {
  id: number;
  name: string;
  description: string | null;
  category: Category;
  price: string;
  rating: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};
export type ApiErrorBody = {
  message: string;
  errors?: Record<string, string[]>;
};
export type ProductPage = {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
};
export type SearchParams = Record<string, string | string[] | undefined>;
