/**
 * A general purpose dialog
 *
 * @author sriram, psarando
 */
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogProps,
    DialogTitle,
    IconButton,
    useMediaQuery,
    useTheme,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

function DEDialog(
    props: DialogProps & {
        title?: React.ReactNode;
        onClose: React.MouseEventHandler;
        actions?: React.ReactNode;
    },
) {
    const {
        open,
        title,
        onClose,
        actions,
        maxWidth = "sm",
        fullWidth = true,
        children,
        ...dialogProps
    } = props;
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            fullScreen={fullScreen}
            {...dialogProps}
        >
            <DialogTitle>
                {title}
                <IconButton
                    aria-label="close"
                    size="large"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: theme.spacing(0.5),
                        top: theme.spacing(0.5),
                        m: 0,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>{children}</DialogContent>
            {actions && <DialogActions>{actions}</DialogActions>}
        </Dialog>
    );
}

export default DEDialog;
