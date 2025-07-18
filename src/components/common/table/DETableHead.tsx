/**
 * Custom table header
 *
 * @author sriram, psarando
 */

import DECheckbox from "../DECheckbox";

import {
    CheckboxProps,
    TableCell,
    TableCellProps,
    TableHead,
    TableRow,
    TableSortLabel,
    TableSortLabelProps,
    Tooltip,
} from "@mui/material";

type DETableHeadColumnData = {
    key?: string;
    name?: string;
    align?: TableCellProps["align"];
    padding?: TableCellProps["padding"];
    numeric?: boolean;
    enableSorting?: boolean;
};

type DETableHeadProps = {
    columnData: Array<DETableHeadColumnData>;
    selectable?: boolean;
    numSelected?: number;
    onRequestSort?: Function;
    onSelectAllClick?: CheckboxProps["onChange"];
    padding?: TableCellProps["padding"];
    order?: TableCellProps["sortDirection"] & TableSortLabelProps["direction"];
    orderBy?: string;
    rowsInPage?: number;
    sortLabel?: string;
    selectAllLabel?: string;
};

export default function DETableHead(props: DETableHeadProps) {
    const {
        onSelectAllClick,
        order,
        orderBy,
        numSelected,
        columnData,
        selectable = false,
        padding,
        rowsInPage,
        selectAllLabel = "Select All",
        sortLabel = "Sort",
        onRequestSort,
    } = props;

    const createSortHandler =
        (property?: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
            onRequestSort && onRequestSort(event, property);
        };

    const getColumnAlignment = (column: DETableHeadColumnData) => {
        if (column.align) {
            return column.align;
        } else if (column.numeric) {
            return "right";
        } else {
            return "inherit";
        }
    };

    const isInDeterminate =
        (numSelected ?? 0) > 0 && numSelected !== rowsInPage;

    return (
        <TableHead>
            <TableRow>
                {selectable && (
                    <TableCell padding={padding ? padding : "checkbox"}>
                        <DECheckbox
                            indeterminate={isInDeterminate}
                            checked={numSelected === rowsInPage}
                            onChange={onSelectAllClick}
                            slotProps={{
                                input: { "aria-label": selectAllLabel },
                            }}
                        />
                    </TableCell>
                )}
                {columnData.map((column) => {
                    const key = column.key || column.name;
                    const align = getColumnAlignment(column);
                    return (
                        <TableCell
                            key={key}
                            variant="head"
                            align={align}
                            padding={column.padding || padding || "normal"}
                            sortDirection={orderBy === key ? order : false}
                        >
                            {column.enableSorting ? (
                                <Tooltip
                                    title={sortLabel}
                                    placement={
                                        column.numeric
                                            ? "bottom-end"
                                            : "bottom-start"
                                    }
                                    enterDelay={300}
                                >
                                    <TableSortLabel
                                        active={orderBy === key}
                                        direction={order}
                                        onClick={
                                            onRequestSort &&
                                            createSortHandler(key)
                                        }
                                    >
                                        {column.name}
                                    </TableSortLabel>
                                </Tooltip>
                            ) : (
                                column.name
                            )}
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );
}
