"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridToolbarQuickFilter,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  getGridStringOperators,
  type GridCallbackDetails,
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridFilterItem,
  type GridFilterOperator,
  type GridToolbarProps,
  type DataGridProps,
} from "@mui/x-data-grid";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";

type AppDataGridProps = DataGridProps & {
  searchPlaceholder?: string;
  showSearch?: boolean;
  showColumns?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
};

type AppGridToolbarProps = GridToolbarProps & {
  searchPlaceholder?: string;
  showSearch?: boolean;
  showColumns?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
};

function AppGridToolbar({
  searchPlaceholder,
  showSearch = true,
  showColumns = true,
  showFilters = true,
  showExport = true,
}: AppGridToolbarProps) {
  return (
    <GridToolbarContainer
      sx={{
        gap: 1.5,
        flexWrap: "wrap",
        justifyContent: "space-between",
        padding: "12px 12px 4px 12px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        {showSearch ? (
          <GridToolbarQuickFilter
            debounceMs={300}
            quickFilterParser={(value) => value.trim().split(/\s+/).filter(Boolean)}
            placeholder={searchPlaceholder ?? "Search..."}
          />
        ) : null}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {showFilters ? <GridToolbarFilterButton /> : null}
        {showColumns ? <GridToolbarColumnsButton /> : null}
        {showExport ? <GridToolbarExport /> : null}
      </Box>
    </GridToolbarContainer>
  );
}

export default function AppDataGrid({
  searchPlaceholder,
  showSearch = true,
  showColumns = true,
  showFilters = true,
  showExport = true,
  pageSizeOptions = [5, 10, 20, 50, 100],
  initialState,
  sx,
  autoHeight = true,
  disableRowSelectionOnClick = true,
  columns,
  rows,
  filterModel,
  onFilterModelChange,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  ...props
}: AppDataGridProps) {
  const [internalFilterModel, setInternalFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterExcludeHiddenColumns: false,
  });
  const baseSx: SystemStyleObject<Theme> = useMemo(
    () => ({
    "@keyframes gridDrop": {
      from: { opacity: 0, transform: "translateY(-6px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    border: "1px solid var(--border-1)",
    borderRadius: "18px",
    backgroundColor: "var(--surface-1)",
    color: "var(--text-1)",
    "& .MuiDataGrid-root, & .MuiDataGrid-main": {
      color: "var(--text-1)",
    },
    "& .MuiDataGrid-main": {
      order: 2,
      overflow: "visible",
    },
    "& .MuiDataGrid-toolbarContainer": {
      order: 0,
    },
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "var(--grid-header-bg)",
      backgroundImage: "none",
      color: "var(--text-2)",
      borderBottom: "1px solid var(--border-1)",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      fontSize: "11px",
    },
    "& .MuiDataGrid-columnHeader": {
      backgroundColor: "var(--grid-header-bg)",
      backgroundImage: "none",
      borderRight: "none",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 600,
    },
    "& .MuiDataGrid-cell": {
      borderColor: "transparent",
    },
    "& .MuiDataGrid-columnHeader:focus-within": {
      outline: "1px solid var(--accent)",
      outlineOffset: "-1px",
    },
    "& .MuiDataGrid-columnSeparator": {
      color: "transparent",
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "var(--surface-2)",
    },
    "& .MuiDataGrid-row.Mui-selected": {
      backgroundColor: "var(--nav-active-bg)",
    },
    "& .MuiDataGrid-row.Mui-selected:hover": {
      backgroundColor: "var(--nav-active-bg)",
    },
    "& .MuiDataGrid-footerContainer": {
      borderTop: "1px solid var(--border-1)",
      backgroundColor: "var(--surface-2)",
    },
    "& .MuiTablePagination-root": {
      color: "var(--text-2)",
    },
    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
      color: "var(--text-3)",
    },
    "& .MuiTablePagination-select, & .MuiTablePagination-actions button": {
      color: "var(--text-2)",
    },
    "& .MuiDataGrid-virtualScroller": {
      backgroundColor: "var(--surface-1)",
    },
    "& .MuiDataGrid-toolbarContainer .MuiButtonBase-root": {
      borderRadius: "999px",
      border: "1px solid var(--border-1)",
      color: "var(--text-2)",
      padding: "6px 12px",
    },
    "& .MuiDataGrid-toolbarContainer .MuiButtonBase-root:hover": {
      backgroundColor: "var(--surface-2)",
      color: "var(--text-1)",
    },
    "& .MuiDataGrid-toolbarQuickFilter": {
      minWidth: 240,
    },
    "& .MuiDataGrid-toolbarQuickFilter .MuiOutlinedInput-root": {
      backgroundColor: "var(--surface-1)",
      color: "var(--text-1)",
      borderRadius: "12px",
    },
    "& .MuiDataGrid-toolbarQuickFilter .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--border-1)",
    },
    "& .MuiDataGrid-toolbarQuickFilter .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--accent)",
    },
    "& .MuiDataGrid-toolbarQuickFilter .MuiOutlinedInput-input::placeholder": {
      color: "var(--text-3)",
      opacity: 1,
    },
    "& .MuiDataGrid-iconSeparator": {
      color: "var(--border-1)",
    },
    "& .MuiDataGrid-menu, & .MuiPaper-root": {
      backgroundColor: "var(--surface-1)",
      color: "var(--text-1)",
    },
    "& .MuiDataGrid-panel": {
      backgroundColor: "var(--surface-1)",
      color: "var(--text-1)",
      border: "1px solid var(--border-1)",
      borderRadius: "16px",
      boxShadow: "var(--shadow-1)",
      animation: "gridDrop 180ms ease-out",
      transformOrigin: "top right",
      order: 1,
      position: "static !important",
      inset: "auto !important",
      transform: "none !important",
      width: "calc(100% - 24px)",
      margin: "8px 12px 0",
    },
    "& .MuiDataGrid-panelContent": {
      padding: "12px 14px",
    },
    "& .MuiDataGrid-panelContent, & .MuiDataGrid-panelContent *": {
      color: "var(--text-1)",
    },
    "& .MuiDataGrid-filterForm": {
      gap: 12,
      padding: 0,
    },
    "& .MuiDataGrid-panelFooter": {
      borderTop: "1px solid var(--border-1)",
      padding: "8px 12px",
    },
    "& .MuiMenuItem-root:hover": {
      backgroundColor: "var(--surface-2)",
    },
    "& .MuiCheckbox-root, & .MuiSvgIcon-root": {
      color: "var(--text-2)",
    },
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
      outline: "1px solid var(--accent)",
      outlineOffset: "-1px",
    },
    "& .MuiDataGrid-filterFormColumnInput": {
      minWidth: 220,
    },
  }),
    []
  );

  const mergedInitialState = useMemo(
    () => ({
      pagination: {
        paginationModel: {
          pageSize: 5,
          page: 0,
          ...initialState?.pagination?.paginationModel,
        },
      },
      filter: {
        filterModel: {
          items: [],
          quickFilterExcludeHiddenColumns: false,
          ...(initialState?.filter?.filterModel ?? {}),
        },
      },
      ...initialState,
    }),
    [initialState]
  );

  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel, details?: GridCallbackDetails) => {
      if (onColumnVisibilityModelChange) {
        onColumnVisibilityModelChange(model, (details ?? {}) as GridCallbackDetails);
      }
    },
    [onColumnVisibilityModelChange]
  );

  const handleFilterModelChange = useCallback(
    (model: GridFilterModel, details?: GridCallbackDetails) => {
      setInternalFilterModel(model);
      if (onFilterModelChange) {
        onFilterModelChange(model, (details ?? {}) as GridCallbackDetails);
      }
    },
    [onFilterModelChange]
  );

  const activeFilterModel = filterModel ?? internalFilterModel;

  const rowsArray = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
  const rowIdGetter = props.getRowId;

  const rowById = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const row of rowsArray) {
      const id =
        typeof rowIdGetter === "function"
          ? rowIdGetter(row)
          : (row as Record<string, unknown>)?.id;
      if (id !== undefined) {
        map.set(String(id), row as Record<string, unknown>);
      }
    }
    return map;
  }, [rowIdGetter, rowsArray]);

  const normalizeFilterValue = useCallback((value: unknown) => {
    if (value === null || value === undefined) return "";
    return String(value).trim().toLowerCase();
  }, []);

  const resolveCellValue = useCallback(
    (params: { value?: unknown; row?: unknown; id?: unknown }, field?: string) => {
      if (field && params?.row && typeof params.row === "object") {
        const rowValue = (params.row as Record<string, unknown>)[field];
        if (rowValue !== undefined) return rowValue;
      }
      if (field && params?.id !== undefined) {
        const row = rowById.get(String(params.id));
        if (row) {
          const rowValue = row[field];
          if (rowValue !== undefined) return rowValue;
        }
      }
      if (params?.value !== undefined) return params.value;
      return undefined;
    },
    [rowById]
  );

  const stringOperators: GridFilterOperator[] = useMemo(() => {
    const operators = getGridStringOperators();
    return operators.map((operator) => {
      if (!["contains", "equals", "startsWith", "endsWith", "isEmpty", "isNotEmpty", "isAnyOf"].includes(operator.value)) {
        return operator;
      }
      return {
        ...operator,
        getApplyFilterFn: (filterItem: GridFilterItem) => {
          const filterValue = normalizeFilterValue(filterItem.value);
          if (!filterValue && !["isEmpty", "isNotEmpty"].includes(operator.value)) return null;
          return (params) => {
            const raw = resolveCellValue(params, filterItem.field);
            const cellValue = normalizeFilterValue(raw);
            if (filterItem.field === "host_name" || filterItem.field === "visitor_name") {
              console.log("[AppDataGrid] filter compare", {
                field: filterItem.field,
                operator: operator.value,
                filterValue,
                cellValue,
                raw,
                id: params.id,
              });
            }
            if (operator.value === "isEmpty") return cellValue === "";
            if (operator.value === "isNotEmpty") return cellValue !== "";
            if (operator.value === "equals") return cellValue === filterValue;
            if (operator.value === "startsWith") return cellValue.startsWith(filterValue);
            if (operator.value === "endsWith") return cellValue.endsWith(filterValue);
            if (operator.value === "contains") return cellValue.includes(filterValue);
            if (operator.value === "isAnyOf") {
              const values = Array.isArray(filterItem.value)
                ? filterItem.value.map((v) => normalizeFilterValue(v)).filter(Boolean)
                : [];
              return values.includes(cellValue);
            }
            return false;
          };
        },
      };
    });
  }, [normalizeFilterValue, resolveCellValue]);

  const columnsWithFilterability = useMemo(() => {
    return (columns ?? []).map((col) => {
      if (col.filterOperators && col.filterOperators.length > 0) return col;
      if (!col.type || col.type === "string") {
        return { ...col, filterOperators: stringOperators };
      }
      return col;
    });
  }, [columns, stringOperators]);

  const filteredRows = useMemo(() => {
    const items = (activeFilterModel?.items ?? []).filter((item) => item.field && item.operator);
    const quickValues = (activeFilterModel?.quickFilterValues ?? []).map((v) => normalizeFilterValue(v)).filter(Boolean);

    if (!items.length && quickValues.length === 0) return rowsArray;

    return rowsArray.filter((row) => {
      const matchesFilters = items.every((item) => {
        const column = columnsWithFilterability.find((col) => col.field === item.field);
        if (!column) return true;
        const rawValue = column.valueGetter
          ? (column.valueGetter as unknown as (params: { row: unknown; value?: unknown; field?: string }) => unknown)({
              row,
              value: (row as Record<string, unknown>)[item.field as string],
              field: item.field,
            })
          : (row as Record<string, unknown>)[item.field as string];
        const cellValue = normalizeFilterValue(rawValue);
        const filterValue = normalizeFilterValue(item.value);

        switch (item.operator) {
          case "contains":
            return filterValue ? cellValue.includes(filterValue) : true;
          case "equals":
          case "is":
            return filterValue ? cellValue === filterValue : true;
          case "startsWith":
            return filterValue ? cellValue.startsWith(filterValue) : true;
          case "endsWith":
            return filterValue ? cellValue.endsWith(filterValue) : true;
          case "isEmpty":
            return cellValue === "";
          case "isNotEmpty":
            return cellValue !== "";
          case "isAnyOf": {
            const values = Array.isArray(item.value)
              ? item.value.map((v) => normalizeFilterValue(v)).filter(Boolean)
              : [];
            return values.length ? values.includes(cellValue) : true;
          }
          default:
            return true;
        }
      });
      if (!matchesFilters) return false;

      if (!quickValues.length) return true;
      const rowText = columnsWithFilterability
        .map((col) => {
          const value = (row as Record<string, unknown>)[col.field as string];
          const getQuickFilterText = (col as { getQuickFilterText?: (params: { row: unknown; value?: unknown; field?: string }) => unknown })
            .getQuickFilterText;
          if (getQuickFilterText) {
            return String(
              getQuickFilterText({
                row,
                value,
                field: col.field,
              }) ?? ""
            );
          }
          return String(value ?? "");
        })
        .join(" ")
        .toLowerCase();

      return quickValues.every((q) => rowText.includes(q));
    });
  }, [activeFilterModel, columnsWithFilterability, normalizeFilterValue, rowsArray]);

  const hasAllowedFilters = useMemo(
    () => columnsWithFilterability.some((col) => col.filterable !== false),
    [columnsWithFilterability]
  );

  const autoHeightOverrides: SystemStyleObject<Theme> | null = autoHeight
    ? null
    : {
        "& .MuiDataGrid-main": {
          overflow: "hidden",
        },
        "& .MuiDataGrid-virtualScroller": {
          overflow: "auto",
        },
      };

  return (
    <DataGrid
      pagination
      autoHeight={autoHeight}
      hideFooterSelectedRowCount
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      showCellVerticalBorder={false}
      showColumnVerticalBorder={false}
      filterMode="server"
      columns={columnsWithFilterability}
      pageSizeOptions={pageSizeOptions}
      initialState={mergedInitialState}
      rows={filteredRows}
      {...(filterModel
        ? { filterModel, onFilterModelChange: handleFilterModelChange }
        : { filterModel: internalFilterModel, onFilterModelChange: handleFilterModelChange })}
      {...(columnVisibilityModel ? { columnVisibilityModel } : {})}
      onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
      slots={{
        toolbar: AppGridToolbar,
      }}
      slotProps={{
        toolbar: {
          searchPlaceholder,
          showSearch,
          showColumns,
          showFilters: showFilters && hasAllowedFilters,
          showExport,
        },
        panel: {
          disablePortal: true,
        },
      }}
      sx={
        sx
          ? Array.isArray(sx)
            ? ([
                baseSx,
                ...(autoHeightOverrides ? [autoHeightOverrides] : []),
                ...sx,
              ] as SxProps<Theme>)
            : ([baseSx, ...(autoHeightOverrides ? [autoHeightOverrides] : []), sx] as SxProps<Theme>)
          : ([baseSx, ...(autoHeightOverrides ? [autoHeightOverrides] : [])] as SxProps<Theme>)
      }
      {...props}
    />
  );
}

export type { GridColDef };
