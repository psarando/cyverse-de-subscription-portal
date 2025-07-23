/**
 * A custom Table row with banding:
 * https://mui.com/material-ui/react-table/#customization
 *
 * @author sriram, psarando
 */
import { styled } from "@mui/material/styles";
import TableRow from "@mui/material/TableRow";

export const DERow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": [
        {
            backgroundColor: theme.palette.cyverse.bgGray,
        },
        theme.applyStyles("dark", {
            backgroundColor: theme.palette.cyverse.blueGrey,
        }),
    ],
}));
