/**
 * A component that can be used to allow a user to contact support.
 */
import constants from "@/constants";

import { Button } from "@mui/material";
import LiveHelpIcon from "@mui/icons-material/LiveHelp";

const ContactSupport = () => {
    const handleContactSupport = () => {
        window.open(constants.CYVERSE_SUPPORT_URL, "_blank", "noopener");
    };

    return (
        <Button
            sx={{ marginLeft: "auto" }}
            color="primary"
            startIcon={<LiveHelpIcon />}
            onClick={handleContactSupport}
        >
            Contact Support
        </Button>
    );
};

export default ContactSupport;
