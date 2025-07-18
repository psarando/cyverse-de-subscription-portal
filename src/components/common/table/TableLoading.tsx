/**
 * A component for showing a loading skeleton for a table.
 * The skeleton will be text boxes in the shape of however many rows
 * and columns.
 *
 * @author aramsey, psarando
 */
import { Skeleton, TableBody, TableCell, TableRow } from "@mui/material";

function TableLoading({
    numColumns,
    numRows,
}: {
    numColumns: number;
    numRows: number;
}) {
    const arrayRows = [...Array(numRows)];
    const arrayColumns = [...Array(numColumns)];

    return (
        <TableBody>
            {arrayRows.map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {arrayColumns.map((_, colIndex) => (
                        <TableCell key={colIndex}>
                            <Skeleton variant="text" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    );
}

export default TableLoading;
