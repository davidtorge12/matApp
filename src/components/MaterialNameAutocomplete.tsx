import type { CSSProperties } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { applyMaterialSuggestion, suggestMaterials } from "../suggestMaterials";

export default function MaterialNameAutocomplete({
  value,
  onChange,
  onBlur,
  names,
  ariaLabel,
  inputStyle,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  names: string[];
  ariaLabel: string;
  inputStyle?: CSSProperties;
}) {
  const options = suggestMaterials(value, names);

  return (
    <Autocomplete
      freeSolo
      options={options}
      filterOptions={(listed) => listed}
      inputValue={value}
      onInputChange={(_event, next, reason) => {
        if (reason === "input" || reason === "clear") {
          onChange(next);
        }
      }}
      onChange={(_event, selected) => {
        if (typeof selected !== "string" || !selected) {
          return;
        }
        onChange(applyMaterialSuggestion(value, selected));
      }}
      forcePopupIcon={false}
      sx={{ minWidth: 0, width: "100%" }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          inputProps={{
            ...params.inputProps,
            "aria-label": ariaLabel,
            autoCorrect: "off",
            spellCheck: false,
            onBlur: (event) => {
              params.inputProps.onBlur?.(
                event as Parameters<
                  NonNullable<typeof params.inputProps.onBlur>
                >[0],
              );
              onBlur?.();
            },
            style: {
              ...(typeof params.inputProps.style === "object"
                ? params.inputProps.style
                : undefined),
              ...inputStyle,
            },
          }}
        />
      )}
    />
  );
}
