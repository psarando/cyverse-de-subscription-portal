import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

type EmptyTableProps = {
    message: React.ReactNode;
    numColumns: number;
};

/**
 * A component for displaying a message in a table when the table doesn't otherwise have
 * data to display
 */
function EmptyTable(props: EmptyTableProps) {
    const { message, numColumns } = props;
    return (
        <TableRow>
            <TableCell colSpan={numColumns}>
                <Typography component="p">{message}</Typography>
            </TableCell>
        </TableRow>
    );
}

export default EmptyTable;
