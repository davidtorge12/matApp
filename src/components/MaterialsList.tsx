import * as React from "react";
import { DataGrid, GridColDef, GridRowsProp } from "@mui/x-data-grid";
import { randomCreatedDate, randomTraderName, randomUpdatedDate } from "@mui/x-data-grid-generator";

export default function MaterialsList({
  materials,
  prices,
  setPrices,
}: {
  materials: string;
  prices: number[];
  setPrices: any;
}) {
  const materialsArr = materials.split("\n");

  const onChange = (e: any) => {
    console.log(e);
    // setPrices([
    //   ...prices.map((p, i) => {
    //     if (e?.editRows?.[i]) {
    //       const newPrice = e.editRows[i].price.value;
    //       return newPrice ? newPrice : p;
    //     }
    //     return p;
    //   }),
    // ]);
  };

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        paginationMode="client"
        rows={materialsArr.map((m, i) => {
          return { id: i, material: m, price: prices[i] };
        })}
        columns={columns}
        density="compact"
        onStateChange={onChange}
      />
    </div>
  );
}

const columns: GridColDef[] = [
  { field: "material", headerName: "Materials", width: 270, editable: true },
  { field: "price", headerName: "Price", type: "number", editable: true, align: "right" },
];
