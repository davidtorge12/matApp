import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { v4 as uuidv4 } from "uuid";
import CopyButton from "./CopyButton";
import { parseMaterialLine } from "../parseMaterials";
import { MaterialsType } from "../types";

export default function MaterialsList({
  address,
  width,
  allMaterials,
  setAllMaterials,
  total,
  onSavePrice,
}: {
  address: string;
  width: number;
  allMaterials: MaterialsType[];
  setAllMaterials: (
    value: MaterialsType[] | ((prev: MaterialsType[]) => MaterialsType[])
  ) => void;
  total: number;
  onSavePrice: (material: string, price: string) => void;
}) {
  if (!allMaterials.length) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "3px",
        marginBottom: "15px",
        flexDirection: "column",
        width: width < 700 ? `${width - 50}px` : "700px",
      }}
    >
      <h5>{address}</h5>
      {allMaterials.map(({ id, material, price, units }: MaterialsType) => (
        <div
          key={id}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "3px",
            marginBottom: "5px",
          }}
        >
          <input
            value={material}
            style={{
              width: "60%",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
            }}
            onChange={(e) => {
              const mat = e.target.value;
              const parsed = parseMaterialLine(mat);
              setAllMaterials((prev) =>
                prev.map((m: MaterialsType) =>
                  m.id === id
                    ? {
                        ...m,
                        material: mat,
                        units: parsed?.units || 1,
                      }
                    : m
                )
              );
            }}
          />

          <input
            value={price}
            disabled={!material}
            type="number"
            min={0}
            step={0.1}
            style={{
              textAlign: "right",
              width: "40%",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
            }}
            onChange={(e) => {
              setAllMaterials((prev) =>
                prev.map((m: MaterialsType) =>
                  m.id === id
                    ? {
                        ...m,
                        price: parseFloat(e.target.value) || 0,
                      }
                    : m
                )
              );
            }}
            onBlur={() => {
              const parsed = parseMaterialLine(material);
              onSavePrice(parsed?.name || material, price.toString());
            }}
            onFocus={(e) => e.target.select()}
          />
          <input
            value={`x ${units} =           ${price * units} £`}
            readOnly
            style={{
              textAlign: "right",
              width: "20%",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
            }}
          />
          <IconButton
            sx={{ width: "36px" }}
            onClick={() =>
              setAllMaterials(allMaterials.filter((m) => m.id !== id))
            }
          >
            <ClearIcon color="primary" />
          </IconButton>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <IconButton
          sx={{ width: "36px" }}
          onClick={() =>
            setAllMaterials([
              ...allMaterials,
              {
                id: uuidv4(),
                material: "",
                price: 0,
                units: 0,
              },
            ])
          }
        >
          <AddIcon color="primary" />
        </IconButton>

        <CopyButton
          address={address}
          materials={allMaterials.map((m) => m.material)}
          units={allMaterials.map((m) => m.units)}
          txt="list"
        />

        <CopyButton
          address={address}
          materials={allMaterials.map((m) => m.material)}
          prices={allMaterials.map((m) => m.price)}
          units={allMaterials.map((m) => m.units)}
          total={total}
          txt="with price"
        />

        <h4>Total: {total}</h4>
      </div>
    </div>
  );
}
