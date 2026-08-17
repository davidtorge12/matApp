export type CodeType = {
  _id: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  unit?: string;
  price?: string;
  materials: string;
  comments?: string;
  info?: string;
};

export type MaterialsType = {
  id: string;
  material: string;
  price: number;
  units: number;
};
